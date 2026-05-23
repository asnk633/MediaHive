import React from "react";
import { cn } from "@/lib/utils";

interface FilterChipsProps {
    filters: { label: string; value: string }[];
    activeFilter: string;
    onSelect: (value: string) => void;
}

export function FilterChips({ filters, activeFilter, onSelect }: FilterChipsProps) {
    return (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {filters.map((filter) => {
                const isActive = activeFilter === filter.value;
                return (
                    <button
                        key={filter.value}
                        onClick={() => onSelect(filter.value)}
                        className={cn(
                            "px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200",
                            isActive
                                ? "bg-[var(--text-primary)] text-foreground shadow-lg shadow-gray-200/50"
                                : "bg-white text-[var(--text-secondary)] border border-transparent hover:bg-gray-50"
                        )}
                    >
                        {filter.label}
                    </button>
                );
            })}
        </div>
    );
}
