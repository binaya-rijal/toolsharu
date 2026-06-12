"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Pickaxe, Loader2, Mail, CheckCircle2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function LoginInner() {
    const params = useSearchParams();
    const next = params.get("next") ?? "/tools/pain-miner";
    const urlError = params.get("error");

    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
    const [message, setMessage] = useState<string | null>(urlError);

    const supabase = createClient();
    const configured = Boolean(supabase);

    async function sendLink(e: React.FormEvent) {
        e.preventDefault();
        if (!supabase) return;
        setStatus("sending");
        setMessage(null);
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
            },
        });
        if (error) {
            setStatus("error");
            setMessage(error.message);
        } else {
            setStatus("sent");
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 24 }}
                className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl"
            >
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <Pickaxe size={22} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">
                            Pain<span className="text-primary">Miner</span>
                        </h1>
                        <p className="text-xs text-muted-foreground">Sign in to mine validated SaaS ideas</p>
                    </div>
                </div>

                {!configured ? (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                        <div className="mb-1 flex items-center gap-2 font-semibold">
                            <AlertTriangle size={16} /> Supabase not configured
                        </div>
                        Add <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                        <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
                        <code className="text-xs">.env</code>, then restart the dev server. See the
                        README for setup steps.
                    </div>
                ) : status === "sent" ? (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                        <div className="mb-1 flex items-center gap-2 font-semibold">
                            <CheckCircle2 size={16} /> Check your inbox
                        </div>
                        We sent a magic link to <span className="font-medium">{email}</span>. Click it
                        to finish signing in.
                    </div>
                ) : (
                    <form onSubmit={sendLink} className="space-y-4">
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium text-foreground">
                                Email address
                            </span>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                            />
                        </label>

                        {message && status === "error" && (
                            <p className="flex items-center gap-1.5 text-sm text-destructive">
                                <AlertTriangle size={14} /> {message}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={status === "sending"}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                        >
                            {status === "sending" ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Mail size={16} />
                            )}
                            Send magic link
                        </button>
                    </form>
                )}

                <p className="mt-6 text-center text-xs text-muted-foreground">
                    <Link href="/dashboard" className="hover:text-foreground">
                        ← Back to ToolsHaru
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginInner />
        </Suspense>
    );
}
