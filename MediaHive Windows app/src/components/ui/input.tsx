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
      default: "border-white/5 focus:border-indigo-500/50 focus:ring-indigo-500/20",
      error: "border-red-500/50 focus:ring-red-500/20 placeholder:text-red-500/40",
      success: "border-emerald-500/50 focus:ring-emerald-500/20",
    };

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label className="text-xs font-medium text-zinc-400 ml-1">
            {label}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            spellCheck={props.type !== "password" && props.type !== "email"}
            className={cn(
              "flex h-10 w-full rounded-lg bg-zinc-900/40 px-3 py-2 text-sm text-zinc-100",
              "border outline-none transition-all duration-200",
              "placeholder:text-zinc-500",
              "focus:ring-4 focus:bg-zinc-900/60",
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
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
          )}
        </div>

        {error && (
          <p className="text-xs text-red-400 ml-1">
            {error}
          </p>
        )}

        {!error && description && (
          <p className="text-xs text-zinc-500 ml-1">
            {description}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
