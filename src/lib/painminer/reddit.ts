import type { TimeWindow } from "./config";

/**
 * Provider-abstracted Reddit access. ALL Reddit reads go through this module so
 * the upstream source can be swapped without touching the pipeline.
 *
 * Default: deterministic mock samples, so PainMiner runs end-to-end with NO
 * keys configured. To fetch live data later, set REDDIT_USE_MOCK=false. Reddit
 * now blocks unauthenticated `.json` requests (HTTP 403), so the reliable live
 * path is the official OAuth API: also set REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET
 * (register a free "script" app at https://www.reddit.com/prefs/apps) and we
 * fetch an app-only bearer token and hit https://oauth.reddit.com. Without
 * credentials it falls back to the public host, which may 403 depending on IP.
 */

export interface RedditPost {
    reddit_id: string;
    title: string;
    /** selftext / body of the post, may be empty for link posts. */
    selftext: string;
    url: string;
    permalink: string;
    score: number;
    num_comments: number;
    created_utc: number; // unix seconds
}

export interface RedditComment {
    id: string;
    body: string;
    score: number;
}

// Reddit rejects requests with no/blank User-Agent, so always send a real one.
const USER_AGENT =
    process.env.REDDIT_USER_AGENT || "web:painminer:1.0 (by /u/painminer-app)";

const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;

/** True when OAuth app credentials are configured (the reliable path). */
function hasOAuth(): boolean {
    return Boolean(REDDIT_CLIENT_ID && REDDIT_CLIENT_SECRET);
}

/** API host + path prefix differ between the OAuth and public endpoints. */
function apiBase(): string {
    if (process.env.REDDIT_API_BASE_URL) return process.env.REDDIT_API_BASE_URL.replace(/\/$/, "");
    return hasOAuth() ? "https://oauth.reddit.com" : "https://www.reddit.com";
}

function useMock(): boolean {
    // Default to deterministic mock samples so the pipeline runs with no keys.
    // Once real Reddit credentials are in place, set REDDIT_USE_MOCK=false (and
    // REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET) to fetch live threads.
    if (process.env.REDDIT_USE_MOCK === "false") return false;
    return true;
}

// ---------------------------------------------------------------------------
// App-only OAuth token (client_credentials grant), cached until expiry.
// ---------------------------------------------------------------------------

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
    const now = Date.now();
    if (tokenCache && tokenCache.expiresAt > now + 30_000) return tokenCache.token;

    const basic = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString("base64");
    const res = await fetch("https://www.reddit.com/api/v1/access_token", {
        method: "POST",
        headers: {
            Authorization: `Basic ${basic}`,
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": USER_AGENT,
        },
        body: "grant_type=client_credentials",
    });
    if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`reddit token ${res.status}: ${detail.slice(0, 200)}`);
    }
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) throw new Error("reddit token response missing access_token");
    tokenCache = {
        token: data.access_token,
        expiresAt: now + (data.expires_in ?? 3600) * 1000,
    };
    return tokenCache.token;
}

async function redditHeaders(): Promise<HeadersInit> {
    const headers: Record<string, string> = {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
    };
    if (hasOAuth()) headers.Authorization = `Bearer ${await getAccessToken()}`;
    return headers;
}

// ---------------------------------------------------------------------------
// Retry with exponential backoff
// ---------------------------------------------------------------------------

async function withRetry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 400): Promise<T> {
    let lastErr: unknown;
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (err) {
            lastErr = err;
            if (i < attempts - 1) {
                await new Promise((r) => setTimeout(r, baseMs * 2 ** i));
            }
        }
    }
    throw lastErr;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchPosts(
    subreddit: string,
    timeWindow: TimeWindow,
    limit: number
): Promise<RedditPost[]> {
    if (useMock()) return mockPosts(subreddit, timeWindow, limit);
    // Real data only: surface the failure rather than passing mock complaints
    // off as genuine Reddit signal. Set REDDIT_USE_MOCK=true for offline dev.
    return withRetry(() => fetchPostsRaw(subreddit, timeWindow, limit));
}

export async function fetchComments(post: RedditPost, limit: number): Promise<RedditComment[]> {
    if (useMock()) return mockComments(post, limit);
    try {
        return await withRetry(() => fetchCommentsRaw(post, limit));
    } catch (err) {
        // A single thread's comments failing shouldn't sink the whole run; skip
        // it (empty) rather than inventing comments that look real.
        console.warn(`[reddit] comments for ${post.reddit_id} failed, skipping:`, err);
        return [];
    }
}

