'use client';

import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionHeaderProps {
    title: string;
    icon?: React.ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
    ariaLabel?: string;
    className?: string;
}

export const CollapsibleSectionHeader: React.FC<CollapsibleSectionHeaderProps> = ({
    title,
    icon,
    isExpanded,
    onToggle,
    ariaLabel,
    className
}) => {
    return (
        <button 
            onClick={onToggle}
            aria-expanded={isExpanded}
            aria-label={ariaLabel || `${isExpanded ? 'Collapse' : 'Expand'} ${title}`}
            className={cn(
                "w-full flex items-center justify-between group/header select-none transition-all duration-200", 
                "h-[46px] rounded-[18px] hover:bg-foreground/[0.03] hover:px-4 ml-2 w-[calc(100%-16px)] px-4 active:scale-[0.99]",
                className
            )}
        >
            <div className="flex items-baseline gap-[10px]">
                {icon && <div className="text-foreground/80 transition-colors group-hover/header:text-blue-400/60 flex items-center">{icon}</div>}
                <h2 className="text-sm font-bold tracking-tight text-foreground/90">
                    {title}
                </h2>
            </div>

            <div className={cn(
                "p-1.5 rounded-[18px] transition-colors duration-200",
                "text-foreground/80 group-hover/header:text-foreground/80",
            )}>
                <ChevronRight 
                    size={18} 
                    className={cn(
                        "transition-transform duration-200 ease-in-out",
                        isExpanded && "rotate-90"
                    )} 
                />
            </div>
        </button>
    );
};
