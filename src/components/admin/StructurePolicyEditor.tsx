"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RotateCcw } from 'lucide-react';
import { SUPPORTED_AUTOMATION_EVENTS, StructurePolicy, PolicyScopeType, AutomationRulePolicy, getDefaultRule } from '@/types/structure-policy';
import { toast } from 'sonner';

interface StructurePolicyEditorProps {
    scopeType: PolicyScopeType;
    scopeId: string;
    parentScopeId?: string; // If unit, need institution_id for inheritance check
}

export const StructurePolicyEditor: React.FC<StructurePolicyEditorProps> = ({ scopeType, scopeId, parentScopeId }) => {
    const [currentPolicy, setCurrentPolicy] = useState<StructurePolicy | null>(null);
    const [parentPolicy, setParentPolicy] = useState<StructurePolicy | null>(null);
    const [globalPolicy, setGlobalPolicy] = useState<StructurePolicy | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch Chain
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                // 1. Current
                const currentData = await apiClient(`/api/admin/structure-policies?scopeType=${scopeType}&scopeId=${scopeId}`);
                setCurrentPolicy(currentData.policy);

                // 2. Parent (Institution) if Unit
                if (scopeType === 'unit' && parentScopeId) {
                    const parentData = await apiClient(`/api/admin/structure-policies?scopeType=institution&scopeId=${parentScopeId}`);
                    setParentPolicy(parentData.policy);
                }

                // 3. Global
                const globalData = await apiClient(`/api/admin/structure-policies?scopeType=global&scopeId=global`);
                setGlobalPolicy(globalData.policy);
            } catch (e) {
                console.error("Failed to load policy chain", e);
                toast.error("Failed to load policies");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [scopeType, scopeId, parentScopeId]);

    const resolveEffective = (eventType: string) => {
        // Current explicitly set?
        if (currentPolicy?.rules?.[eventType]) {
            return { rule: currentPolicy.rules[eventType], source: 'Self', isInherited: false };
        }
        // Parent?
        if (parentPolicy?.rules?.[eventType]) {
            return { rule: parentPolicy.rules[eventType], source: 'Institution', isInherited: true };
        }
        // Global?
        if (globalPolicy?.rules?.[eventType]) {
            return { rule: globalPolicy.rules[eventType], source: 'Global', isInherited: true };
        }
        // Default
        return { rule: getDefaultRule(eventType), source: 'Default', isInherited: true };
    };

    const handleUpdate = async (newRules: any) => {
        // Optimistic
        const updatedPolicy = { ...currentPolicy!, rules: newRules } as StructurePolicy;
        setCurrentPolicy(updatedPolicy);

        try {
            await apiClient(`/api/admin/structure-policies`, {
                method: 'PUT',
                body: JSON.stringify({ scopeType, scopeId, rules: newRules })
            });
        } catch (e) {
            toast.error("Failed to save policy");
            // Reload?
        }
    };

    const toggleRule = (eventType: string, checked: boolean) => {
        if (!currentPolicy) return;
        const newRules = {
            ...currentPolicy.rules,
            [eventType]: {
                ...(currentPolicy.rules[eventType] || getDefaultRule(eventType)),
                enabled: checked
            }
        };
        handleUpdate(newRules);
    };

    const updateEscalation = (eventType: string, val: string) => {
        if (!currentPolicy) return;
        const level = val === '' ? undefined : parseInt(val);
        const newRules = {
            ...currentPolicy.rules,
            [eventType]: {
                ...(currentPolicy.rules[eventType] || getDefaultRule(eventType)),
                maxEscalationLevel: level
            }
        };
        handleUpdate(newRules);
    };

    const revertToInherited = (eventType: string) => {
        if (!currentPolicy) return;
        const newRules = { ...currentPolicy.rules };
        delete newRules[eventType]; // Remove explicit key to resume inheritance
        handleUpdate(newRules);
    };

    if (loading) return <div className="p-8 text-center text-slate-500 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <Card className="bg-slate-950/40 border-slate-800">
            <CardHeader>
                <CardTitle>Policy Configuration ({scopeType})</CardTitle>
                <CardDescription>
                    IDs: {scopeId} {parentScopeId ? `(Parent: ${parentScopeId})` : ''}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {SUPPORTED_AUTOMATION_EVENTS.map(eventType => {
                    const { rule, source, isInherited } = resolveEffective(eventType);
                    const isExplicit = !isInherited;

                    return (
                        <div key={eventType} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border gap-4 ${isExplicit ? 'bg-slate-900/50 border-indigo-500/30' : 'bg-slate-900/20 border-slate-800 opacity-80'}`}>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Label className="text-base font-semibold text-slate-200">
                                        {eventType}
                                    </Label>
                                    <Badge variant="neutral" className={`text-[10px] ${isExplicit ? 'border-indigo-500 text-indigo-400' : 'border-slate-700 text-slate-500'}`}>
                                        {source}
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                {/* Escalation Limit */}
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs text-slate-500 whitespace-nowrap">Max Esc.</Label>
                                    <Input
                                        type="number"
                                        className={`w-16 h-8 text-center ${isExplicit ? 'bg-slate-950 border-slate-700' : 'bg-transparent border-transparent text-slate-500'}`}
                                        value={rule.maxEscalationLevel ?? ''}
                                        placeholder="Unl"
                                        onChange={(e) => updateEscalation(eventType, e.target.value)}
                                        disabled={isInherited && false} // Can edit inherited to OVERRIDE it. 
                                    // Wait, if I edit inherited, I must create a rule. onChange does that.
                                    // But visual indication: standard Input implies editable.
                                    />
                                </div>

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

                                {/* Revert Button */}
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
