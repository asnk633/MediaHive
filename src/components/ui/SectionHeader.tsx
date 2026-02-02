import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
    title: string;
    icon?: LucideIcon;
    action?: React.ReactNode;
    className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, icon: Icon, action, className = '' }) => {
    return (
        <div className={`flex items-center justify-between mb-8 ml-1 ${className}`}>
            <div className="flex items-center gap-4">
                {/* 4-Layer Depth Anchor */}
                <div className="h-1.5 w-6 bg-accent-primary rounded-full shadow-[0_0_12px_var(--accent-primary)] opacity-60" />

                <div className="flex items-center gap-3">
                    {Icon && <Icon size={16} className="text-text-muted opacity-30" />}
                    <h2 className="text-[11px] font-black text-text-muted uppercase tracking-[0.5em] opacity-40 leading-none">
                        {title}
                    </h2>
                </div>
            </div>

            {action && (
                <div className="text-[10px] font-black uppercase tracking-widest text-accent-primary hover:text-accent-primary/80 transition-all cursor-pointer bg-accent-primary/5 px-3 py-1 rounded-xs border border-accent-primary/10 hover:bg-accent-primary/10">
                    {action}
                </div>
            )}
        </div>
    );
};
