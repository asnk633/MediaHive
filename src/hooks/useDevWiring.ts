import { useEffect } from 'react';

interface WiredAction {
    name: string;
    handler: Function | undefined;
    visible: boolean;
    destructive?: boolean;
    disabled?: boolean;
    permissionVerified?: boolean;
}

/**
 * Development-only hook to audit UI wiring.
 * Warns in console if enabled actions are missing handlers or safeguards.
 * 
 * @param componentName Name of the component being audited
 * @param actions List of actions to verify
 */
export const useDevWiring = (componentName: string, actions: WiredAction[]) => {
    useEffect(() => {
        // Only run in development
        if (process.env.NODE_ENV !== 'development') return;

        actions.forEach(action => {
            // Rule 1: Visible buttons must have a handler
            if (action.visible && !action.handler && !action.disabled) {
                console.warn(
                    `%c[Wiring Audit] %c${componentName}: Action "${action.name}" is VISIBLE but has NO HANDLER (onClick is undefined).`,
                    'color: orange; font-weight: bold;', 'color: inherit;'
                );
            }

            // Rule 2: Destructive actions should have permission checks
            if (action.visible && action.destructive) {
                if (action.permissionVerified === false) {
                    console.warn(
                        `%c[Wiring Audit] %c${componentName}: Destructive Action "${action.name}" is VISIBLE but flagged as PERMISSION DENIED (Role verification failed).`,
                        'color: red; font-weight: bold;', 'color: inherit;'
                    );
                }
            }
        });
    }, [componentName, actions]);
};
