import { cn } from "@/lib/utils";

interface WorkspaceLayoutProps {
    children: React.ReactNode;
    className?: string;
    sidebar?: React.ReactNode;
}

export function WorkspaceLayout({
    children,
    className
}: WorkspaceLayoutProps) {
    return (
        <div className={cn(
            "mh-workspace-layout", // Enforces px-10 py-10
            "w-full max-w-[1280px] mx-0", // Rigid structure
            className
        )}>
            {children}
        </div>
    );
}
