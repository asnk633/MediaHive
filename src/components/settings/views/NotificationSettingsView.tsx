import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';

export const NotificationSettingsView = () => {
    return (
        <div className="space-y-6 max-w-2xl">
            <div className="space-y-1">
                <h3 className="text-lg font-medium text-white">Notifications</h3>
                <p className="text-sm text-slate-400">
                    Configure how you receive alerts and updates.
                </p>
            </div>

            <div className="space-y-4">
                <Card className="bg-slate-950/30 border-white/5">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base text-slate-200">Device Requests</Label>
                            <p className="text-xs text-slate-500">Receive alerts when items are requested or approved.</p>
                        </div>
                        <Switch id="notify-requests" checked disabled />
                    </CardContent>
                </Card>

                <Card className="bg-slate-950/30 border-white/5">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base text-slate-200">Task Assignments</Label>
                            <p className="text-xs text-slate-500">Get notified when tasks are assigned to you.</p>
                        </div>
                        <Switch id="notify-tasks" checked disabled />
                    </CardContent>
                </Card>

                <Card className="bg-slate-950/30 border-white/5">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base text-slate-200">System Updates</Label>
                            <p className="text-xs text-slate-500">News about MediaHive features.</p>
                        </div>
                        <Switch id="notify-system" disabled />
                    </CardContent>
                </Card>
            </div>

            <p className="text-xs text-slate-600 text-center pt-8">
                Notification preferences are globally managed by Admin in this version.
            </p>
        </div>
    );
};
