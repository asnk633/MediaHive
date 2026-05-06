import React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

const SkyToggle = React.forwardRef<
    React.ElementRef<typeof SwitchPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
    <SwitchPrimitive.Root
        className={cn("switch-apple", className)}
        {...props}
        ref={ref}
    >
        <SwitchPrimitive.Thumb
            className="switch-apple-thumb"
        />
    </SwitchPrimitive.Root>
))
SkyToggle.displayName = SwitchPrimitive.Root.displayName

export { SkyToggle }
