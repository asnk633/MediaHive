"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw } from 'lucide-react';
import { ESCALATION_EVENTS, RolePolicy, RolePolicyScopeType, DEFAULT_ROLE_POLICY_RULE } from '@/types/role-policy';
import { toast } from 'sonner';

interface RolePolicyEditorProps {
    scopeType: RolePolicyScopeType;
    scopeId: string;
}

export const RolePolicyEditor: React.FC<RolePolicyEditorProps> = ({ scopeType, scopeId }) => {
    const [currentPolicy, setCurrentPolicy] = useState<RolePolicy | null>(null);
    const [globalPolicy, setGlobalPolicy] = useState<RolePolicy | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                // Current
                const currentData = await apiClient(`/api/admin/role-policies?scopeType=${scopeType}&scopeId=${scopeId}`);
                setCurrentPolicy(currentData.policy);

                // Global (if not global)
                if (scopeType !== 'global') {
                    const globalData = await apiClient(`/api/admin/role-policies?scopeType=global&scopeId=global`);
                    setGlobalPolicy(globalData.policy);
                }
            } catch (e) {
                console.error(e);
                toast.error("Failed to load policies");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [scopeType, scopeId]);

    const resolveEffective = (eventType: string) => {
        // Current
        if (currentPolicy?.rules?.[eventType]) {
            return { rule: currentPolicy.rules[eventType], source: 'Self', isInherited: false };
        }
        // Global
        if (scopeType !== 'global' && globalPolicy?.rules?.[eventType]) {
            return { rule: globalPolicy.rules[eventType], source: 'Global', isInherited: true };
        }
        // Default
        return { rule: DEFAULT_ROLE_POLICY_RULE, source: 'Default', isInherited: true };
    };

    const handleUpdate = async (newRules: any) => {
        const updatedPolicy = { ...currentPolicy!, rules: newRules } as RolePolicy;
        setCurrentPolicy(updatedPolicy);

        try {
            await apiClient(`/api/admin/role-policies`, {
                method: 'PUT',
                body: JSON.stringify({ scopeType, scopeId, rules: newRules })
            });
        } catch (e) {
            toast.error("Failed to save policy");
        }
    };

    const toggleRule = (eventType: string, checked: boolean) => {
        if (!currentPolicy) return;
        const newRules = {
            ...currentPolicy.rules,
            [eventType]: {
                ...(currentPolicy.rules[eventType] || DEFAULT_ROLE_POLICY_RULE),
                enabled: checked
            }
        };
        handleUpdate(newRules);
    };

    const revertToInherited = (eventType: string) => {
        if (!currentPolicy) return;
        const newRules = { ...currentPolicy.rules };
        delete newRules[eventType];
        handleUpdate(newRules);
    };

    if (loading) return <div className="p-8 text-center flex justify-center"><Loader2 className="animate-spin text-slate-500" /></div>;

    return (
        <Card className="bg-slate-950/40 border-slate-800">
            <CardHeader>
                <CardTitle>Admin Escalation Policy ({scopeType})</CardTitle>
                <CardDescription>
                    Configure when Admin notifications are triggered for escalations.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {ESCALATION_EVENTS.map(eventType => {
                    const { rule, source, isInherited } = resolveEffective(eventType);
                    const isExplicit = !isInherited;

                    return (
                        <div key={eventType} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border gap-4 ${isExplicit ? 'bg-slate-900/50 border-indigo-500/30' : 'bg-slate-900/20 border-slate-800 opacity-80'}`}>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Label className="text-base font-semibold text-slate-200">
                                        {eventType}
                                    </Label>
                                    <Badge variant="outline" className={`text-[10px] ${isExplicit ? 'border-indigo-500 text-indigo-400' : 'border-slate-700 text-slate-500'}`}>
                                        {source}
                                    </Badge>
                                </div>
                                <p className="text-xs text-slate-500">Escalates at Level {rule.escalateAtLevel}</p>
                            </div>

                            <div className="flex items-center gap-6">
                                {/* Enabled Toggle */}
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={rule.enabled}
                                        onCheckedChange={(c) => toggleRule(eventType, c)}
                                    />
                                    <span className={`text-sm font-medium w-16 ${rule.enabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        {rule.enabled ? 'On' : 'Off'}
                                    </span>
                                </div>

                                {isExplicit && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-500 hover:text-white"
                                        onClick={() => revertToInherited(eventType)}
                                        title="Revert to Inherited"
                                    >
                                        <RotateCcw size={14} />
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
};
