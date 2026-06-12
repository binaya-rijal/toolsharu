import { CONFIG } from "./config";
import type { RedditComment, RedditPost } from "./reddit";

/**
 * Signal ranking + cleaning. This is the most important step for speed/cost:
 * we pull a wide net of posts but only pay to analyze the highest-signal few.
 */

export interface RankedThread extends RedditPost {
    signal: number;
}

export interface CleanThread {
    reddit_id: string;
    title: string;
    url: string;
    score: number;
    num_comments: number;
    created_utc: number;
    /** Cleaned post body + best comment snippets, truncated. */
    snippet: string;
    comments: string[];
}

// ---------------------------------------------------------------------------
// Ranking
// ---------------------------------------------------------------------------

/**
 * score = upvotes*w1 + num_comments*w2 + recency_decay
 * recency_decay rewards fresher threads via an exponential half-life term.
 */
export function rankThreads(posts: RedditPost[], nowSec: number, keep: number): RankedThread[] {
    const halfLifeSec = CONFIG.SIGNAL_RECENCY_HALFLIFE_DAYS * 86_400;
    const ranked = posts.map((p) => {
        const ageSec = Math.max(0, nowSec - p.created_utc);
        // 0..1; 1 = brand new, 0.5 at one half-life, etc.
        const recency = p.created_utc > 0 ? Math.pow(0.5, ageSec / halfLifeSec) : 0.5;
        // Scale recency into the same ballpark as engagement so it nudges, not dominates.
        const recencyDecay = recency * 100;
        const signal =
            p.score * CONFIG.SIGNAL_W_UPVOTES +
            p.num_comments * CONFIG.SIGNAL_W_COMMENTS +
            recencyDecay;
        return { ...p, signal };
    });
    ranked.sort((a, b) => b.signal - a.signal);
    return ranked.slice(0, keep);
}

// ---------------------------------------------------------------------------
// Cleaning
// ---------------------------------------------------------------------------

const BOT_MARKERS = [
    "i am a bot",
    "this action was performed automatically",
    "beep boop",
    "^(this is a bot)",
    "[deleted]",
    "[removed]",
];

/** Strip markdown noise, quote blocks, urls-as-text, zero-width chars. */
export function cleanText(input: string): string {
    return input
        .replace(/```[\s\S]*?```/g, " ") // code fences
        .replace(/`([^`]*)`/g, "$1") // inline code
        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1") // links/images -> label
        .replace(/^>.*$/gm, " ") // blockquotes
        .replace(/[*_~#>]+/g, " ") // md emphasis / headings
        .replace(/\bhttps?:\/\/\S+/g, " ") // bare urls
        .replace(/&amp;/g, "&")
        .replace(/&#x200B;|​/g, "") // zero-width space
        .replace(/\s+/g, " ")
        .trim();
}

function isBot(body: string): boolean {
    const lower = body.toLowerCase();
    return BOT_MARKERS.some((m) => lower.includes(m));
}

function truncate(s: string, max: number): string {
    return s.length <= max ? s : s.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

/**
 * Keep the most substantive comments: drop bots/empties, dedupe near-identical
 * bodies, prefer higher score, and cap length.
 */
export function selectComments(comments: RedditComment[], keep: number): string[] {
    const seen = new Set<string>();
    const cleaned = comments
        .filter((c) => c.body && !isBot(c.body))
        .map((c) => ({ score: c.score, text: cleanText(c.body) }))
        .filter((c) => c.text.length >= 15)
        .filter((c) => {
            const key = c.text.slice(0, 60).toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    cleaned.sort((a, b) => b.score - a.score);
    return cleaned.slice(0, keep).map((c) => truncate(c.text, 280));
}

/** Build the cleaned, compressed per-thread payload sent to the analyst. */
export function buildCleanThread(
    thread: RankedThread,
    comments: RedditComment[]
): CleanThread {
    const body = cleanText(thread.selftext);
    const picked = selectComments(comments, CONFIG.KEEP_COMMENTS_PER_THREAD);
    const snippet = truncate([body, ...picked].filter(Boolean).join(" • "), 700);
    return {
        reddit_id: thread.reddit_id,
        title: truncate(cleanText(thread.title), 200),
        url: thread.url,
        score: thread.score,
        num_comments: thread.num_comments,
        created_utc: thread.created_utc,
        snippet,
        comments: picked,
    };
}

/** Compact structured payload string for the model (token-frugal). */
export function buildAnalystPayload(threads: CleanThread[]): string {
    const compact = threads.map((t, i) => ({
        n: i + 1,
        title: t.title,
        url: t.url,
        score: t.score,
        comments_count: t.num_comments,
        post: t.snippet,
        top_comments: t.comments,
    }));
    return JSON.stringify({ threads: compact }, null, 0);
}
