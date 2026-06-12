/**
 * PainMiner runtime configuration. Every cost/scale knob is env-configurable
 * with sane defaults so the pipeline stays cheap and fast out of the box.
 */

function intEnv(name: string, fallback: number): number {
    const raw = process.env[name];
    const n = raw ? Number.parseInt(raw, 10) : NaN;
    return Number.isFinite(n) && n > 0 ? n : fallback;
}

function floatEnv(name: string, fallback: number): number {
    const raw = process.env[name];
    const n = raw ? Number.parseFloat(raw) : NaN;
    return Number.isFinite(n) ? n : fallback;
}

export const CONFIG = {
    /** How many posts to pull from the subreddit before ranking. */
    TOP_N_THREADS: intEnv("PAINMINER_TOP_N_THREADS", 15),
    /** How many high-signal threads to keep after ranking. */
    KEEP_THREADS: intEnv("PAINMINER_KEEP_THREADS", 8),
    /** Max comments to fetch per kept thread. */
    MAX_COMMENTS_PER_THREAD: intEnv("PAINMINER_MAX_COMMENTS_PER_THREAD", 25),
    /** Most substantive comments kept per thread after cleaning. */
    KEEP_COMMENTS_PER_THREAD: intEnv("PAINMINER_KEEP_COMMENTS_PER_THREAD", 8),
    /** Output token ceiling for the analyst call. */
    MAX_TOKENS: intEnv("PAINMINER_MAX_TOKENS", 8192),
    /** Reddit cache TTL in hours. */
    CACHE_TTL_HOURS: intEnv("PAINMINER_CACHE_TTL_HOURS", 6),
    /** Per-user analyze rate limit. */
    RATE_LIMIT_MAX: intEnv("PAINMINER_RATE_LIMIT_MAX", 5),
    RATE_LIMIT_WINDOW_MS: intEnv("PAINMINER_RATE_LIMIT_WINDOW_SEC", 60) * 1000,

    /** Signal ranking weights. */
    SIGNAL_W_UPVOTES: floatEnv("PAINMINER_W_UPVOTES", 1),
    SIGNAL_W_COMMENTS: floatEnv("PAINMINER_W_COMMENTS", 2.5),
    /** Recency half-life in days for the decay term. */
    SIGNAL_RECENCY_HALFLIFE_DAYS: floatEnv("PAINMINER_RECENCY_HALFLIFE_DAYS", 30),

    /**
     * FreeModel analyst (OpenAI-compatible Chat Completions API) + pricing
     * (USD per 1M tokens) for cost logging.
     */
    FREEMODEL_BASE_URL: process.env.FREEMODEL_BASE_URL || "https://api.freemodel.dev",
    FREEMODEL_MODEL: process.env.FREEMODEL_MODEL || "claude-opus-4-8",
    MODEL_PRICE_INPUT_PER_M: floatEnv("FREEMODEL_PRICE_INPUT_PER_M", 0),
    MODEL_PRICE_OUTPUT_PER_M: floatEnv("FREEMODEL_PRICE_OUTPUT_PER_M", 0),
} as const;

export type TimeWindow = "day" | "week" | "month" | "year" | "all";

export function estCostUsd(inputTokens: number, outputTokens: number): number {
    const cost =
        (inputTokens / 1_000_000) * CONFIG.MODEL_PRICE_INPUT_PER_M +
        (outputTokens / 1_000_000) * CONFIG.MODEL_PRICE_OUTPUT_PER_M;
    return Math.round(cost * 1_000_000) / 1_000_000;
}
