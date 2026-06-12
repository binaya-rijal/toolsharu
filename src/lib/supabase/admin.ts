import "server-only";
import { createClient } from "@supabase/supabase-js";
import {
    SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_URL,
    isSupabaseAdminConfigured,
} from "./config";

/**
 * Service-role Supabase client. Bypasses RLS — use ONLY in trusted server code
 * (the /api/analyze route) and always scope writes to the authenticated
 * user id you obtained separately from the request session.
 *
 * Returns null when the service role key is not configured.
 */
export function createAdminClient() {
    if (!isSupabaseAdminConfigured()) return null;
    return createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
}
