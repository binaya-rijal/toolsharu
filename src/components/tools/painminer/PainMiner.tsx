"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Loader2,
    Sparkles,
    Coins,
    FileText,
    MessageSquare,
    DatabaseZap,
} from "lucide-react";
import IdeaCard, { type DisplayIdea } from "./IdeaCard";
import ProgressStream, { type ProgressState } from "./ProgressStream";
import type { ProgressEvent, RunMeta } from "@/lib/painminer/schema";

const TIME_WINDOWS = [
    { value: "day", label: "Past day" },
    { value: "week", label: "Past week" },
    { value: "month", label: "Past month" },
    { value: "year", label: "Past year" },
    { value: "all", label: "All time" },
] as const;

type Phase = "idle" | "running" | "done" | "error";

export default function PainMiner() {
    const [subreddit, setSubreddit] = useState("");
    const [timeWindow, setTimeWindow] = useState<string>("week");
    const [phase, setPhase] = useState<Phase>("idle");
    const [progress, setProgress] = useState<ProgressState>({
        stage: "Fetching threads",
        pct: 0,
    });
    const [ideas, setIdeas] = useState<DisplayIdea[]>([]);
    const [meta, setMeta] = useState<RunMeta | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    async function run(e: React.FormEvent) {
        e.preventDefault();
        if (!subreddit.trim() || phase === "running") return;

        setPhase("running");
        setIdeas([]);
        setMeta(null);
        setProgress({ stage: "Fetching threads", pct: 4, detail: "Starting…", error: null });

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const res = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subreddit: subreddit.trim(), timeWindow }),
                signal: controller.signal,
            });

            if (!res.ok || !res.body) {
                const msg = await res.json().catch(() => ({ error: `Request failed (${res.status})` }));
                if (res.status === 401) {
                    window.location.href = `/login?next=/tools/pain-miner`;
                    return;
                }
                throw new Error(msg.error ?? `Request failed (${res.status})`);
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const chunks = buffer.split("\n\n");
                buffer = chunks.pop() ?? "";
                for (const chunk of chunks) {
                    const line = chunk.split("\n").find((l) => l.startsWith("data: "));
                    if (!line) continue;
                    const event: ProgressEvent = JSON.parse(line.slice(6));
                    handleEvent(event);
                }
            }
        } catch (err) {
            if (controller.signal.aborted) return;
            const message = err instanceof Error ? err.message : String(err);
            setPhase("error");
            setProgress((p) => ({ ...p, error: message }));
        }
    }

    function handleEvent(event: ProgressEvent) {
        if (event.type === "progress") {
            setProgress({ stage: event.stage, pct: event.pct, detail: event.detail, error: null });
        } else if (event.type === "error") {
            setPhase("error");
            setProgress((p) => ({ ...p, error: event.message }));
        } else if (event.type === "result") {
            setIdeas(event.ideas as DisplayIdea[]);
            setMeta(event.meta);
            setPhase("done");
        }
    }

    return (
        <div className="space-y-6">
            {/* Form */}
            <form
                onSubmit={run}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-end"
            >
                <label className="flex-1">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Subreddit or keyword
                    </span>
                    <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3">
                        <span className="text-sm text-muted-foreground">r/</span>
                        <input
                            value={subreddit}
                            onChange={(e) => setSubreddit(e.target.value)}
                            placeholder="freelance"
                            className="w-full bg-transparent py-2.5 text-sm outline-none"
                        />
                    </div>
                </label>

                <label className="sm:w-44">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Time window
                    </span>
                    <select
                        value={timeWindow}
                        onChange={(e) => setTimeWindow(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none"
                    >
                        {TIME_WINDOWS.map((w) => (
                            <option key={w.value} value={w.value}>
                                {w.label}
                            </option>
                        ))}
                    </select>
                </label>

                <button
                    type="submit"
                    disabled={phase === "running" || !subreddit.trim()}
                    className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                    {phase === "running" ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Search size={16} />
                    )}
                    Analyze
                </button>
            </form>

            {/* Progress */}
            <AnimatePresence>
                {(phase === "running" || phase === "error") && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        <ProgressStream state={progress} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results meta */}
            {phase === "done" && meta && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground"
                >
                    <span className="font-semibold text-foreground">
                        {ideas.length} idea{ideas.length === 1 ? "" : "s"} from r/{meta.subreddit}
                    </span>
                    <Stat icon={<FileText size={13} />} label={`${meta.totalThreads} threads`} />
                    <Stat icon={<MessageSquare size={13} />} label={`${meta.totalComments} comments`} />
                    <Stat
                        icon={<Coins size={13} />}
                        label={`${meta.inputTokens + meta.outputTokens} tokens · $${meta.estCostUsd.toFixed(4)}`}
                    />
                    {meta.cached && <Stat icon={<DatabaseZap size={13} />} label="cached fetch" />}
                    <span className="ml-auto">{meta.model}</span>
                </motion.div>
            )}

            {/* Empty state */}
            {phase === "idle" && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
                    <Sparkles className="mb-3 text-primary" size={28} />
                    <p className="text-sm font-medium">Enter a subreddit to mine real pain points.</p>
                    <p className="mt-1 max-w-md text-xs text-muted-foreground">
                        PainMiner reads top threads, ranks them by demand signal, and turns recurring
                        complaints into validated SaaS ideas — each backed by clickable source threads.
                    </p>
                </div>
            )}

            {/* Idea cards */}
            {phase === "done" && ideas.length > 0 && (
                <div className="grid gap-5 lg:grid-cols-2">
                    {ideas.map((idea, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <IdeaCard idea={idea} />
                        </motion.div>
                    ))}
                </div>
            )}

            {phase === "done" && ideas.length === 0 && (
                <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                    The analyst found no strong, evidence-backed opportunities in this data. Try a
                    busier subreddit or a wider time window.
                </p>
            )}
        </div>
    );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <span className="flex items-center gap-1.5">
            {icon}
            {label}
        </span>
    );
}
