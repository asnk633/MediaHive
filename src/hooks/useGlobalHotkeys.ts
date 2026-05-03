import { useEffect } from "react";

export function useGlobalHotkeys(handlers: {
    onCommand?: () => void;
    onToday?: () => void;
    onNewTask?: () => void;
    onSearch?: () => void;
    onHelp?: () => void;
}) {
    useEffect(() => {
        const handle = (e: KeyboardEvent) => {
            // Defensive check: ensure e.key exists
            if (!e.key) return;

            const key = e.key.toLowerCase();

            if ((e.metaKey || e.ctrlKey) && key === "k") {
                e.preventDefault();
                handlers.onCommand?.();
                return;
            }

            // Ignore typing in inputs for simple single-key shortcuts
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;

            if (key === "t") handlers.onToday?.();
            if (key === "n") handlers.onNewTask?.();
            if (key === "/") {
                e.preventDefault();
                handlers.onSearch?.();
            }
            if (e.key === "?") {
                handlers.onHelp?.();
            }
        };

        window.addEventListener("keydown", handle);
        return () => window.removeEventListener("keydown", handle);
    }, [handlers]);
}
