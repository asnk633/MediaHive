"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGlobalHotkeys } from "@/hooks/useGlobalHotkeys";
import { CommandPalette } from "./CommandPalette";

import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";

export function ShellCommands() {
    const [mounted, setMounted] = useState(false);
    const [open, setOpen] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

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

    if (!mounted) return null;

    return (
        <>
            <CommandPalette
                open={open}
                onClose={() => setOpen(false)}
            />
            <KeyboardShortcutsModal
                open={showHelp}
                onClose={() => setShowHelp(false)}
            />
        </>
    );
}
