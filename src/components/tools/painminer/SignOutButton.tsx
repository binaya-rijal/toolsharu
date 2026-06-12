"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
    const router = useRouter();

    async function signOut() {
        const supabase = createClient();
        if (supabase) await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    }

    return (
        <button
            onClick={signOut}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
        >
            <LogOut size={13} /> Sign out
        </button>
    );
}
