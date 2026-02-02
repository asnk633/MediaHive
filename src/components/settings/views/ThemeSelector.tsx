import React from 'react';
import { Lock } from 'lucide-react';

export const ThemeSelector = () => {
    return (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-border-soft bg-surface/50">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-accent-primary text-white">
                <Lock size={16} />
            </div>
            <div className="space-y-1">
                <div className="font-medium text-sm text-foreground">
                    Standard Dark
                </div>
                <p className="text-xs text-muted-foreground">
                    Theme is managed by organization policy.
                </p>
            </div>
        </div>
    );
};
