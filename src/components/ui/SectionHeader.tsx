import { cn } from "@/lib/utils";

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    className?: string;
}

export function SectionHeader({
    title,
    subtitle,
    action,
    className
}: SectionHeaderProps) {
    return (
        <div className={cn("flex items-start justify-between mb-6", className)}>
            <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground tracking-tight">
                    {title}
                </h3>
                {subtitle && (
                    <p className="text-sm text-secondary">
                        {subtitle}
                    </p>
                )}
            </div>
            {action && (
                <div className="flex-shrink-0 ml-4">
                    {action}
                </div>
            )}
        </div>
    );
}