// ---------------------------------------------------------------------------
// Reddit JSON adapter. Both the OAuth host (oauth.reddit.com) and the public
// host (www.reddit.com) accept a `.json` suffix and return identical listing
// shapes, so a single mapping serves both.
// ---------------------------------------------------------------------------

interface Listing {
    data?: { children?: { kind?: string; data?: Record<string, unknown> }[] };
}

async function fetchPostsRaw(
    subreddit: string,
    timeWindow: TimeWindow,
    limit: number
): Promise<RedditPost[]> {
    const u = new URL(`${apiBase()}/r/${encodeURIComponent(subreddit)}/top.json`);
    u.searchParams.set("t", timeWindow); // day | week | month | year | all
    u.searchParams.set("limit", String(limit));
    u.searchParams.set("raw_json", "1"); // un-escape &amp; etc.

    const res = await fetch(u, { headers: await redditHeaders() });
    if (!res.ok) {
        if (res.status === 403 && !hasOAuth()) {
            throw new Error(
                "Reddit blocked the request (403). Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET " +
                    "(register a free script app at reddit.com/prefs/apps) to use the official API, " +
                    "or set REDDIT_USE_MOCK=true for offline mock data."
            );
        }
        throw new Error(`reddit posts ${res.status}`);
    }
    const data = (await res.json()) as Listing;

    const children = data.data?.children ?? [];
    return children
        .filter((c) => c.kind === "t3" && c.data)
        .slice(0, limit)
        .map((c) => normalizePost(c.data as Record<string, unknown>));
}

async function fetchCommentsRaw(post: RedditPost, limit: number): Promise<RedditComment[]> {
    const u = new URL(`${apiBase()}/comments/${post.reddit_id}.json`);
    u.searchParams.set("sort", "top");
    u.searchParams.set("limit", String(limit));
    u.searchParams.set("raw_json", "1");

    const res = await fetch(u, { headers: await redditHeaders() });
    if (!res.ok) throw new Error(`reddit comments ${res.status}`);
    // Comments endpoint returns [postListing, commentsListing].
    const data = (await res.json()) as Listing[];
    const children = data[1]?.data?.children ?? [];
    return children
        .filter((c) => c.kind === "t1" && c.data)
        .slice(0, limit)
        .map((c, i) => {
            const r = c.data as Record<string, unknown>;
            return {
                id: String(r.id ?? i),
                body: String(r.body ?? ""),
                score: Number(r.score ?? r.ups ?? 0),
            };
        });
}

function normalizePost(r: Record<string, unknown>): RedditPost {
    const permalink = String(r.permalink ?? "");
    return {
        reddit_id: String(r.id ?? r.name ?? ""),
        title: String(r.title ?? ""),
        selftext: String(r.selftext ?? ""),
        url: String(r.url ?? (permalink ? `https://www.reddit.com${permalink}` : "")),
        permalink,
        score: Number(r.score ?? r.ups ?? 0),
        num_comments: Number(r.num_comments ?? 0),
        created_utc: Number(r.created_utc ?? r.created ?? 0),
    };
}

// ---------------------------------------------------------------------------
// Mock provider — deterministic, complaint-heavy data so the analyst has real
// signal to cluster. Themed loosely by subreddit name.
// ---------------------------------------------------------------------------

