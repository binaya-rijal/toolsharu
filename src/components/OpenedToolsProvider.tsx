"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

const STORAGE_KEY = "toolsharu:opened-tools";

interface OpenedToolsContextValue {
    openedIds: string[];
    openTool: (id: string) => void;
    closeTool: (id: string) => void;
}

const OpenedToolsContext = createContext<OpenedToolsContextValue | null>(null);

export function OpenedToolsProvider({ children }: { children: React.ReactNode }) {
    const [openedIds, setOpenedIds] = useState<string[]>([]);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) setOpenedIds(JSON.parse(raw));
        } catch {
            // ignore malformed storage
        }
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(openedIds));
        } catch {
            // ignore quota / unavailable storage
        }
    }, [openedIds, hydrated]);

    const openTool = useCallback((id: string) => {
        setOpenedIds((prev) => {
            const next = prev.filter((x) => x !== id);
            next.push(id);
            return next;
        });
    }, []);

    const closeTool = useCallback((id: string) => {
        setOpenedIds((prev) => prev.filter((x) => x !== id));
    }, []);

    return (
        <OpenedToolsContext.Provider value={{ openedIds, openTool, closeTool }}>
            {children}
        </OpenedToolsContext.Provider>
    );
}

export function useOpenedTools() {
    const ctx = useContext(OpenedToolsContext);
    if (!ctx) {
        throw new Error("useOpenedTools must be used within OpenedToolsProvider");
    }
    return ctx;
}

export function ToolOpenTracker({ id }: { id: string }) {
    const { openTool } = useOpenedTools();
    useEffect(() => {
        openTool(id);
    }, [id, openTool]);
    return null;
}
