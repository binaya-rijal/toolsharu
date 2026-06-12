import Link from "next/link";
import { redirect } from "next/navigation";
import { History, AlertTriangle } from "lucide-react";
import { ToolOpenTracker } from "@/components/OpenedToolsProvider";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/server";
import PainMiner from "@/components/tools/painminer/PainMiner";
import SignOutButton from "@/components/tools/painminer/SignOutButton";

export default async function PainMinerPage() {
    const configured = isSupabaseConfigured();
    const user = configured ? await getUser() : null;

    // Auth gate: only redirect when Supabase IS configured but there's no session.
    if (configured && !user) {
        redirect("/login?next=/tools/pain-miner");
    }

    return (
        <div className="space-y-6">
            <ToolOpenTracker id="pain-miner" />

            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Pain<span className="text-primary">Miner</span>
                    </h1>
                    <p className="mt-2 max-w-2xl text-muted-foreground">
                        Scrape Reddit discussions and turn repeated complaints into validated SaaS
                        ideas — each backed by demand signals, competitors, gaps, and clickable source
                        threads.
                    </p>
                </div>
                {user && (
                    <div className="flex items-center gap-2">
                        <Link
                            href="/tools/pain-miner/history"
                            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
                        >
                            <History size={13} /> History
                        </Link>
                        <SignOutButton />
                    </div>
                )}
            </div>

            {!configured ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-200">
                    <div className="mb-2 flex items-center gap-2 text-base font-semibold">
                        <AlertTriangle size={18} /> Supabase setup required
                    </div>
                    <p className="mb-3 text-amber-100/80">
                        PainMiner uses Supabase for auth + storing your runs. Add these to{" "}
                        <code className="text-xs">.env</code> and restart the dev server:
                    </p>
                    <pre className="overflow-x-auto rounded-lg bg-black/30 p-3 text-xs text-amber-100">
{`NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...`}
                    </pre>
                    <p className="mt-3 text-amber-100/80">
                        Then run the SQL in{" "}
                        <code className="text-xs">supabase/migrations/0001_painminer.sql</code>. Full
                        steps are in the README.
                    </p>
                </div>
            ) : (
                <PainMiner />
            )}
        </div>
    );
}