const COMPLAINT_TEMPLATES: { title: string; selftext: string; comments: string[] }[] = [
    {
        title: "Why is every {topic} tool either too expensive or missing the one feature I need?",
        selftext:
            "I've tried 5 different {topic} apps this year. Each one nails one thing and completely drops the ball on everything else. I just want bulk export without paying $99/mo.",
        comments: [
            "Same. {compA} has great UX but the pricing is insane once you pass the free tier.",
            "I gave up and built a janky spreadsheet. Half my team still uses that instead.",
            "Honestly the export/import situation across all of these is a nightmare. Nothing talks to anything.",
            "+1, I'd pay for something that just does one job well instead of a bloated suite.",
            "{compB} promised this for a year and still nothing. Roadmap is a graveyard.",
        ],
    },
    {
        title: "{compA} keeps raising prices and removing features — what are people switching to?",
        selftext:
            "Been a customer for 3 years. They just moved the thing I use most behind the enterprise plan. Looking for alternatives that won't rug-pull me.",
        comments: [
            "Tried {compB} but the onboarding is so painful I gave up after a day.",
            "The migration tooling is the dealbreaker. No clean way to get my data out.",
            "Everyone keeps recommending self-hosted but I don't have time to maintain a server.",
            "What I actually want is per-seat that doesn't punish small teams. None of them do that.",
        ],
    },
    {
        title: "Spent the whole weekend stitching together 3 tools to do {topic}. There has to be a better way.",
        selftext:
            "Zapier to glue them, a Google Sheet as the source of truth, and a third app for the actual output. It breaks constantly and support is useless.",
        comments: [
            "The integrations always break on the free tiers right when you need them.",
            "I'd kill for an all-in-one that handles {topic} end to end without the duct tape.",
            "Support response time is measured in geological eras for all of these.",
            "This is exactly my setup and I hate it. Genuinely would pay $30/mo to delete it.",
        ],
    },
    {
        title: "Is anyone else frustrated that {topic} tools have no decent mobile/offline support?",
        selftext:
            "I'm on the road constantly and every option assumes I'm at a desk with perfect wifi. The mobile apps are afterthoughts.",
        comments: [
            "The mobile app of {compA} is read-only basically. Useless for actual work.",
            "Offline mode is table stakes in 2026 and somehow nobody ships it.",
            "I lost work because it didn't sync. Never trusting cloud-only again.",
        ],
    },
    {
        title: "Beginner question: how do you all handle {topic} without losing your mind?",
        selftext:
            "New to this. Everything I find is either enterprise-priced or a confusing open-source project with zero docs. Where do small teams go?",
        comments: [
            "Docs are universally terrible in this space. Expect to learn from random YouTube videos.",
            "Start cheap, you'll outgrow the free tier fast and then they squeeze you.",
            "Wish there was something opinionated for beginners instead of 200 config options.",
        ],
    },
];

const COMP_NAMES = ["Notion", "Airtable", "Monday", "ClickUp", "Trello", "Asana"];

function hashStr(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
}

function fill(t: string, topic: string, seed: number): string {
    const compA = COMP_NAMES[seed % COMP_NAMES.length];
    const compB = COMP_NAMES[(seed + 2) % COMP_NAMES.length];
    return t.replaceAll("{topic}", topic).replaceAll("{compA}", compA).replaceAll("{compB}", compB);
}

function windowSeconds(tw: TimeWindow): number {
    switch (tw) {
        case "day":
            return 86_400;
        case "week":
            return 7 * 86_400;
        case "month":
            return 30 * 86_400;
        case "year":
            return 365 * 86_400;
        default:
            return 3 * 365 * 86_400;
    }
}

function mockPosts(subreddit: string, timeWindow: TimeWindow, limit: number): RedditPost[] {
    const topic = subreddit.replace(/^r\//i, "").replace(/[_-]+/g, " ").trim() || "productivity";
    const span = windowSeconds(timeWindow);
    // Fixed reference time keeps mock output stable across a single run window.
    const nowRef = 1_750_000_000;
    const posts: RedditPost[] = [];

    for (let i = 0; i < limit; i++) {
        const tpl = COMPLAINT_TEMPLATES[i % COMPLAINT_TEMPLATES.length];
        const seed = hashStr(`${subreddit}:${i}`);
        const score = 40 + (seed % 1200);
        const numComments = 5 + (seed % 240);
        const ageFrac = (seed % 1000) / 1000;
        posts.push({
            reddit_id: `mock_${seed.toString(36)}`,
            title: fill(tpl.title, topic, seed),
            selftext: fill(tpl.selftext, topic, seed),
            url: `https://www.reddit.com/r/${encodeURIComponent(
                topic.replace(/\s+/g, "")
            )}/comments/mock_${seed.toString(36)}/`,
            permalink: `/r/${topic.replace(/\s+/g, "")}/comments/mock_${seed.toString(36)}/`,
            score,
            num_comments: numComments,
            created_utc: nowRef - Math.floor(ageFrac * span),
        });
    }
    return posts;
}

function mockComments(post: RedditPost, limit: number): RedditComment[] {
    const topic = "this";
    const seed = hashStr(post.reddit_id);
    const tpl = COMPLAINT_TEMPLATES[seed % COMPLAINT_TEMPLATES.length];
    return tpl.comments.slice(0, limit).map((c, i) => ({
        id: `${post.reddit_id}_c${i}`,
        body: fill(c, topic, seed + i),
        score: Math.max(1, (post.score >> 2) - i * 7 - (seed % 5)),
    }));
}
