"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOpenedTools } from "@/components/OpenedToolsProvider";
import { getToolById } from "@/lib/tools";

export default function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(true);
    const { openedIds, closeTool } = useOpenedTools();

    const openedTools = openedIds
        .map((id) => getToolById(id))
        .filter((t): t is NonNullable<typeof t> => Boolean(t));

    return (
        <motion.aside
            animate={{ width: isOpen ? 272 : 80 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="flex flex-col h-screen bg-card border-r border-border shrink-0 overflow-hidden"
        >
            <div className="flex items-center justify-between p-4 border-b border-border">
                <AnimatePresence>
                    {isOpen && (
                        <motion.h1
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            className="font-bold text-lg tracking-tight whitespace-nowrap"
                        >
                            Tools<span className="text-primary">Haru</span>
                        </motion.h1>
                    )}
                </AnimatePresence>
                <button
                    onClick={() => setIsOpen((v) => !v)}
                    className="p-2 rounded-lg hover:bg-accent/10 text-foreground transition-colors"
                    aria-label="Toggle sidebar"
                >
                    <Menu size={20} />
                </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                <NavLink
                    href="/dashboard"
                    isActive={pathname === "/dashboard"}
                    isOpen={isOpen}
                    icon={<Home size={20} />}
                    label="Home"
                />

                <AnimatePresence initial={false}>
                    {isOpen && openedTools.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="px-3 pt-4 pb-1"
                        >
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Your Tools
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence initial={false}>
                    {openedTools.map((tool) => {
                        const isActive = pathname === tool.href;
                        return (
                            <motion.div
                                key={tool.id}
                                layout
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -12 }}
                                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                                className="group relative"
                            >
                                <Link
                                    href={tool.href}
                                    title={tool.name}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                                        isActive
                                            ? "bg-primary/15 text-primary"
                                            : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                                    )}
                                >
                                    <span className="text-lg leading-none w-6 text-center shrink-0">
                                        {tool.emoji}
                                    </span>
                                    {isOpen && (
                                        <span className="truncate text-sm font-medium flex-1">
                                            {tool.name}
                                        </span>
                                    )}
                                </Link>
                                {isOpen && (
                                    <button
                                        onClick={() => closeTool(tool.id)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent/20 hover:text-foreground transition-opacity"
                                        aria-label={`Remove ${tool.name}`}
                                        title="Remove from sidebar"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </nav>

            <div className="p-3 border-t border-border">
                <NavLink
                    href="/donate"
                    isActive={pathname === "/donate"}
                    isOpen={isOpen}
                    icon={<Heart size={20} />}
                    label="Donate"
                    accent
                />
            </div>
        </motion.aside>
    );
}

function NavLink({
    href,
    isActive,
    isOpen,
    icon,
    label,
    accent,
}: {
    href: string;
    isActive: boolean;
    isOpen: boolean;
    icon: React.ReactNode;
    label: string;
    accent?: boolean;
}) {
    return (
        <Link
            href={href}
            title={label}
            className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                    : accent
                        ? "text-primary hover:bg-primary/10"
                        : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
            )}
        >
            <span className="w-6 flex justify-center shrink-0">{icon}</span>
            {isOpen && <span className="truncate text-sm font-medium">{label}</span>}
        </Link>
    );
}
