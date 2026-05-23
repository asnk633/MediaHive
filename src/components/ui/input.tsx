import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  description?: string;
  variant?: "default" | "error" | "success";
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, description, variant = "default", fullWidth = true, ...props }, ref) => {

    const variants = {
      default: "border-foreground/10 focus:border-blue-500/50 focus:ring-blue-500/20",
      error: "mh-alert-error focus:ring-red-500/20 placeholder:text-red-500/40", // Uses shared alert style for border/bg consistency
      success: "mh-alert-success focus:ring-green-500/20",
    };

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label className="text-xs font-medium text-gray-400 ml-1">
            {label}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            spellCheck={props.type !== "password" && props.type !== "email"}
            className={cn(
              "flex h-10 w-full rounded-lg bg-foreground/5 px-3 py-2 text-sm text-foreground",
              "border outline-none mh-transition-fast", // Standardized motion
              "placeholder:text-gray-500",
              "focus:ring-4 focus:bg-foreground/[0.07]",
              "disabled:cursor-not-allowed disabled:opacity-50",
              variants[variant],
              className
            )}
            {...props}
          />

          {variant === "error" && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
          )}

          {variant === "success" && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
          )}
        </div>

        {error && (
          <p className="text-xs text-red-400 ml-1 animate-in slide-in-from-top-1 fade-in duration-200">
            {error}
          </p>
        )}

        {!error && description && (
          <p className="text-xs text-gray-500 ml-1">
            {description}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
