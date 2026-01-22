import React from 'react';
import { WifiOff } from 'lucide-react';

interface OfflinePlaceholderProps {
    title: string;
    message?: string;
    icon?: React.ElementType;
}

export function OfflinePlaceholder({
    title,
    message = "This feature is unavailable in offline mode.",
    icon: Icon = WifiOff
}: OfflinePlaceholderProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 bg-[var(--bg-surface)] rounded-full flex items-center justify-center mb-6 ring-1 ring-[var(--border-subtle)]">
                <Icon className="w-8 h-8 text-[var(--text-secondary)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
            <p className="text-[var(--text-secondary)] max-w-sm">
                {message}
            </p>
        </div>
    );
}
