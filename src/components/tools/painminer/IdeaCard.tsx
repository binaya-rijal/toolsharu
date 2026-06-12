import {
    ExternalLink,
    Quote,
    Target,
    DollarSign,
    Swords,
    Lightbulb,
    TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Shape rendered by the card — produced by the API and by the history pages. */
export interface DisplayIdea {
    title: string;
    problem: string;
    demand_level: "low" | "medium" | "high";
    demand_evidence: string;
    competitors: { name: string; weakness: string }[];
    gaps: string[];
    monetization: string;
    pricing_hint: string;
    target_user: string;
    confidence: number;
    sources: { url: string; title: string; quote: string }[];
}

const DEMAND_STYLES: Record<DisplayIdea["demand_level"], string> = {
    high: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    low: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export default function IdeaCard({ idea }: { idea: DisplayIdea }) {
    return (
        <article className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6">
            {/* Header */}
            <header className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <h3 className="text-lg font-bold leading-snug">{idea.title}</h3>
                    {idea.target_user && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Target size={13} /> {idea.target_user}
                        </p>
                    )}
                </div>
                <span
                    className={cn(
                        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
                        DEMAND_STYLES[idea.demand_level]
                    )}
                >
                    <TrendingUp size={12} /> {idea.demand_level} demand
                </span>
            </header>

            {/* Problem */}
            <div>
                <p className="text-sm leading-relaxed text-foreground/90">{idea.problem}</p>
                {idea.demand_evidence && (
                    <p className="mt-2 rounded-lg bg-secondary/60 p-3 text-xs leading-relaxed text-muted-foreground">
                        <span className="font-semibold text-foreground/80">Why this demand: </span>
                        {idea.demand_evidence}
                    </p>
                )}
            </div>

            {/* Confidence bar */}
            <div>
                <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Analyst confidence</span>
                    <span className="font-semibold text-foreground/80">
                        {Math.round(idea.confidence * 100)}%
                    </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(100, Math.max(0, idea.confidence * 100))}%` }}
                    />
                </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                {/* Competitors */}
                {idea.competitors.length > 0 && (
                    <Section icon={<Swords size={14} />} title="Competitors & weaknesses">
                        <ul className="space-y-2">
                            {idea.competitors.map((c, i) => (
                                <li key={i} className="text-xs">
                                    <span className="font-semibold text-foreground/90">{c.name}</span>
                                    {c.weakness && (
                                        <span className="text-muted-foreground"> — {c.weakness}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </Section>
                )}

                {/* Gaps */}
                {idea.gaps.length > 0 && (
                    <Section icon={<Lightbulb size={14} />} title="Gaps left open">
                        <ul className="space-y-1.5">
                            {idea.gaps.map((g, i) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                    <span className="text-primary">▹</span>
                                    <span>{g}</span>
                                </li>
                            ))}
                        </ul>
                    </Section>
                )}
            </div>

            {/* Monetization */}
            {(idea.monetization || idea.pricing_hint) && (
                <div className="flex flex-wrap items-start gap-x-6 gap-y-2 rounded-lg border border-border bg-background/40 p-3 text-xs">
                    {idea.monetization && (
                        <div className="flex items-start gap-1.5">
                            <DollarSign size={14} className="mt-0.5 text-primary" />
                            <span>
                                <span className="font-semibold">Monetization: </span>
                                <span className="text-muted-foreground">{idea.monetization}</span>
                            </span>
                        </div>
                    )}
                    {idea.pricing_hint && (
                        <div className="flex items-start gap-1.5">
                            <span className="mt-0.5 font-semibold text-primary">~</span>
                            <span>
                                <span className="font-semibold">Pricing hint: </span>
                                <span className="text-muted-foreground">{idea.pricing_hint}</span>
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Source threads */}
            {idea.sources.length > 0 && (
                <Section icon={<Quote size={14} />} title={`Source threads (${idea.sources.length})`}>
                    <ul className="space-y-2.5">
                        {idea.sources.map((s, i) => (
                            <li key={i} className="rounded-lg border border-border bg-background/40 p-3">
                                <a
                                    href={s.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                                >
                                    <ExternalLink size={12} className="shrink-0" />
                                    <span className="truncate">{s.title}</span>
                                </a>
                                {s.quote && (
                                    <p className="mt-1.5 border-l-2 border-border pl-2 text-xs italic text-muted-foreground">
                                        “{s.quote}”
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                </Section>
            )}
        </article>
    );
}

function Section({
    icon,
    title,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {icon} {title}
            </h4>
            {children}
        </div>
    );
}
