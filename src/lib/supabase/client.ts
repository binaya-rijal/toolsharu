"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

/**
 * Browser Supabase client (anon key only). Used for auth flows in the UI.
 * Returns null when Supabase is not configured so callers can show a notice.
 */
export function createClient() {
    if (!isSupabaseConfigured()) return null;
    return createBrowserClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
}
