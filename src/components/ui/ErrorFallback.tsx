import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
    message?: string;
    onRetry?: () => void;
    className?: string;
}

export const ErrorFallback = ({
    message = "Unable to load data",
    onRetry,
    className = ""
}: ErrorFallbackProps) => {
    return (
        <div className={`flex flex-col items-center justify-center p-8 rounded-2xl border border-red-500/10 bg-red-500/[0.02] text-center animate-in fade-in duration-500 ${className}`}>
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400/50 mb-4 border border-red-500/20">
                <AlertCircle size={24} />
            </div>
            <h3 className="text-sm font-bold text-foreground/80 uppercase tracking-widest mb-1">
                {message}
            </h3>
            <p className="text-[10px] text-foreground/80 mb-6 max-w-[240px] leading-relaxed">
                The system encountered a minor sync issue. Your dashboard remains active while we retry.
            </p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="flex items-center gap-2 px-6 py-2 text-[10px] font-bold text-foreground/80 bg-foreground/5 hover:bg-foreground/10 rounded-xl transition-all border border-foreground/10 uppercase tracking-[0.2em] active:scale-95"
                >
                    <RefreshCw size={12} />
                    Retry Sync
                </button>
            )}
        </div>
    );
};
