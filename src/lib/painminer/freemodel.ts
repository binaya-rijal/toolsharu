import { CONFIG } from "./config";
import { analysisSchema, type Analysis } from "./schema";

/**
 * FreeModel analyst step + JSON repair. The analyst clusters real complaints
 * into evidence-backed SaaS opportunities; the repair path guarantees we end
 * with schema-valid JSON or a clear error.
 *
 * FreeModel exposes an OpenAI-compatible Chat Completions API, so we talk to it
 * with plain fetch — no provider SDK required. Swap the model/base URL via the
 * FREEMODEL_* env vars (see config.ts).
 */

// Verbatim per spec — do not edit.
const ANALYST_SYSTEM_PROMPT = `You are a meticulous market research analyst. You are given real Reddit threads and comments from a community. Do NOT invent startup ideas. Instead: (1) cluster the complaints into recurring themes and count how often each recurs; (2) for each strong theme, identify existing tools/competitors people mention and what they still hate about them; (3) derive concrete SaaS opportunities ONLY from evidence present in the data; (4) for each opportunity assign a demand_level (low/medium/high) justified by repetition and intensity of complaints, cite the gap competitors leave open, suggest a monetization angle and a rough pricing hint, and reference the specific source threads. Be skeptical: if evidence is weak, say demand_level=low. Output ONLY valid JSON matching the provided schema, no prose, no markdown fences.`;

// JSON shape the analyst must satisfy. Inlined into the prompt because the
// OpenAI-compatible json_object mode constrains format, not structure.
const SCHEMA_HINT = `{"ideas":[{"title":string,"problem":string,"demand_level":"low"|"medium"|"high","demand_evidence":string,"competitors":[{"name":string,"weakness":string}],"gaps":[string],"monetization":string,"pricing_hint":string,"target_user":string,"confidence":number(0-1),"source_thread_urls":[string]}]}`;

export interface AnalystResult {
    analysis: Analysis;
    inputTokens: number;
    outputTokens: number;
    repaired: boolean;
}

interface ChatUsage {
    prompt_tokens?: number;
    completion_tokens?: number;
}

interface ChatCompletion {
    choices?: { message?: { content?: string } }[];
    usage?: ChatUsage;
}

// ---------------------------------------------------------------------------
// FreeModel chat call (OpenAI-compatible)
// ---------------------------------------------------------------------------

async function chat(
    messages: { role: "system" | "user"; content: string }[],
    temperature: number
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
    const apiKey = process.env.FREEMODEL_API_KEY;
    if (!apiKey) throw new Error("FREEMODEL_API_KEY is not configured");

    const url = `${CONFIG.FREEMODEL_BASE_URL.replace(/\/$/, "")}/v1/chat/completions`;
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: CONFIG.FREEMODEL_MODEL,
            temperature,
            max_tokens: CONFIG.MAX_TOKENS,
            response_format: { type: "json_object" },
            messages,
        }),
    });

    if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`FreeModel chat ${res.status}: ${detail.slice(0, 300)}`);
    }

    const data = (await res.json()) as ChatCompletion;
    const text = data.choices?.[0]?.message?.content ?? "";
    return {
        text,
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
    };
}

// ---------------------------------------------------------------------------
// JSON sanitizer (cheap, local) — runs before any repair call.
// ---------------------------------------------------------------------------

export function sanitizeJson(raw: string): string {
    let s = raw.trim();
    // Strip markdown fences if the model added them despite instructions.
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    // Extract the first balanced {...} block.
    const start = s.indexOf("{");
    if (start >= 0) {
        let depth = 0;
        let inStr = false;
        let esc = false;
        for (let i = start; i < s.length; i++) {
            const ch = s[i];
            if (inStr) {
                if (esc) esc = false;
                else if (ch === "\\") esc = true;
                else if (ch === '"') inStr = false;
            } else if (ch === '"') inStr = true;
            else if (ch === "{") depth++;
            else if (ch === "}") {
                depth--;
                if (depth === 0) {
                    s = s.slice(start, i + 1);
                    break;
                }
            }
        }
    }
    // Remove trailing commas before } or ].
    s = s.replace(/,\s*([}\]])/g, "$1");
    return s.trim();
}

function tryParse(raw: string): Analysis | null {
    try {
        const parsed = JSON.parse(sanitizeJson(raw));
        const result = analysisSchema.safeParse(parsed);
        return result.success ? result.data : null;
    } catch {
        return null;
    }
}

// ---------------------------------------------------------------------------
// Analyst call
// ---------------------------------------------------------------------------

export async function analyze(payload: string): Promise<AnalystResult> {
    const userPrompt = `Analyze the following Reddit threads and comments. Output JSON only, matching this shape: ${SCHEMA_HINT}\n\n${payload}`;

    const res = await chat(
        [
            { role: "system", content: ANALYST_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
        ],
        0.2
    );

    let inputTokens = res.inputTokens;
    let outputTokens = res.outputTokens;

    let analysis = tryParse(res.text);
    let repaired = false;

    if (!analysis) {
        // ONE repair call: hand the model its broken output + the error.
        repaired = true;
        const repair = await repairJson(res.text);
        inputTokens += repair.inputTokens;
        outputTokens += repair.outputTokens;
        analysis = repair.analysis;
    }

    return { analysis, inputTokens, outputTokens, repaired };
}

// ---------------------------------------------------------------------------
// Repair call — last resort after local sanitizing fails.
// ---------------------------------------------------------------------------

export async function repairJson(broken: string): Promise<{
    analysis: Analysis;
    inputTokens: number;
    outputTokens: number;
}> {
    let parseError = "unknown parse error";
    try {
        JSON.parse(sanitizeJson(broken));
    } catch (e) {
        parseError = e instanceof Error ? e.message : String(e);
    }

    const prompt = `The following text was supposed to be JSON matching this shape: ${SCHEMA_HINT}.\nIt failed to parse with error: ${parseError}\nReturn ONLY corrected, valid JSON. Do not add commentary or markdown.\n\nBROKEN OUTPUT:\n${broken}`;

    const res = await chat([{ role: "user", content: prompt }], 0);

    const analysis = tryParse(res.text);
    if (!analysis) {
        throw new Error("FreeModel repair failed: response still did not match schema");
    }
    return {
        analysis,
        inputTokens: res.inputTokens,
        outputTokens: res.outputTokens,
    };
}
