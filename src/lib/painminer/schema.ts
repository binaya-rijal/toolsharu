import { z } from "zod";

/**
 * Schema the analyst MUST satisfy. Mirrors the JSON contract in the system
 * prompt. Validated with zod; failures trigger the repair path.
 */
export const competitorSchema = z.object({
    name: z.string().min(1),
    weakness: z.string().default(""),
});

export const ideaSchema = z.object({
    title: z.string().min(1),
    problem: z.string().min(1),
    demand_level: z.enum(["low", "medium", "high"]),
    demand_evidence: z.string().default(""),
    competitors: z.array(competitorSchema).default([]),
    gaps: z.array(z.string()).default([]),
    monetization: z.string().default(""),
    pricing_hint: z.string().default(""),
    target_user: z.string().default(""),
    confidence: z.number().min(0).max(1),
    source_thread_urls: z.array(z.string()).default([]),
});

export const analysisSchema = z.object({
    ideas: z.array(ideaSchema).default([]),
});

export type Competitor = z.infer<typeof competitorSchema>;
export type Idea = z.infer<typeof ideaSchema>;
export type Analysis = z.infer<typeof analysisSchema>;

// ---------------------------------------------------------------------------
// Streaming progress protocol (server -> client over SSE)
// ---------------------------------------------------------------------------

export const STAGES = [
    "Fetching threads",
    "Selecting high-signal threads",
    "Extracting comment signals",
    "Clustering complaints",
    "Scoring ideas",
    "Done",
] as const;

export type Stage = (typeof STAGES)[number];

export type ProgressEvent =
    | { type: "progress"; stage: Stage; detail?: string; pct: number }
    | { type: "error"; message: string; stage?: Stage }
    | { type: "result"; runId: string | null; ideas: PersistedIdea[]; meta: RunMeta };

export interface RunMeta {
    subreddit: string;
    timeWindow: string;
    model: string;
    totalThreads: number;
    totalComments: number;
    inputTokens: number;
    outputTokens: number;
    estCostUsd: number;
    cached: boolean;
}

/** An idea as returned to the UI, with resolved source threads. */
export interface PersistedIdea extends Idea {
    sources: { url: string; title: string; quote: string }[];
}
