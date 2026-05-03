import { cn } from "@/lib/utils";
import React from "react";

interface FormGroupProps {
    label?: string;
    error?: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

export function FormGroup({
    label,
    error,
    description,
    children,
    className
}: FormGroupProps) {
    return (
        <div className={cn("flex flex-col gap-1.5 w-full", className)}>
            {label && (
                <label className="text-xs font-medium text-gray-400 ml-1">
                    {label}
                </label>
            )}

            <div className="relative">
                {children}
            </div>

            {error && (
                <p className="mh-text-danger text-xs ml-1 animate-in slide-in-from-top-1 fade-in duration-200">
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
