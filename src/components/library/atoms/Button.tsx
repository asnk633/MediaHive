import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils'; // Assuming standard shadcn/ui utils exist, or I can inline a simple clsx/twMerge

// If cn utility doesn't exist, here is a simple fallback:
// function cn(...classes: (string | undefined | null | false)[]) { return classes.filter(Boolean).join(' '); }

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";

        const baseStyles = "inline-flex items-center justify-center rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";

        const variants = {
            primary: "bg-gradient-to-r from-[var(--color-primary-start)] to-[var(--color-primary-end)] text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 border border-transparent",
            secondary: "bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-gray-50 hover:text-[var(--color-text-primary)] hover:border-gray-300",
            ghost: "bg-transparent text-[var(--color-primary-start)] hover:bg-blue-50",
            danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-transparent",
        };

        const sizes = {
            sm: "h-8 px-3 text-xs",
            md: "h-12 px-6 text-sm",
            lg: "h-14 px-8 text-base",
            icon: "h-10 w-10",
        };

        return (
            <Comp
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button };
