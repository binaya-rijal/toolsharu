import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Refreshes the Supabase auth session on every request so Server Components
 * always see a valid user. No-op when Supabase is not configured.
 *
 * Note: we intentionally do NOT redirect unauthenticated users here — the
 * PainMiner pages and /api/analyze enforce auth themselves. This keeps the
 * rest of ToolsHaru (which has no auth) completely unaffected.
 */
export async function middleware(request: NextRequest) {
    if (!isSupabaseConfigured()) return NextResponse.next();

    let response = NextResponse.next({ request });

    const supabase = createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                response = NextResponse.next({ request });
                cookiesToSet.forEach(({ name, value, options }) =>
                    response.cookies.set(name, value, options)
                );
            },
        },
    });

    // Touch the session to trigger a refresh/rotation when needed.
    await supabase.auth.getUser();

    return response;
}

export const config = {
    // Run on the PainMiner tool, its API, history and the auth routes only.
    matcher: ["/tools/pain-miner/:path*", "/api/analyze", "/login", "/auth/:path*"],
};
