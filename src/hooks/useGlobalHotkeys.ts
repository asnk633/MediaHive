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
            const key = e.key.toLowerCase();

            // Ignore typing in inputs
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;

            if ((e.metaKey || e.ctrlKey) && key === "k") {
                e.preventDefault();
                handlers.onCommand?.();
            }

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
