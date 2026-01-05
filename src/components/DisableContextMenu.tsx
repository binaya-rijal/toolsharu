"use client";

import { useEffect } from "react";

export default function DisableContextMenu() {
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            
            // Allow context menu on input fields, textareas, and editable content
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable ||
                target.closest('input') ||
                target.closest('textarea')
            ) {
                return; // Allow default context menu for these elements
            }
            
            // Prevent context menu for other elements
            e.preventDefault();
        };
        document.addEventListener("contextmenu", handleContextMenu);
        return () => {
            document.removeEventListener("contextmenu", handleContextMenu);
        };
    }, []);

    return null;
}
