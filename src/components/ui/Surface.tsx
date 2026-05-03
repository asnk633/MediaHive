/**
 * MediaHive Surface Component
 * 
 * Enforces consistent glass panel styling across the application.
 * Prevents manual panel styling and ensures architectural compliance.
 * 
 * Usage:
 *   <Surface className="p-6">
 *     {children}
 *   </Surface>
 * 
 * Architecture:
 *   Canvas (infinite) → Ambient light → Content (transparent) → Surface (glass panels)
 */

import { cn } from "@/lib/utils";

interface SurfaceProps {
    children: React.ReactNode;
    className?: string;
    variant?: "default" | "strong" | "subtle";
    padding?: "none" | "sm" | "md" | "lg";
    hoverable?: boolean;
}

export function Surface({
    children,
    className = "",
    variant = "default",
    padding = "md",
    hoverable = false
}: SurfaceProps) {
    const paddings = {
        none: "",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
    };

    return (
        <div
            className={cn(
                // Base glass styling (locked via plugin)
                "mh-surface",
                // Variant overrides
                variant === "strong" && "mh-surface-strong",
                variant === "subtle" && "mh-surface-subtle",
                // Padding
                paddings[padding],
                // Hover effect
                hoverable && "mh-transition hover:mh-surface-strong mh-hover-lift cursor-pointer", // Standardized motion
                // User-provided classes
                className
            )}
        >
            {children}
        </div>
    );
}
