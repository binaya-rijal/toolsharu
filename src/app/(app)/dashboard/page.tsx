"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { TOOLS } from "@/lib/tools";

const NAMES = ["Binay", "Baby"];

function SwitchingName() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            setIndex((i) => (i + 1) % NAMES.length);
        }, 2600);
        return () => clearInterval(id);
    }, []);

    return (
        <span className="inline-flex items-baseline text-primary">
            <span className="relative inline-grid">
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                        key={NAMES[index]}
                        initial={{ y: "0.5em", opacity: 0, filter: "blur(4px)" }}
                        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                        exit={{ y: "-0.5em", opacity: 0, filter: "blur(4px)" }}
                        transition={{ type: "spring", stiffness: 300, damping: 26 }}
                        className="col-start-1 row-start-1 whitespace-nowrap"
                    >
                        {NAMES[index]}
                    </motion.span>
                </AnimatePresence>
            </span>
            <span className="ml-0.5 animate-caret text-primary" aria-hidden>
                _
            </span>
        </span>
    );
}

const container = {
    hidden: {},
    show: {
        transition: { staggerChildren: 0.07 },
    },
};

const item = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 24 } },
};

export default function DashboardPage() {
    return (
        <div className="space-y-12">
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/15 via-card to-card p-8 md:p-10"
            >
                <div className="absolute -top-16 -right-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
                <p className="text-sm font-medium text-primary mb-2">👋 Welcome back</p>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                    <SwitchingName />
                </h1>
                <p className="text-muted-foreground mt-3 max-w-xl">
                    Everything you&apos;ve built, in one place. Pick a tool to get started — it&apos;ll
                    pin itself to your sidebar for quick access.
                </p>
            </motion.div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            >
                {TOOLS.map((tool) => (
                    <motion.div key={tool.id} variants={item}>
                        <Link
                            href={tool.href}
                            className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/60"
                        >
                            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-primary/10 to-transparent" />
                            <div className="relative flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                                    {tool.emoji}
                                </div>
                                <h3 className="font-semibold text-lg leading-tight">
                                    {tool.name}
                                </h3>
                            </div>
                            <p className="relative mt-4 flex-1 text-sm text-muted-foreground">
                                {tool.description}
                            </p>
                            <div className="relative mt-5 flex items-center text-sm font-semibold text-primary">
                                Open Tool
                                <ArrowRight
                                    size={16}
                                    className="ml-1 transition-transform group-hover:translate-x-1"
                                />
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}
