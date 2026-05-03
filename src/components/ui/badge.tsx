import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  className?: string;
}

export function Badge({
  children,
  variant = "neutral",
  className
}: BadgeProps) {
  const variantStyles = {
    // Phase 1 Spec: Soft background, no glowing effects, token colors
    success: "bg-green-500/10 text-green-400 border border-green-500/20",
    warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    danger: "bg-red-500/10 text-red-400 border border-red-500/20",
    info: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    neutral: "bg-white/5 text-gray-400 border border-white/10",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide",
        "mh-transition-fast",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
