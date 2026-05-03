import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

interface AlertProps {
  type?: "success" | "warning" | "error" | "info";
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Alert({
  type = "info",
  title,
  children,
  className
}: AlertProps) {
  const styles = {
    success: "mh-alert-success",
    warning: "mh-alert-warning",
    error: "mh-alert-error",
    info: "mh-alert-info",
  };

  const icons = {
    success: CheckCircle2,
    warning: AlertTriangle,
    error: AlertCircle,
    info: Info,
  };

  const Icon = icons[type];

  return (
    <div
      className={cn(
        "mh-surface flex items-start gap-3 p-4", // Base surface structure
        styles[type], // Semantic semantic coloring
        "mh-fade-in", // Entry animation
        className
      )}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5 opacity-90" />
      <div className="space-y-1">
        {title && (
          <h5 className="font-medium leading-none tracking-tight">
            {title}
          </h5>
        )}
        <div className="text-sm opacity-90">
          {children}
        </div>
      </div>
    </div>
  );
}
