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
        <div className={`flex items-center justify-between mb-6 ml-1 ${className}`}>
            <div className="flex items-center gap-3">
                {/* Visual Anchor */}
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />

                <div className="flex items-center gap-2">
                    {Icon && <Icon size={14} className="text-gray-500" />}
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] leading-none">
                        {title}
                    </h2>
                </div>
            </div>

            {action && (
                <div className="text-sm">
                    {action}
                </div>
            )}
        </div>
    );
};
