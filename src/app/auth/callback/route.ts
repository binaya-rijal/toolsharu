import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Magic-link / OAuth callback. Supabase redirects the user here with a `code`
 * we exchange for a session, then forwards them to `next` (defaults to the
 * PainMiner tool).
 */
export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const next = url.searchParams.get("next") ?? "/tools/pain-miner";

    if (code) {
        const supabase = await createClient();
        if (supabase) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error) {
                return NextResponse.redirect(new URL(next, url.origin));
            }
            return NextResponse.redirect(
                new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin)
            );
        }
    }

    return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
}
