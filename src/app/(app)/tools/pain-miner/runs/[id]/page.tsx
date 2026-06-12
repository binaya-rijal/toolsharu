import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Coins, FileText, MessageSquare } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import IdeaCard, { type DisplayIdea } from "@/components/tools/painminer/IdeaCard";

export const dynamic = "force-dynamic";

interface IdeaRow {
    id: string;
    title: string;
    problem: string;
    demand_level: "low" | "medium" | "high";
    demand_evidence: string | null;
    competitors: { name: string; weakness: string }[] | null;
    gaps: string[] | null;
    monetization: string | null;
    pricing_hint: string | null;
    target_user: string | null;
    confidence: number;
}

export default async function RunDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    if (!isSupabaseConfigured()) redirect("/tools/pain-miner");
    const supabase = await createClient();
    if (!supabase) redirect("/tools/pain-miner");

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect(`/login?next=/tools/pain-miner/runs/${id}`);

    // RLS scopes all of these to the current user automatically.
    const { data: run } = await supabase
        .from("runs")
        .select(
            "id, subreddit, time_window, model, total_threads_scraped, total_comments_scraped, input_tokens, output_tokens, est_cost_usd, status, error, created_at"
        )
        .eq("id", id)
        .maybeSingle();

    if (!run) notFound();

    const { data: ideaRows } = await supabase
        .from("ideas")
        .select(
            "id, title, problem, demand_level, demand_evidence, competitors, gaps, monetization, pricing_hint, target_user, confidence"
        )
        .eq("run_id", id);

    const { data: threads } = await supabase
        .from("threads")
        .select("id, title, url")
        .eq("run_id", id);

    const ideaIds = (ideaRows ?? []).map((i) => i.id);
    const { data: sources } = ideaIds.length
        ? await supabase
              .from("idea_sources")
              .select("idea_id, thread_id, quote")
              .in("idea_id", ideaIds)
        : { data: [] as { idea_id: string; thread_id: string | null; quote: string | null }[] };

    const threadById = new Map((threads ?? []).map((t) => [t.id, t]));

    const ideas: DisplayIdea[] = (ideaRows ?? []).map((row: IdeaRow) => {
        const ideaSources = (sources ?? [])
            .filter((s) => s.idea_id === row.id)
            .map((s) => {
                const t = s.thread_id ? threadById.get(s.thread_id) : undefined;
                return { url: t?.url ?? "", title: t?.title ?? "Source thread", quote: s.quote ?? "" };
            })
            .filter((s) => s.url);
        return {
            title: row.title,
            problem: row.problem,
            demand_level: row.demand_level,
            demand_evidence: row.demand_evidence ?? "",
            competitors: row.competitors ?? [],
            gaps: row.gaps ?? [],
            monetization: row.monetization ?? "",
            pricing_hint: row.pricing_hint ?? "",
            target_user: row.target_user ?? "",
            confidence: Number(row.confidence),
            sources: ideaSources,
        };
    });

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href="/tools/pain-miner/history"
                    className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft size={13} /> Back to history
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">
                    r/{run.subreddit}
                    <span className="ml-2 text-base font-normal text-muted-foreground">
                        · {run.time_window}
                    </span>
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <FileText size={13} /> {run.total_threads_scraped} threads
                    </span>
                    <span className="flex items-center gap-1.5">
                        <MessageSquare size={13} /> {run.total_comments_scraped} comments
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Coins size={13} /> {run.input_tokens + run.output_tokens} tokens · $
                        {Number(run.est_cost_usd).toFixed(4)}
                    </span>
                    <span>{run.model}</span>
                    <span>{new Date(run.created_at).toLocaleString()}</span>
                </div>
            </div>

            {run.status === "error" && (
                <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                    This run failed: {run.error}
                </p>
            )}

            {ideas.length === 0 ? (
                <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                    No ideas were stored for this run.
                </p>
            ) : (
                <div className="grid gap-5 lg:grid-cols-2">
                    {ideas.map((idea, i) => (
                        <IdeaCard key={i} idea={idea} />
                    ))}
                </div>
            )}
        </div>
    );
}
