import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const SkySelect = SelectPrimitive.Root;
const SkySelectGroup = SelectPrimitive.Group;
const SkySelectValue = SelectPrimitive.Value;

const SkySelectTrigger = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
    <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
            "flex h-10 w-full items-center justify-between rounded-xl border border-foreground/10 bg-foreground/[0.03] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50",
            "backdrop-blur-md shadow-sm transition-all duration-300 hover:bg-foreground/[0.06]",
            className
        )}
        {...props}
    >
        {children}
        <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 opacity-50 transition-transform duration-300 group-data-[state=open]:rotate-180" />
        </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
));
SkySelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SkySelectContent = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
    <SelectPrimitive.Portal>
        <SelectPrimitive.Content
            ref={ref}
            className={cn(
                "relative z-50 min-w-[8rem] overflow-hidden rounded-xl border border-foreground/10 bg-slate-950/90 text-slate-200 shadow-elevated animate-in fade-in-80",
                "backdrop-blur-xl",
                className
            )}
            position={position}
            {...props}
        >
            <SelectPrimitive.Viewport
                className={cn(
                    "p-1",
                    position === "popper" &&
                    "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
                )}
            >
                {children}
            </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
));
SkySelectContent.displayName = SelectPrimitive.Content.displayName;

const SkySelectItem = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item
        ref={ref}
        className={cn(
            "relative flex w-full cursor-default select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-indigo-500/20 focus:text-indigo-200 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors duration-200",
            className
        )}
        {...props}
    >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <SelectPrimitive.ItemIndicator>
                <Check className="h-4 w-4 text-indigo-400" />
            </SelectPrimitive.ItemIndicator>
        </span>

        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
));
SkySelectItem.displayName = SelectPrimitive.Item.displayName;

export {
    SkySelect,
    SkySelectGroup,
    SkySelectValue,
    SkySelectTrigger,
    SkySelectContent,
    SkySelectItem,
};
