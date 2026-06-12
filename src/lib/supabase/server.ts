import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

/**
 * Server Supabase client bound to the request cookies (anon key).
 * Use inside Server Components, Route Handlers and Server Actions to read the
 * authenticated user and run RLS-scoped queries on their behalf.
 *
 * Returns null when Supabase is not configured.
 */
export async function createClient() {
    if (!isSupabaseConfigured()) return null;

    const cookieStore = await cookies();

    return createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                } catch {
                    // `setAll` is called from a Server Component where mutating
                    // cookies is not allowed. Safe to ignore when middleware is
                    // refreshing the session.
                }
            },
        },
    });
}

/** Convenience: returns the authenticated user or null (never throws). */
export async function getUser() {
    const supabase = await createClient();
    if (!supabase) return null;
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user ?? null;
}
