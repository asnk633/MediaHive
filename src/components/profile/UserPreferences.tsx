import React from 'react';
import { Bell, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserPreferencesProps {
    notifications: boolean;
    setNotifications: (v: boolean) => void;
}

export function UserPreferences({ notifications, setNotifications }: UserPreferencesProps) {
    // Theme is currently global/system based (Night Sky), not togglable yet in this scope.
    // Placeholder logic for theme if needed later.

    return (
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-6">
            <ToggleRow
                icon={Bell}
                label="Push Notifications"
                helper="Receive updates about your tasks"
                checked={notifications}
                onChange={setNotifications}
            />
        </div>
    );
}

function ToggleRow({ icon: Icon, label, helper, checked, onChange }: { icon: any; label: string; helper?: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-surface text-muted">
                    <Icon size={18} />
                </div>
                <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
                </div>
            </div>

            <button
                onClick={() => onChange(!checked)}
                className={cn(
                    "w-11 h-6 rounded-full relative transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30",
                    checked ? "bg-primary" : "bg-muted"
                )}
            >
                <span
                    className={cn(
                        "absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-all duration-200",
                        checked ? "translate-x-5" : "translate-x-0"
                    )}
                />
            </button>
        </div>
    );
}
