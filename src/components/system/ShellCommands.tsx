"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGlobalHotkeys } from "@/hooks/useGlobalHotkeys";
import { CommandPalette } from "./CommandPalette";

import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";

// Events to trigger global actions that might be listening elsewhere
// For now, we'll just log or route, but eventually we might need a GlobalStore for "New Task Modal" state
// Since Phase 33-B introduced useDensityStore, maybe we should have a useUIStore?
// For simpler actions like navigation, we can just use router.

export function ShellCommands() {
    const [open, setOpen] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const router = useRouter();

    useGlobalHotkeys({
        onCommand: () => setOpen(prev => !prev),
        onToday: () => router.push('/tasks?view=today'), // Simple URL state default
        onNewTask: () => {
            // Since the New Task dialog is likely inside specific pages, we might need a global event bus or store.
            window.dispatchEvent(new CustomEvent('open-new-task'));
        },
        onSearch: () => {
            const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
            if (searchInput) {
                searchInput.focus();
            } else {
                setOpen(true);
            }
        },
        onHelp: () => setShowHelp(prev => !prev)
    });

    const commands = [
        {
            id: "home",
            label: "Go to Home",
            shortcut: "G H",
            run: () => router.push("/"),
        },
        {
            id: "tasks-all",
            label: "Go to All Tasks",
            shortcut: "G T",
            run: () => router.push("/tasks"),
        },
        {
            id: "tasks-today",
            label: "Tasks: Today Focus",
            shortcut: "T",
            run: () => router.push("/tasks?view=today"),
        },
        {
            id: "new-task",
            label: "Create New Task",
            shortcut: "N",
            run: () => window.dispatchEvent(new CustomEvent('open-new-task')),
        },
        {
            id: "settings",
            label: "Settings",
            run: () => router.push("/settings")
        },
        {
            id: "shortcuts",
            label: "Keyboard Shortcuts",
            shortcut: "?",
            run: () => setShowHelp(true)
        }
    ];

    return (
        <>
            <CommandPalette
                open={open}
                onClose={() => setOpen(false)}
                commands={commands}
            />
            <KeyboardShortcutsModal
                open={showHelp}
                onClose={() => setShowHelp(false)}
            />
        </>
    );
}
