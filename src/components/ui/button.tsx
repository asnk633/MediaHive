import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "default" | "outline" | "link" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const buttonVariants = ({
  variant = "primary",
  size = "md",
  className
}: Partial<ButtonProps> = {}) => {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20",
    default: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20", // Alias
    secondary: "mh-surface hover:mh-surface-strong text-white",
    outline: "border border-white/10 hover:bg-white/5 text-gray-300", // Restored outline
    ghost: "bg-transparent hover:bg-white/5 text-gray-400 hover:text-white",
    link: "text-blue-400 hover:underline underline-offset-4 bg-transparent", // Restored link
    danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20",
    destructive: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20", // Alias
  };

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
    icon: "h-10 w-10", // Added icon size for Calendar compatibility
  };

  return cn(
    "inline-flex items-center justify-center rounded-lg font-medium",
    "disabled:opacity-50 disabled:pointer-events-none",
    "mh-transition mh-pressable", // Standardized motion
    variants[variant as keyof typeof variants] || variants.primary,
    sizes[size as keyof typeof sizes] || sizes.md,
    className
  );
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
