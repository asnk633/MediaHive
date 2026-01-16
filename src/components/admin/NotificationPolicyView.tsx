'use client';

import React, { useState, useEffect } from 'react';
import { AutomationRule, RuleAction } from '@/types/automation-rules';
import { Loader2, Save, Bell, AlertTriangle, Clock, Play, ChevronDown, Check } from 'lucide-react';

// Configuration Mapping
const POLICY_CONFIG = [
    {
        key: 'task_due_soon',
        title: 'Task Due Reminder',
        description: 'Notify users before a task is due.',
        icon: Clock,
        field: 'hoursUntilDue',
        operator: 'lte',
        defaultVal: 24,
        unit: 'hours',
        defaultAction: 'notify',
        color: 'text-blue-400',
        bg: 'bg-blue-500/10'
    },
    {
        key: 'task_overdue',
        title: 'Task Overdue Alert',
        description: 'Notify users when a task passes its due date.',
        icon: AlertTriangle,
        field: 'hoursOverdue',
        operator: 'gt',
        defaultVal: 0,
        unit: 'hours',
        defaultAction: 'notify',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10'
    },
    {
        key: 'task_stale_warning',
        title: 'Stale Task Warning',
        description: 'Remind users if a task sits in progress/review too long.',
        icon: Bell,
        field: 'daysSinceUpdate',
        operator: 'gte',
        defaultVal: 3,
        unit: 'days',
        defaultAction: 'notify',
        color: 'text-indigo-400',
        bg: 'bg-indigo-500/10'
    },
    {
        key: 'task_stale_escalation',
        title: 'Stale Task Escalation',
        description: 'Escalate to admins if a task remains stale.',
        icon: AlertTriangle,
        field: 'daysSinceUpdate',
        operator: 'gte',
        defaultVal: 5,
        unit: 'days',
        defaultAction: 'escalate',
        color: 'text-red-400',
        bg: 'bg-red-500/10'
    },
    {
        key: 'inventory_due_soon',
        title: 'Equipment Return',
        description: 'Notify users before equipment needs to be returned.',
        icon: Clock,
        field: 'hoursUntilReturn',
        operator: 'lte',
        defaultVal: 24,
        unit: 'hours',
        defaultAction: 'notify',
        color: 'text-cyan-400',
        bg: 'bg-cyan-500/10'
    },
    {
        key: 'inventory_overdue',
        title: 'Equipment Overdue',
        description: 'Notify users immediately when equipment is late.',
        icon: AlertTriangle,
        field: 'hoursOverdue',
        operator: 'gt',
        defaultVal: 0,
        unit: 'hours',
        defaultAction: 'notify',
        color: 'text-orange-400',
        bg: 'bg-orange-500/10'
    },
    {
        key: 'inventory_escalated',
        title: 'Equipment Theft Risk',
        description: 'Escalate to admins if equipment is significantly overdue.',
        icon: AlertTriangle,
        field: 'hoursOverdue',
        operator: 'gte',
        defaultVal: 48,
        unit: 'hours',
        defaultAction: 'escalate',
        color: 'text-rose-400',
        bg: 'bg-rose-500/10'
    }
];

