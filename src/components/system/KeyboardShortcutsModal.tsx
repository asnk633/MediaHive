import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
    open: boolean;
    onClose: () => void;
}

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
    if (!open) return null;

    const shortcuts = [
        { key: "G H", label: "Go Home" },
        { key: "G T", label: "Go Tasks" },
        { key: "T", label: "Today Focus" },
        { key: "N", label: "New Task" },
        { key: "Ctrl+K", label: "Command Palette" },
        { key: "J / K", label: "Navigate Lists" },
        { key: "Enter", label: "Open Selection" },
        { key: "E", label: "Mark Complete" },
        { key: "S", label: "Snooze (Coming Soon)" }
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}>
            <div className="w-full max-w-sm bg-[#161b22] border border-white/10 rounded-2xl shadow-2xl p-6 relative"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Keyboard Shortcuts"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Keyboard className="w-5 h-5 text-blue-400" />
                        <h2 className="text-lg font-bold text-white">Keyboard Shortcuts</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-3">
                    {shortcuts.map(s => (
                        <div key={s.label} className="flex items-center justify-between text-sm py-1 border-b border-white/5 last:border-0">
                            <span className="text-white/70">{s.label}</span>
                            <span className="px-2 py-1 rounded bg-white/10 text-white font-mono text-xs border border-white/5 shadow-inner">
                                {s.key}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 text-center">
                    <p className="text-xs text-white/40">Press <span className="text-white/60 font-mono">?</span> anytime to see this list.</p>
                </div>
            </div>
        </div>
    );
}
