import React from 'react';
import { Bell, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

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

            <Switch
                checked={checked}
                onCheckedChange={onChange}
            />
        </div>
    );
}
