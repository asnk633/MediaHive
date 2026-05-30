import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';

interface NotificationPrefs {
    deviceRequests: boolean;
    taskAssignments: boolean;
    systemUpdates: boolean;
}

export const NotificationSettingsView = () => {
    const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchAndInitPrefs = async () => {
            try {
                const data = await apiClient('/api/user/preferences/notifications');

                if (data.notifications) {
                    setPrefs(data.notifications);
                } else {
                    // Initialize Defaults (Explicit Creation)
                    const defaults: NotificationPrefs = {
                        deviceRequests: true,
                        taskAssignments: true,
                        systemUpdates: true
                    };

                    setPrefs(defaults);

                    // Persist immediately
                    await apiClient('/api/user/preferences/notifications', {
                        method: 'PUT',
                        body: JSON.stringify({ notifications: defaults })
                    });
                }
            } catch (error) {
                console.error('Failed to fetch/init preferences', error);
                toast.error('Failed to load notification settings');
            } finally {
                setLoading(false);
            }
        };

        fetchAndInitPrefs();
    }, []);

    const handleToggle = async (key: keyof NotificationPrefs) => {
        if (!prefs) return;

        const newValue = !prefs[key];
        const newPrefs = { ...prefs, [key]: newValue };

        // Optimistic Update
        setPrefs(newPrefs);

        try {
            await apiClient('/api/user/preferences/notifications', {
                method: 'PUT',
                body: JSON.stringify({ notifications: newPrefs })
            });
            toast.success('Preferences saved');
        } catch (error) {
            console.error('Failed to save preference', error);
            toast.error('Failed to save changes');
            // Revert
            setPrefs(prefs);
        }
    };

    if (loading) {
        return <div className="text-foreground/60">Loading settings...</div>;
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="space-y-1">
                <h3 className="text-lg font-medium text-foreground">Notifications</h3>
                <p className="text-sm text-foreground/60">
                    Configure how you receive alerts and updates.
                </p>
            </div>

            <div className="space-y-4">
                <Card className="bg-slate-950/30 border-foreground/5">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base text-foreground" htmlFor="notify-requests">Device Requests</Label>
                            <p className="text-xs text-foreground/50">Receive alerts when items are requested or approved.</p>
                        </div>
                        <Switch
                            id="notify-requests"
                            checked={prefs?.deviceRequests ?? true}
                            onCheckedChange={() => handleToggle('deviceRequests')}
                            disabled={!prefs}
                        />
                    </CardContent>
                </Card>

                <Card className="bg-slate-950/30 border-foreground/5">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base text-foreground" htmlFor="notify-tasks">Task Assignments</Label>
                            <p className="text-xs text-foreground/50">Get notified when tasks are assigned to you.</p>
                        </div>
                        <Switch
                            id="notify-tasks"
                            checked={prefs?.taskAssignments ?? true}
                            onCheckedChange={() => handleToggle('taskAssignments')}
                            disabled={!prefs}
                        />
                    </CardContent>
                </Card>

                <Card className="bg-slate-950/30 border-foreground/5">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base text-foreground" htmlFor="notify-system">System Updates</Label>
                            <p className="text-xs text-foreground/50">News about MediaHive features and updates.</p>
                        </div>
                        <Switch
                            id="notify-system"
                            checked={prefs?.systemUpdates ?? true}
                            onCheckedChange={() => handleToggle('systemUpdates')}
                            disabled={!prefs}
                        />
                    </CardContent>
                </Card>
            </div>

            <p className="text-xs text-foreground/40 text-center pt-8">
                Changes are saved automatically.
            </p>
        </div>
    );
};
