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
    primary: "bg-primary text-foreground hover:opacity-90 rounded-full shadow-none border border-transparent",
    default: "bg-primary text-foreground hover:opacity-90 rounded-full shadow-none border border-transparent", // Alias
    secondary: "bg-foreground/5 hover:bg-foreground/10 text-foreground rounded-full border border-foreground/5",
    outline: "border border-foreground/10 hover:bg-foreground/5 text-foreground rounded-md", // Restored outline
    ghost: "bg-transparent hover:bg-foreground/5 text-foreground/70 hover:text-foreground rounded-md",
    link: "text-primary hover:underline underline-offset-4 bg-transparent", // Restored link
    danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-md",
    destructive: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-md", // Alias
  };

  const sizes = {
    sm: "h-8 px-4 text-xs", // Adjusted padding for pill look
    md: "h-10 px-5 text-sm", // Adjusted padding for pill look
    lg: "h-12 px-7 text-base", // Adjusted padding for pill look
    icon: "h-10 w-10 rounded-full", // Icon buttons are circular
  };

  return cn(
    "inline-flex items-center justify-center font-medium",
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
