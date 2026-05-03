import { cn } from "@/lib/utils";

interface DividerProps {
    className?: string;
    label?: string;
    orientation?: "horizontal"; // Enforcing horizontal only for now based on requirements
}

export function Divider({ className, label }: DividerProps) {
    return (
        <div className={cn("relative flex items-center w-full", className)}>
            <div className="flex-grow border-t border-[var(--mh-border-soft)]" />
            {label && (
                <span className="shrink-0 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {label}
                </span>
            )}
            {label && <div className="flex-grow border-t border-[var(--mh-border-soft)]" />}
        </div>
    );
}
