"use client";

import { useEffect, useRef, useState } from "react";
import { Search, CornerDownLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Command = {
    id: string;
    label: string;
    shortcut?: string;
    run: () => void;
};

export function CommandPalette({
    open,
    onClose,
    commands,
}: {
    open: boolean;
    onClose: () => void;
    commands: Command[];
}) {
    const ref = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Focus input on open
    useEffect(() => {
        if (open) {
            setTimeout(() => ref.current?.focus(), 10);
            setQuery("");
            setSelectedIndex(0);
        }
    }, [open]);

    // Click outside to close (backdrop handled by overlay)
    // But adding explicit close on escape handled globally? No, let's handle esc inside too.
    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
                e.stopPropagation();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    const filtered = commands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase())
    );

    // Keyboard Navigation inside filtered list
    useEffect(() => {
        const handleNav = (e: KeyboardEvent) => {
            if (!open) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filtered.length);
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
            }
            if (e.key === "Enter") {
                e.preventDefault();
                if (filtered[selectedIndex]) {
                    filtered[selectedIndex].run();
                    onClose();
                }
            }
        };
        window.addEventListener("keydown", handleNav);
        return () => window.removeEventListener("keydown", handleNav);
    }, [open, filtered, selectedIndex, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[20vh] animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                ref={containerRef}
                className="w-full max-w-xl bg-[#0F1218] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 slide-in-from-top-4"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center px-4 py-3 border-b border-white/5 gap-3">
                    <Search className="w-5 h-5 text-muted/50" />
                    <input
                        ref={ref}
                        placeholder="Type a command..."
                        value={query}
                        onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                        className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted/40 text-sm h-6"
                    />
                    <button onClick={onClose} className="text-muted/50 hover:text-foreground transition-colors"><X size={16} /></button>
                </div>

                <div className="max-h-[300px] overflow-y-auto p-2">
                    {filtered.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted/50">No commands found.</div>
                    ) : (
                        <ul className="space-y-1">
                            {filtered.map((cmd, idx) => (
                                <li key={cmd.id}>
                                    <button
                                        className={cn(
                                            "w-full flex justify-between items-center px-3 py-2.5 rounded-lg text-left text-sm transition-colors group",
                                            idx === selectedIndex ? "bg-blue-500/10 text-blue-100" : "text-muted hover:bg-white/5 hover:text-foreground"
                                        )}
                                        onClick={() => {
                                            cmd.run();
                                            onClose();
                                        }}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                    >
                                        <span className="font-medium">{cmd.label}</span>
                                        <div className="flex items-center gap-2">
                                            {cmd.shortcut && (
                                                <span className={cn("text-[10px] uppercase font-bold px-1.5 py-0.5 rounded", idx === selectedIndex ? "bg-blue-500/20 text-blue-200" : "bg-white/5 text-muted/70")}>
                                                    {cmd.shortcut}
                                                </span>
                                            )}
                                            {idx === selectedIndex && <CornerDownLeft size={12} className="opacity-50" />}
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="px-4 py-2 border-t border-white/5 bg-white/[0.02] flex items-center justify-between text-[10px] text-muted/40">
                    <div className="flex gap-3">
                        <span><kbd className="font-sans">↑↓</kbd> to navigate</span>
                        <span><kbd className="font-sans">↵</kbd> to select</span>
                    </div>
                    <span>Internal v1.0</span>
                </div>
            </div>
        </div>
    );
}
