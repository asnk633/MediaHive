'use client';
import { API_BASE } from '@/lib/api-utils';

import React, { useState, useEffect } from 'react';
import { AutomationRule, RuleAction, ConditionOperator } from '@/types/automation-rules';
import { Loader2, Plus, Lock, Send, ShieldAlert, Archive, Copy, Play, Info, ChevronRight, Zap, AlertTriangle, ChevronDown } from 'lucide-react';
import AppLink from '@/components/AppLink';
import { apiClient } from '@/lib/apiClient';
import { DropdownSelector } from '@/components/ui/selectors/DropdownSelector';

interface RulesData {
    custom: AutomationRule[];
    system: any[];
}

export default function AutomationRulesView() {
    const [data, setData] = useState<RulesData>({ custom: [], system: [] });
    const [loading, setLoading] = useState(true);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const json = await apiClient(`${API_BASE}/admin/automation-rules`);
            setData(json);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const handleCreate = () => {
        setEditingRule(null);
        setIsEditorOpen(true);
    };

    const handleEdit = (rule: AutomationRule) => {
        if (rule.locked) return;
        setEditingRule(rule);
        setIsEditorOpen(true);
    };

    const handleClone = (rule: AutomationRule) => {
        const draft = {
            ...rule,
            id: '',
            version: 0,
            locked: false,
            enabled: false
        };
        setEditingRule(draft);
        setIsEditorOpen(true);
    };

    const handleActivate = async (id: string) => {
        if (!confirm('Activate this rule? Previous versions will be disabled.')) return;
        try {
            await apiClient(`${API_BASE}/admin/automation-rules`, {
                method: 'PATCH',
                body: JSON.stringify({ id, command: 'activate' })
            });
            fetchRules();
        } catch (e) {
            alert('Failed to activate');
        }
    };

    const handleSave = async (rule: Partial<AutomationRule>) => {
        try {
            const method = rule.id && rule.version ? 'PUT' : 'POST';
            await apiClient(`${API_BASE}/admin/automation-rules`, {
                method,
                body: JSON.stringify(rule)
            });
            setIsEditorOpen(false);
            fetchRules();
        } catch (e) {
            alert('Error saving');
        }
    };

    const activeRules = data.custom.filter(r => r.enabled);
    const drafts = data.custom.filter(r => !r.enabled);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-12">

                {/* Header & Warning Panel */}
                <div className="space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-soft pb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-500 border border-indigo-500/20 shadow-inner">
                                    <Zap size={24} className="fill-indigo-500/20" />
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">Automation Engine</h1>
                            </div>
                            <p className="text-muted max-w-2xl font-light text-lg">
                                Advanced control plane for logic resolution, scope priority, and event triggers.
                            </p>
                        </div>
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-foreground rounded-xl transition-all font-semibold shadow-xl shadow-indigo-900/20 hover:scale-[1.02]"
                        >
                            <Plus className="w-5 h-5" />
                            Create Custom Rule
                        </button>
                    </div>

                    {/* Disclaimer Alert */}
                    <div className="relative overflow-hidden flex items-start gap-5 p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-sm">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <AlertTriangle className="w-32 h-32 text-amber-500 rotate-12" />
                        </div>
                        <div className="p-2 bg-amber-500/10 rounded-lg shrink-0 text-amber-500">
                            <Info className="w-6 h-6" />
                        </div>
                        <div className="space-y-1 z-10">
                            <h4 className="text-base font-semibold text-amber-600 tracking-wide uppercase text-xs">Advanced Configuration</h4>
                            <p className="text-amber-900/80 dark:text-amber-100/70 leading-relaxed max-w-3xl">
                                This interface exposes raw engine logic. For standard notification settings (reminders, due dates), use the <AppLink href="/admin/system-health" className="text-amber-600 hover:text-amber-700 underline underline-offset-4 decoration-amber-500/30 font-medium">System Health Dashboard</AppLink>. Changes here override global defaults and may affect system stability.
                            </p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-32">
                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin opacity-50" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">

                        {/* Main Column: Active & Drafts (8 cols) */}
                        <div className="xl:col-span-8 space-y-16">
                            {/* Active Rules Section */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                                        <span className="flex w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse" />
                                        Active Overrides
                                    </h2>
                                    <span className="px-2.5 py-0.5 rounded-full bg-foreground/5 text-xs text-foreground/60 font-mono border border-foreground/5">{activeRules.length}</span>
                                </div>

                                {activeRules.length === 0 ? (
                                    <div className="p-12 text-center rounded-3xl border border-dashed border-soft bg-surface/50">
                                        <p className="text-muted font-mono text-sm">No custom overrides active. System defaults are in control.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-5">
                                        {activeRules.map(rule => (
                                            <RuleCard
                                                key={rule.id}
                                                rule={rule}
                                                onEdit={handleEdit}
                                                onClone={handleClone}
                                                onActivate={handleActivate}
                                                variant="active"
                                            />
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Drafts Section */}
                            {drafts.length > 0 && (
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                                        <h2 className="text-lg font-bold text-muted flex items-center gap-3">
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                                            Drafts & Inactive
                                        </h2>
                                        <span className="px-2 py-0.5 rounded-full bg-surface text-xs text-muted font-mono border border-soft">{drafts.length}</span>
                                    </div>
                                    <div className="grid gap-4 opacity-80">
                                        {drafts.map(rule => (
                                            <RuleCard
                                                key={rule.id}
                                                rule={rule}
                                                onEdit={handleEdit}
                                                onClone={handleClone}
                                                onActivate={handleActivate}
                                                variant="draft"
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        <div className="xl:col-span-4 space-y-6 xl:sticky xl:top-8">
                            <div className="flex items-center gap-2 pb-4 border-b border-soft">
                                <Lock className="w-4 h-4 text-muted" />
                                <h2 className="text-sm font-bold text-muted uppercase tracking-widest">System Defaults</h2>
                            </div>
                            <div className="grid gap-3 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 ease-out">
                                {data.system.map((rule: any) => (
                                    <RuleCard
                                        key={rule.id}
                                        rule={rule}
                                        readOnly
                                        variant="locked"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {isEditorOpen && (
                <RuleEditor
                    initialData={editingRule}
                    onClose={() => setIsEditorOpen(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}

function RuleCard({ rule, readOnly, onEdit, onClone, onActivate, variant = 'active' }: any) {
    const [expanded, setExpanded] = useState(false);

    // Visual Variants
    const isLocked = variant === 'locked';
    const isDraft = variant === 'draft';
    const isActive = variant === 'active';

    const baseStyles = isLocked
        ? 'bg-transparent border border-soft text-muted' // Ghosted
        : isDraft
            ? 'bg-muted/5 border border-dashed border-soft' // Draft
            : 'bg-surface border border-soft shadow-sm'; // Active

    const actionColors = {
        notify: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        escalate: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        suppress: 'bg-slate-500/10 text-foreground/60 border-slate-500/20',
        audit: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    };

    const actionColor = actionColors[rule.action as keyof typeof actionColors] || actionColors.notify;

    return (
        <div className={`
            group relative p-5 rounded-xl transition-all duration-300
            ${baseStyles}
            ${!isLocked && 'hover:border-indigo-500/30'}
        `}>
            {/* Active Indicator Strip */}
            {isActive && <div className="absolute left-0 top-4 bottom-4 w-1 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />}

            {/* Main Row */}
            <div className={`flex justify-between items-start gap-4 ${isActive ? 'pl-3' : ''}`}>

                {/* Visual Logic: Action -> Scope -> Key */}
                <div className="flex flex-col gap-3 flex-1 min-w-0">

                    {/* Top Row: Action & Scope */}
                    <div className="flex items-center flex-wrap gap-2">
                        <div className={`
                            px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider border
                            ${isLocked ? 'bg-slate-800 border-slate-700 text-foreground/50' : actionColor}
                        `}>
                            {rule.action}
                        </div>

                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-foreground/5 border border-foreground/5 text-xs font-mono text-foreground/60">
                            <span className={isActive ? 'text-indigo-300' : ''}>{rule.scopeType}</span>
                            {rule.scopeId !== 'global' && (
                                <>
                                    <span className="text-foreground/40">/</span>
                                    <span className="text-foreground truncate max-w-[120px]">{rule.scopeId}</span>
                                </>
                            )}
                        </div>

                        {rule.priority > 0 && !isLocked && (
                            <span className="text-[10px] text-orange-400/80 font-mono px-1.5 border border-orange-500/20 rounded">
                                PRI:{rule.priority}
                            </span>
                        )}
                    </div>

                    {/* Key (De-emphasized) */}
                    <div className="min-w-0">
                        <h3 className={`font-mono text-sm truncate opacity-70 ${isLocked ? 'text-muted' : 'text-foreground'}`} title={rule.ruleKey}>
                            {rule.ruleKey}
                        </h3>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 shrink-0">
                    {!readOnly && rule.locked && (
                        <button onClick={() => onClone(rule)} className="p-2 text-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-lg transition-colors" title="Clone as Draft">
                            <Copy className="w-4 h-4" />
                        </button>
                    )}
                    {!readOnly && !rule.locked && (
                        <>
                            <button onClick={() => onActivate(rule.id)} className="p-2 text-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Activate">
                                <Play className="w-4 h-4" />
                            </button>
                            <button onClick={() => onEdit(rule)} className="p-2 text-blue-500/50 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Edit">
                                <span className="text-[10px] font-bold">EDIT</span>
                            </button>
                        </>
                    )}

                    {/* Toggle Expand */}
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className={`p-2 rounded-lg transition-all ${expanded ? 'bg-foreground/10 text-foreground' : 'text-foreground/30 hover:text-foreground/60'}`}
                    >
                        <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className="mt-4 pt-4 border-t border-foreground/5 space-y-4 animate-in slide-in-from-top-1 duration-200">
                    <div className="grid gap-2">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest pl-1">Conditions</label>
                        {rule.conditions.map((c: any, i: number) => (
                            <div key={i} className={`
                                flex items-center gap-3 text-sm font-mono p-2 rounded border
                                ${isLocked ? 'bg-transparent border-soft text-muted' : 'bg-muted/5 border-soft'}
                            `}>
                                <span className={isLocked ? '' : 'text-blue-500'}>{c.field}</span>
                                <span className="text-muted text-xs">{c.operator}</span>
                                <span className={isLocked ? '' : 'text-amber-500'}>{String(c.value)}</span>
                            </div>
                        ))}
                    </div>
                    {rule.eventType && (
                        <div className="flex items-center gap-2 px-2">
                            <span className="text-[10px] uppercase tracking-wider text-foreground/40">Trigger:</span>
                            <span className="text-xs text-foreground/50 font-mono">{rule.eventType}</span>
                        </div>
                    )}
                    <div className="flex justify-end pt-2">
                        <span className="text-[10px] text-foreground/30 font-mono">ID: {rule.id || 'NEW'}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

function RuleEditor({ initialData, onClose, onSave }: any) {
    const [formData, setFormData] = useState<Partial<AutomationRule>>({
        ruleKey: '',
        scopeType: 'global',
        scopeId: 'global',
        eventType: 'task_overdue',
        action: 'notify',
        priority: 1,
        conditions: [],
        ...initialData
    });

    const isEdit = !!initialData?.id;

    const updateCondition = (idx: number, field: string, value: any) => {
        const newConditions = [...(formData.conditions || [])];
        newConditions[idx] = { ...newConditions[idx], [field]: value };
        setFormData({ ...formData, conditions: newConditions });
    };

    const addCondition = () => {
        setFormData({ ...formData, conditions: [...(formData.conditions || []), { field: '', operator: 'eq', value: '' }] });
    };

    const removeCondition = (idx: number) => {
        setFormData({ ...formData, conditions: (formData.conditions || []).filter((_, i) => i !== idx) });
    };

    return (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            {/* Modal Content - Styled for Night Sky */}
            <div className="bg-surface border border-soft rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl ring-1 ring-soft">
                <div className="p-6 border-b border-soft sticky top-0 bg-surface/95 backdrop-blur z-10 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">
                            {isEdit && !initialData.locked ? 'Edit Rule Draft' : 'New Rule Draft'}
                        </h2>
                        <p className="text-xs text-muted mt-0.5">Define logic and outcomes manually.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-muted hover:text-foreground hover:bg-muted/10 rounded-lg transition-colors">✕</button>
                </div>

                <div className="p-8 space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-muted uppercase tracking-wide">Rule Key (Stable ID)</label>
                            <input
                                className="w-full bg-muted/5 border border-soft rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono placeholder:text-muted"
                                value={formData.ruleKey}
                                onChange={e => setFormData({ ...formData, ruleKey: e.target.value })}
                                disabled={isEdit && !!formData.id}
                                placeholder="e.g. task_overdue_custom"
                            />
                        </div>
                        <div className="space-y-0.5">
                            <DropdownSelector 
                                label="Event Trigger"
                                value={formData.eventType || ''}
                                onChange={val => setFormData({ ...formData, eventType: val })}
                                options={['task_due_soon', 'task_overdue', 'task_stale_warning', 'task_stale_escalation', 'inventory_due_soon', 'inventory_overdue', 'inventory_escalated'].map(e => ({ id: e, label: e }))}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-0.5">
                            <DropdownSelector 
                                label="Scope Type"
                                value={formData.scopeType || ''}
                                onChange={val => setFormData({ ...formData, scopeType: val as any })}
                                options={[
                                    { id: 'global', label: 'Global' },
                                    { id: 'institution', label: 'Institution' },
                                    { id: 'unit', label: 'Unit' }
                                ]}
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="block text-xs font-medium text-muted uppercase tracking-wide">Scope ID (Optional for Global)</label>
                            <input
                                className="w-full bg-muted/5 border border-soft rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500/50 font-mono placeholder:text-muted"
                                value={formData.scopeId}
                                onChange={e => setFormData({ ...formData, scopeId: e.target.value })}
                                placeholder="Global ID or Specific Unit ID"
                            />
                        </div>
                    </div>

                    {/* Conditions */}
                    <div className="space-y-4 p-5 rounded-2xl bg-muted/5 border border-soft">
                        <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold text-muted uppercase tracking-widest">Logic Conditions (AND)</label>
                            <button onClick={addCondition} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 font-bold transition-colors uppercase tracking-wide">
                                <Plus className="w-3.5 h-3.5" /> Add Condition
                            </button>
                        </div>
                        <div className="space-y-3">
                            {formData.conditions?.length === 0 && (
                                <div className="text-center py-6 border border-dashed border-soft rounded-xl text-muted text-xs italic">
                                    No specific conditions. Rule will trigger on every event.
                                </div>
                            )}
                            {formData.conditions?.map((c, i) => (
                                <div key={i} className="flex gap-3">
                                    <input
                                        placeholder="Field (e.g. hoursOverdue)"
                                        className="flex-1 bg-muted/10 border border-soft rounded-lg px-3 py-2 text-sm text-foreground font-mono placeholder:text-muted focus:border-indigo-500/50 outline-none transition-colors"
                                        value={c.field}
                                        onChange={e => updateCondition(i, 'field', e.target.value)}
                                    />
                                    <div className="w-28 space-y-0.5">
                                        <DropdownSelector 
                                            label="Operator"
                                            value={c.operator}
                                            onChange={val => updateCondition(i, 'operator', val)}
                                            options={['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains'].map(op => ({ id: op, label: op }))}
                                        />
                                    </div>
                                    <input
                                        placeholder="Value"
                                        className="w-28 bg-muted/10 border border-soft rounded-lg px-3 py-2 text-sm text-foreground font-mono placeholder:text-muted focus:border-indigo-500/50 outline-none transition-colors"
                                        value={c.value}
                                        onChange={e => updateCondition(i, 'value', e.target.value)}
                                    />
                                    <button onClick={() => removeCondition(i)} className="text-muted hover:text-rose-500 transition-colors px-2">✕</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-0.5">
                            <DropdownSelector 
                                label="Resulting Action"
                                value={formData.action || ''}
                                onChange={val => setFormData({ ...formData, action: val as RuleAction })}
                                options={[
                                    { id: 'notify', label: 'Notify User (Standard)' },
                                    { id: 'escalate', label: 'Escalate (Admin/Manager)' },
                                    { id: 'suppress', label: 'Suppress (Do Nothing)' },
                                    { id: 'audit', label: 'Log Only (Silent)' }
                                ]}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-muted uppercase tracking-wide">Priority Score</label>
                            <input
                                type="number"
                                className="w-full bg-muted/5 border border-soft rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500/50 placeholder:text-muted"
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                                placeholder="Higher wins (e.g. 10)"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-soft flex justify-end gap-3 bg-muted/5 rounded-b-2xl">
                    <button onClick={onClose} className="px-5 py-2.5 text-muted hover:text-foreground text-sm font-medium transition-colors">Cancel</button>
                    <button
                        onClick={() => onSave(formData)}
                        className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-foreground rounded-xl text-sm font-semibold shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02]"
                    >
                        Save Rule
                    </button>
                </div>
            </div>
        </div>
    );
}
