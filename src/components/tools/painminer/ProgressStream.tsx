"use client";

import { Check, Loader2, Circle, AlertTriangle } from "lucide-react";
import { STAGES, type Stage } from "@/lib/painminer/schema";
import { cn } from "@/lib/utils";

export interface ProgressState {
    stage: Stage;
    pct: number;
    detail?: string;
    error?: string | null;
}

/** Honest, live progress — shows each named stage and where we are. */
export default function ProgressStream({ state }: { state: ProgressState }) {
    const currentIdx = STAGES.indexOf(state.stage);
    const failed = Boolean(state.error);

    return (
        <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-500",
                        failed ? "bg-destructive" : "bg-primary"
                    )}
                    style={{ width: `${state.pct}%` }}
                />
            </div>

            <ol className="space-y-2.5">
                {STAGES.map((stage, i) => {
                    const done = !failed && (i < currentIdx || state.stage === "Done");
                    const active = !failed && i === currentIdx && state.stage !== "Done";
                    const isErrorRow = failed && i === currentIdx;
                    return (
                        <li key={stage} className="flex items-center gap-3 text-sm">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                                {isErrorRow ? (
                                    <AlertTriangle size={16} className="text-destructive" />
                                ) : done ? (
                                    <Check size={16} className="text-emerald-400" />
                                ) : active ? (
                                    <Loader2 size={16} className="animate-spin text-primary" />
                                ) : (
                                    <Circle size={9} className="text-muted-foreground/40" />
                                )}
                            </span>
                            <span
                                className={cn(
                                    "font-medium",
                                    done && "text-foreground/70",
                                    active && "text-foreground",
                                    isErrorRow && "text-destructive",
                                    !done && !active && !isErrorRow && "text-muted-foreground/50"
                                )}
                            >
                                {stage}
                            </span>
                            {active && state.detail && (
                                <span className="truncate text-xs text-muted-foreground">
                                    — {state.detail}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>

            {failed && (
                <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {state.error}
                </p>
            )}
        </div>
    );
}
