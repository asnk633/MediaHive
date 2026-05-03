import { cn } from "@/lib/utils";
import React from "react";

interface DataRowProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    action?: React.ReactNode;

    // Selection props — all optional; only active when selectable=true
    selectable?: boolean;
    selected?: boolean;
    /** Called when the checkbox is clicked (with the native MouseEvent for Shift detection) */
    onSelectToggle?: (e: React.MouseEvent) => void;
}

/**
 * DataRow — density-aware single row.
 *
 * When `selectable` is true, a 32px checkbox column is prepended.
 * - Checkbox click → onSelectToggle (propagation stopped)
 * - Row click → onClick (unchanged behaviour)
 * - Selected state → subtle bg-white/[0.04] highlight, no layout shift
 * - The 32px column is always present when selectable=true to prevent shift
 */
export function DataRow({
    children,
    className,
    onClick,
    action,
    selectable = false,
    selected = false,
    onSelectToggle,
}: DataRowProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative flex items-center justify-between w-full border-b border-white/5",
                "mh-transition cursor-default",
                // Density tokens from parent DataList context
                "h-[var(--mh-row-height)] px-[var(--mh-cell-padding)]",
                // Base hover — only when not selected
                !selected && "bg-transparent hover:bg-white/[0.02]",
                // Click affordance
                onClick && !selected && "cursor-pointer hover:bg-white/[0.04] active:bg-white/[0.06]",
                onClick && selected && "cursor-pointer active:bg-white/[0.08]",
                // Selection highlight — existing semantic opacity token, no new hex
                selected && "bg-white/[0.04]",
                className,
            )}
            role="listitem"
        >
            {/* Checkbox column — fixed 32px, always rendered when selectable to prevent layout shift */}
            {selectable && (
                <div className="flex-shrink-0 w-8 flex items-center justify-center">
                    <input
                        type="checkbox"
                        checked={selected}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelectToggle?.(e);
                        }}
                        onChange={() => {
                            // Controlled via onClick — onChange is a no-op to silence React warning
                        }}
                        aria-checked={selected}
                        aria-label="Select row"
                        className={cn(
                            "w-4 h-4 rounded border border-white/20 bg-transparent",
                            "checked:bg-white/20 checked:border-white/40",
                            "cursor-pointer transition-all duration-150",
                            "accent-white/80",
                        )}
                    />
                </div>
            )}

            {/* Content */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
                {children}
            </div>

            {/* Action slot — hidden until hover */}
            {action && (
                <div className="flex items-center ml-4 opacity-0 group-hover:opacity-100 mh-transition-fast">
                    {action}
                </div>
            )}
        </div>
    );
}
