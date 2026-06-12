import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Clock, FileText, Lightbulb, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
    completed: {
        cls: "bg-emerald-500/15 text-emerald-300",
        icon: <CheckCircle2 size={12} />,
        label: "completed",
    },
    running: { cls: "bg-amber-500/15 text-amber-300", icon: <Loader2 size={12} />, label: "running" },
    error: { cls: "bg-rose-500/15 text-rose-300", icon: <XCircle size={12} />, label: "error" },
};

export default async function HistoryPage() {
    if (!isSupabaseConfigured()) redirect("/tools/pain-miner");
    const supabase = await createClient();
    if (!supabase) redirect("/tools/pain-miner");

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login?next=/tools/pain-miner/history");

    const { data: runs } = await supabase
        .from("runs")
        .select("id, subreddit, time_window, status, total_threads_scraped, est_cost_usd, created_at, ideas(count)")
        .order("created_at", { ascending: false })
        .limit(50);

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href="/tools/pain-miner"
                    className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft size={13} /> Back to PainMiner
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Run history</h1>
                <p className="mt-2 text-muted-foreground">Reopen any past analysis.</p>
            </div>

            {!runs?.length ? (
                <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
                    No runs yet. Analyze a subreddit to see it here.
                </div>
            ) : (
                <ul className="space-y-3">
                    {runs.map((run) => {
                        const badge = STATUS_BADGE[run.status] ?? STATUS_BADGE.running;
                        const ideaCount =
                            Array.isArray(run.ideas) && run.ideas[0]
                                ? (run.ideas[0] as { count: number }).count
                                : 0;
                        return (
                            <li key={run.id}>
                                <Link
                                    href={`/tools/pain-miner/runs/${run.id}`}
                                    className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:border-primary/60"
                                >
                                    <span className="font-semibold">r/{run.subreddit}</span>
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.cls}`}
                                    >
                                        {badge.icon} {badge.label}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Lightbulb size={13} /> {ideaCount} ideas
                                    </span>
                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <FileText size={13} /> {run.total_threads_scraped} threads
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {run.time_window} · ${Number(run.est_cost_usd).toFixed(4)}
                                    </span>
                                    <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Clock size={13} />
                                        {new Date(run.created_at).toLocaleString()}
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
