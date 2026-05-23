'use client';

import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Info } from 'lucide-react';
import { cn } from "@/lib/utils";

interface ConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary';
    onConfirm: () => void | Promise<void>;
}

export function ConfirmationDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText = "Confirm Action",
    cancelText = "Cancel",
    variant = 'primary',
    onConfirm
}: ConfirmationDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="bg-slate-950/90 backdrop-blur-xl border-foreground/10">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground flex items-center gap-2">
                        {variant === 'danger' ? (
                            <AlertTriangle className="text-rose-500" size={20} />
                        ) : (
                            <Info className="text-blue-500" size={20} />
                        )}
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-400">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="bg-foreground/5 border-foreground/10 text-foreground hover:bg-foreground/10 hover:text-foreground">
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={onConfirm}
                        className={cn(
                            "font-bold",
                            variant === 'danger' 
                                ? "bg-rose-500 hover:bg-rose-600 text-foreground" 
                                : "bg-blue-600 hover:bg-blue-700 text-foreground"
                        )}
                    >
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