export default function NotificationPolicyView() {
    const [rules, setRules] = useState<AutomationRule[]>([]);
    const [systemRules, setSystemRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    const [scopeType, setScopeType] = useState<'global' | 'institution' | 'unit'>('global');
    const [scopeId, setScopeId] = useState('global');

    const fetchRules = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/automation-rules');
            if (res.ok) {
                const json = await res.json();
                setRules(json.custom);
                setSystemRules(json.system);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const getActiveRule = (configKey: string) => {
        const matches = rules.filter(r =>
            r.ruleKey === configKey &&
            r.scopeType === scopeType &&
            r.scopeId === scopeId &&
            r.enabled
        );
        matches.sort((a, b) => b.version - a.version);
        return matches[0];
    };

    const handleSavePolicy = async (config: any, enabled: boolean, value: number) => {
        setProcessing(config.key);
        try {
            const action = enabled ? config.defaultAction : 'suppress';

            const payload = {
                ruleKey: config.key,
                scopeType,
                scopeId,
                eventType: config.key,
                conditions: [
                    {
                        field: config.field,
                        operator: config.operator,
                        value: value
                    }
                ],
                action,
                priority: 10,
            };

            if (config.operator === 'lte') {
                payload.conditions.push({ field: config.field, operator: 'gt', value: 0 });
            }

            const createRes = await fetch('/api/admin/automation-rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!createRes.ok) throw new Error('Failed to create draft');
            const { rule } = await createRes.json();

            const activateRes = await fetch('/api/admin/automation-rules', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: rule.id, command: 'activate' })
            });

            if (!activateRes.ok) throw new Error('Failed to activate');

            await fetchRules();
        } catch (e) {
            alert('Failed to update policy');
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground animate-in fade-in duration-500">
            <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-x-8 gap-y-6">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-extrabold tracking-tight text-foreground drop-shadow-sm">Notification Policies</h1>
                        <p className="text-muted text-lg font-light leading-relaxed max-w-2xl">
                            Configure how and when the system alerts your team. Manage reminders, overdue warnings, and automatic escalations.
                        </p>
                    </div>

                    {/* Modern Scope Selector - Glassy & Integrated */}
                    <div className="flex flex-col gap-2 min-w-[280px]">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/80 ml-1">Configuration Scope</span>
                        <div className="relative group">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-md rounded-xl group-hover:bg-indigo-500/30 transition-all duration-500" />
                            <div className="relative flex items-center gap-2 bg-surface/80 p-1.5 rounded-xl border border-soft backdrop-blur-xl shadow-lg">
                                <div className="relative flex-1">
                                    <select
                                        className="w-full appearance-none bg-transparent text-sm font-semibold text-foreground pl-3.5 pr-8 py-2.5 outline-none cursor-pointer"
                                        value={scopeType}
                                        onChange={(e) => {
                                            setScopeType(e.target.value as any);
                                            setScopeId(e.target.value === 'global' ? 'global' : '');
                                        }}
                                    >
                                        <option value="global" className="bg-surface">Global Policy</option>
                                        <option value="institution" className="bg-surface">Institution Policy</option>
                                        <option value="unit" className="bg-surface">Unit Policy</option>
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-indigo-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>

                                {scopeType !== 'global' && (
                                    <input
                                        className="bg-muted/10 text-sm text-foreground px-3 py-2.5 rounded-lg border border-transparent focus:border-indigo-500/50 focus:bg-indigo-500/10 outline-none transition-all w-32 placeholder:text-muted font-mono"
                                        placeholder="ID..."
                                        value={scopeId}
                                        onChange={(e) => setScopeId(e.target.value)}
                                        autoFocus
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-32 space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500/50 blur-xl animate-pulse rounded-full" />
                            <Loader2 className="w-12 h-12 text-foreground relative animate-spin" />
                        </div>
                        <p className="text-muted font-light tracking-wide animate-pulse">Synchronizing Policies...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {POLICY_CONFIG.map(config => {
                            const activeRule = getActiveRule(config.key);
                            const isEnabled = activeRule ? activeRule.action !== 'suppress' : true;
                            const val = activeRule?.conditions?.find(c => c.field === config.field)?.value ?? config.defaultVal;

                            return (
                                <PolicyCard
                                    key={config.key}
                                    config={config}
                                    currentValue={val}
                                    isEnabled={isEnabled}
                                    onSave={handleSavePolicy}
                                    isProcessing={processing === config.key}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function PolicyCard({ config, currentValue, isEnabled, onSave, isProcessing }: any) {
    const [enabled, setEnabled] = useState(isEnabled);
    const [val, setVal] = useState(currentValue);
    const Icon = config.icon;

    useEffect(() => {
        setEnabled(isEnabled);
        setVal(currentValue);
    }, [isEnabled, currentValue]);

    const hasChanges = enabled !== isEnabled || val !== currentValue;

    return (
        <div className={`
            group relative flex flex-col p-6 rounded-2xl border transition-all duration-500 ease-out
            overflow-hidden isolate
            ${enabled
                ? 'bg-surface border-soft shadow-xl shadow-black/5'
                : 'bg-muted/5 border-transparent shadow-none opacity-80'
            }
        `}>
            {/* Glow Effects */}
            {enabled && (
                <>
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] rounded-full pointer-events-none" />
                </>
            )}

            {/* Card Header & Toggle */}
            <div className="relative flex justify-between items-start mb-8 z-10">
                <div className="flex gap-4 pr-4">
                    <div className={`
                        p-3.5 rounded-2xl transition-all duration-300
                        ${enabled
                            ? `bg-gradient-to-br ${config.bg} to-transparent text-foreground ring-1 ring-inset ring-soft shadow-md`
                            : 'bg-muted/10 text-muted saturate-0 scale-95'
                        }
                    `}>
                        <Icon size={24} className={enabled ? 'stroke-indigo-500 drop-shadow-sm' : ''} />
                    </div>
                    <div>
                        <h3 className={`font-semibold text-lg leading-tight transition-colors ${enabled ? 'text-foreground' : 'text-muted'}`}>
                            {config.title}
                        </h3>
                        <p className="text-sm text-muted mt-1.5 font-light leading-relaxed line-clamp-2">
                            {config.description}
                        </p>
                    </div>
                </div>

                {/* Redesigned Toggle */}
                <button
                    onClick={() => setEnabled(!enabled)}
                    className={`
                        relative w-[60px] h-[32px] rounded-full transition-all duration-300 ease-in-out shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-indigo-500/50
                        ${enabled
                            ? 'bg-indigo-600 shadow-md'
                            : 'bg-muted hover:bg-muted/80'
                        }
                    `}
                >
                    <span className={`
                        absolute top-[3px] w-[26px] h-[26px] bg-white rounded-full shadow-md transition-all duration-300 ease-in-out
                        flex items-center justify-center
                        ${enabled ? 'left-[31px]' : 'left-[3px]'}
                    `}>
                        {enabled && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />}
                    </span>
                </button>
            </div>

            {/* Input Section */}
            <div className="relative z-10 space-y-6 mt-auto">
                <div className={`
                    flex items-center justify-between py-2 px-1 border-b border-soft transition-all duration-300
                    ${!enabled ? 'opacity-30 grayscale pointer-events-none' : 'opacity-100'}
                `}>
                    <span className="text-sm text-muted font-medium">Alert Threshold</span>
                    <div className="flex items-baseline gap-2 group/input">
                        <input
                            type="number"
                            className="w-20 bg-transparent text-right text-2xl font-bold text-foreground outline-none placeholder:text-muted font-mono transition-colors group-hover/input:text-indigo-500"
                            value={val}
                            onChange={(e) => setVal(Number(e.target.value))}
                        />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{config.unit}</span>
                    </div>
                </div>

                {/* Actions Wrapper */}
                <div className="h-10 relative">
                    {/* Save Button */}
                    <button
                        onClick={() => onSave(config, enabled, val)}
                        disabled={!hasChanges || isProcessing}
                        className={`
                            absolute inset-0 w-full h-10 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 transform
                            ${hasChanges
                                ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/25 translate-y-0 opacity-100 z-10'
                                : 'translate-y-2 opacity-0 -z-10 pointer-events-none'
                            }
                        `}
                    >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> :
                            <><Save className="w-4 h-4" /> Save Changes</>}
                    </button>

                    {/* Faint Synced State - Replaces Button when no changes */}
                    {!hasChanges && !isProcessing && (
                        <div className="absolute inset-0 flex items-center justify-center gap-2 text-slate-600/40 select-none transition-all duration-500">
                            <Check className="w-3.5 h-3.5" />
                            <span className="text-xs font-semibold tracking-wider uppercase">Synced</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
