import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CONFIG, estCostUsd, type TimeWindow } from "@/lib/painminer/config";
import { fetchComments, fetchPosts } from "@/lib/painminer/reddit";
import {
    buildAnalystPayload,
    buildCleanThread,
    rankThreads,
    type CleanThread,
} from "@/lib/painminer/signal";
import { analyze } from "@/lib/painminer/freemodel";
import type {
    PersistedIdea,
    ProgressEvent,
    RunMeta,
    Stage,
} from "@/lib/painminer/schema";

export const runtime = "nodejs";
export const maxDuration = 120;

const VALID_WINDOWS: TimeWindow[] = ["day", "week", "month", "year", "all"];

// Simple in-memory per-user rate limiter (best-effort; resets on cold start).
const hits = new Map<string, number[]>();
function rateLimited(userId: string): boolean {
    const now = Date.now();
    const windowStart = now - CONFIG.RATE_LIMIT_WINDOW_MS;
    const recent = (hits.get(userId) ?? []).filter((t) => t > windowStart);
    if (recent.length >= CONFIG.RATE_LIMIT_MAX) return true;
    recent.push(now);
    hits.set(userId, recent);
    return false;
}

export async function POST(request: Request) {
    // --- Auth gate -------------------------------------------------------
    const supabase = await createClient();
    if (!supabase) {
        return NextResponse.json(
            { error: "Supabase is not configured. See README setup steps." },
            { status: 503 }
        );
    }
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (rateLimited(user.id)) {
        return NextResponse.json(
            { error: "Rate limit exceeded. Please wait a moment and try again." },
            { status: 429 }
        );
    }

    // --- Input -----------------------------------------------------------
    let subreddit = "";
    let timeWindow: TimeWindow = "week";
    try {
        const body = await request.json();
        subreddit = String(body.subreddit ?? "").trim().replace(/^\/?r\//i, "");
        const tw = String(body.timeWindow ?? "week");
        if ((VALID_WINDOWS as string[]).includes(tw)) timeWindow = tw as TimeWindow;
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    if (!subreddit) {
        return NextResponse.json({ error: "Subreddit or keyword is required" }, { status: 400 });
    }
    if (!process.env.FREEMODEL_API_KEY) {
        return NextResponse.json({ error: "FREEMODEL_API_KEY is not configured" }, { status: 503 });
    }

    const admin = createAdminClient(); // null => persistence disabled, run still streams
    const userId = user.id;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const send = (event: ProgressEvent) =>
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            const progress = (stage: Stage, pct: number, detail?: string) =>
                send({ type: "progress", stage, pct, detail });

            let runId: string | null = null;
            const nowSec = Math.floor(Date.now() / 1000);

            try {
                // Create the run row up front (status running).
                if (admin) {
                    const { data, error } = await admin
                        .from("runs")
                        .insert({
                            user_id: userId,
                            subreddit,
                            time_window: timeWindow,
                            status: "running",
                            model: CONFIG.FREEMODEL_MODEL,
                        })
                        .select("id")
                        .single();
                    if (error) throw new Error(`DB insert run: ${error.message}`);
                    runId = data.id;
                }

                // --- Cache lookup -------------------------------------------
                let cleanThreads: CleanThread[] | null = null;
                let cached = false;
                if (admin) {
                    const ttlMs = CONFIG.CACHE_TTL_HOURS * 3600 * 1000;
                    const { data: cache } = await admin
                        .from("reddit_cache")
                        .select("payload, fetched_at")
                        .eq("subreddit", subreddit)
                        .eq("time_window", timeWindow)
                        .maybeSingle();
                    if (cache && Date.now() - new Date(cache.fetched_at).getTime() < ttlMs) {
                        const payload = cache.payload as { cleanThreads?: CleanThread[] };
                        if (payload.cleanThreads?.length) {
                            cleanThreads = payload.cleanThreads;
                            cached = true;
                        }
                    }
                }

                // --- Stage a: fetch posts -----------------------------------
                progress("Fetching threads", 8, cached ? "Using cached fetch" : `r/${subreddit}`);
                if (!cleanThreads) {
                    const posts = await fetchPosts(subreddit, timeWindow, CONFIG.TOP_N_THREADS);
                    if (!posts.length) {
                        throw new Error("No threads found for that subreddit / time window.");
                    }

                    // --- Stage b: rank for signal ---------------------------
                    progress(
                        "Selecting high-signal threads",
                        22,
                        `Ranking ${posts.length} → keeping ${CONFIG.KEEP_THREADS}`
                    );
                    const ranked = rankThreads(posts, nowSec, CONFIG.KEEP_THREADS);

                    // --- Stage c+d: comments + clean/compress ---------------
                    progress("Extracting comment signals", 40, `${ranked.length} threads`);
                    cleanThreads = [];
                    for (const t of ranked) {
                        const comments = await fetchComments(t, CONFIG.MAX_COMMENTS_PER_THREAD);
                        cleanThreads.push(buildCleanThread(t, comments));
                    }

                    // Cache the cleaned payload for reuse within the TTL.
                    if (admin) {
                        await admin.from("reddit_cache").upsert(
                            {
                                subreddit,
                                time_window: timeWindow,
                                payload: { cleanThreads },
                                fetched_at: new Date().toISOString(),
                            },
                            { onConflict: "subreddit,time_window" }
                        );
                    }
                } else {
                    progress("Selecting high-signal threads", 22, "From cache");
                    progress("Extracting comment signals", 40, "From cache");
                }

                const totalThreads = cleanThreads.length;
                const totalComments = cleanThreads.reduce((n, t) => n + t.comments.length, 0);

                // Persist threads (so ideas can reference them).
                const threadIdByUrl = new Map<string, string>();
                const quoteByUrl = new Map<string, string>();
                for (const t of cleanThreads) {
                    quoteByUrl.set(t.url, t.comments[0] ?? t.snippet.slice(0, 200));
                }
                if (admin && runId) {
                    const { data: inserted, error } = await admin
                        .from("threads")
                        .insert(
                            cleanThreads.map((t) => ({
                                run_id: runId,
                                reddit_id: t.reddit_id,
                                title: t.title,
                                url: t.url,
                                score: t.score,
                                num_comments: t.num_comments,
                                created_utc: t.created_utc,
                                raw_snippet: t.snippet,
                            }))
                        )
                        .select("id, url");
                    if (error) throw new Error(`DB insert threads: ${error.message}`);
                    for (const row of inserted ?? []) threadIdByUrl.set(row.url, row.id);

                    await admin
                        .from("runs")
                        .update({
                            total_threads_scraped: totalThreads,
                            total_comments_scraped: totalComments,
                        })
                        .eq("id", runId);
                }

                // --- Stage e+f: analyze + repair ----------------------------
                progress("Clustering complaints", 58, "Sending high-signal data to FreeModel");
                const payload = buildAnalystPayload(cleanThreads);
                const { analysis, inputTokens, outputTokens, repaired } = await analyze(payload);
                progress(
                    "Scoring ideas",
                    82,
                    `${analysis.ideas.length} opportunities${repaired ? " (JSON repaired)" : ""}`
                );

                const estCost = estCostUsd(inputTokens, outputTokens);

                // --- Stage g: persist ideas + sources -----------------------
                const validUrls = new Set(cleanThreads.map((t) => t.url));
                const persistedIdeas: PersistedIdea[] = analysis.ideas.map((idea) => {
                    // Only keep source urls that actually came from the input data.
                    const urls = idea.source_thread_urls.filter((u) => validUrls.has(u));
                    const titleByUrl = new Map(cleanThreads!.map((t) => [t.url, t.title]));
                    return {
                        ...idea,
                        source_thread_urls: urls,
                        sources: urls.map((u) => ({
                            url: u,
                            title: titleByUrl.get(u) ?? u,
                            quote: quoteByUrl.get(u) ?? "",
                        })),
                    };
                });

                if (admin && runId) {
                    for (const idea of persistedIdeas) {
                        const { data: ideaRow, error } = await admin
                            .from("ideas")
                            .insert({
                                run_id: runId,
                                title: idea.title,
                                problem: idea.problem,
                                demand_level: idea.demand_level,
                                demand_evidence: idea.demand_evidence,
                                competitors: idea.competitors,
                                gaps: idea.gaps,
                                monetization: idea.monetization,
                                pricing_hint: idea.pricing_hint,
                                target_user: idea.target_user,
                                confidence: idea.confidence,
                            })
                            .select("id")
                            .single();
                        if (error) throw new Error(`DB insert idea: ${error.message}`);

                        const sources = idea.sources
                            .map((s) => ({
                                idea_id: ideaRow.id,
                                thread_id: threadIdByUrl.get(s.url) ?? null,
                                quote: s.quote,
                            }))
                            .filter((s) => s.thread_id);
                        if (sources.length) {
                            await admin.from("idea_sources").insert(sources);
                        }
                    }

                    await admin
                        .from("runs")
                        .update({
                            status: "completed",
                            input_tokens: inputTokens,
                            output_tokens: outputTokens,
                            est_cost_usd: estCost,
                        })
                        .eq("id", runId);
                }

                // --- Stage h: stream final results --------------------------
                const meta: RunMeta = {
                    subreddit,
                    timeWindow,
                    model: CONFIG.FREEMODEL_MODEL,
                    totalThreads,
                    totalComments,
                    inputTokens,
                    outputTokens,
                    estCostUsd: estCost,
                    cached,
                };
                progress("Done", 100);
                send({ type: "result", runId, ideas: persistedIdeas, meta });
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                if (admin && runId) {
                    await admin
                        .from("runs")
                        .update({ status: "error", error: message })
                        .eq("id", runId);
                }
                send({ type: "error", message });
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    });
}
