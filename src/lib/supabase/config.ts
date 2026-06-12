/**
 * Supabase configuration guards.
 *
 * The wider ToolsHaru app ships without Supabase wired up, and PainMiner is
 * the first tool that needs it. So every Supabase code path is written to
 * degrade gracefully: if the env vars are missing (or still placeholders),
 * `isSupabaseConfigured()` returns false and callers show a setup notice
 * instead of throwing at import/render time.
 */

const PLACEHOLDERS = new Set(["", "TODO", "replace-me", "your-project-url", "your-anon-key"]);

function present(value: string | undefined): value is string {
    return typeof value === "string" && !PLACEHOLDERS.has(value.trim());
}

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** True when the public URL + anon key are available (client + auth usable). */
export function isSupabaseConfigured(): boolean {
    return present(SUPABASE_URL) && present(SUPABASE_ANON_KEY);
}

/** True when the service role key is also available (server writes usable). */
export function isSupabaseAdminConfigured(): boolean {
    return isSupabaseConfigured() && present(SUPABASE_SERVICE_ROLE_KEY);
}
