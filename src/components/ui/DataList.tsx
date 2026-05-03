import { cn } from "@/lib/utils";
import React, { useRef, useEffect } from "react";

interface DataListProps {
    children: React.ReactNode;
    density?: "comfortable" | "compact";
    className?: string;

    // Selection props — all optional; only active when selectable=true
    selectable?: boolean;
    isAllSelected?: boolean;
    isIndeterminate?: boolean;
    onSelectAll?: () => void;
    onClearAll?: () => void;
    /** Optional label for the header checkbox column (sr-only) */
    selectionLabel?: string;
}

/**
 * DataList — density-aware list container.
 *
 * When `selectable` is true, renders a sticky header row with a master
 * checkbox that drives select-all / clear-all behaviour.
 * The component itself is stateless — the parent owns useBulkSelection.
 */
export function DataList({
    children,
    density = "comfortable",
    className,
    selectable = false,
    isAllSelected = false,
    isIndeterminate = false,
    onSelectAll,
    onClearAll,
    selectionLabel = "Select all",
}: DataListProps) {
    const masterRef = useRef<HTMLInputElement>(null);

    // Drive the native indeterminate property (cannot be set via JSX attr)
    useEffect(() => {
        if (masterRef.current) {
            masterRef.current.indeterminate = isIndeterminate;
        }
    }, [isIndeterminate]);

    const handleMasterChange = () => {
        if (isAllSelected || isIndeterminate) {
            onClearAll?.();
        } else {
            onSelectAll?.();
        }
    };

    return (
        <div
            className={cn(
                "w-full flex flex-col width-full",
                density === "comfortable" ? "mh-density-comfortable" : "mh-density-compact",
                className,
            )}
            role="list"
        >
            {selectable && (
                <div
                    role="listitem"
                    className={cn(
                        "flex items-center w-full border-b border-white/5",
                        "h-[var(--mh-row-height)] px-[var(--mh-cell-padding)]",
                        "bg-white/[0.01]",
                    )}
                >
                    {/* Master checkbox — 32px column matching DataRow checkbox col */}
                    <div className="flex-shrink-0 w-8 flex items-center justify-center">
                        <input
                            ref={masterRef}
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={handleMasterChange}
                            aria-label={selectionLabel}
                            className={cn(
                                "w-4 h-4 rounded border border-white/20 bg-transparent",
                                "checked:bg-white/20 checked:border-white/40",
                                "cursor-pointer transition-all duration-150",
                                "accent-white/80",
                            )}
                        />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50 ml-2 select-none">
                        {isAllSelected
                            ? "All selected"
                            : isIndeterminate
                                ? "Some selected"
                                : selectionLabel}
                    </span>
                </div>
            )}
            {children}
        </div>
    );
}
