'use client';

import React, { useState, useEffect } from 'react';
import { FEATURE_REGISTRY, FeatureKey } from '@/system/features/featureRegistry';
import { PageLayout } from '@/components/ui/layout/PageLayout';
import { PageHeader } from '@/components/ui/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { 
    Save, 
    ShieldAlert,
    RefreshCcw,
    Sliders
} from 'lucide-react';
import { toast } from 'sonner';

const ROLES = ['admin', 'manager', 'team', 'member'] as const;
type RoleType = typeof ROLES[number];

export default function FeaturePermissionsClient() {
    const [overrides, setOverrides] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchOverrides();
    }, []);

    const fetchOverrides = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/features');
            if (!res.ok) throw new Error('Failed to fetch overrides');
            const data = await res.json();
            setOverrides(data.featureOverrides || {});
        } catch (error) {
            console.error(error);
            toast.error('Failed to load feature configurations.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const res = await fetch('/api/admin/features', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ featureOverrides: overrides })
            });

            if (!res.ok) throw new Error('Failed to save');
            
            toast.success('Feature permissions updated successfully!');
            
            // Reload page to refresh the workspace context
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error(error);
            toast.error('Failed to save configurations.');
        } finally {
            setSaving(false);
        }
    };

    const handleOverrideChange = (feature: string, newRole: string) => {
        setOverrides(prev => {
            const next = { ...prev };
            // If the user selects the default role, we can remove the override to keep JSON small
            const defaultRole = FEATURE_REGISTRY[feature as FeatureKey].minRole || 'member';
            if (newRole === defaultRole) {
                delete next[feature];
            } else {
                next[feature] = newRole;
            }
            return next;
        });
    };

    const handleReset = (feature: string) => {
        setOverrides(prev => {
            const next = { ...prev };
            delete next[feature];
            return next;
        });
    };

    const featuresList = Object.entries(FEATURE_REGISTRY).map(([key, config]) => ({
        id: key,
        ...config
    }));

    return (
        <PageLayout>
            <PageHeader
                title="Feature Config"
                description="Manage access levels and permissions for all application modules"
                actions={
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={fetchOverrides}
                            disabled={loading || saving}
                            className="text-foreground/80 hover:text-foreground border border-foreground/10 hover:bg-foreground/5 backdrop-blur-md rounded-full px-5 py-2 transition-all duration-200 active:scale-95 text-xs font-bold"
                        >
                            <RefreshCcw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button 
                            onClick={handleSave} 
                            disabled={loading || saving}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 py-2 transition-all duration-200 active:scale-95 shadow-lg shadow-primary/20 text-xs font-bold tracking-wide"
                        >
                            <Save size={16} className="mr-2" />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                }
            />
            <div className="max-w-[1200px] mx-auto pt-6">
                
                <div className="glass-liquid border border-foreground/10 rounded-[32px] overflow-hidden shadow-2xl backdrop-blur-md">
                    <div className="p-6 border-b border-foreground/5 bg-foreground/[0.02]">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-1 shadow-inner">
                                <ShieldAlert size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground tracking-tight">Global Overrides</h2>
                                <p className="text-sm text-slate-400 mt-1 leading-relaxed font-medium">
                                    Adjusting these settings will immediately affect all users within this tenant. 
                                    Setting a feature to a higher role (e.g., Admin) will instantly hide it from lower roles.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-foreground/5 bg-foreground/[0.01]">
                                    <th className="px-6 py-4 text-xs font-black text-foreground/70 uppercase tracking-[0.2em]">Module / Feature</th>
                                    <th className="px-6 py-4 text-xs font-black text-foreground/70 uppercase tracking-[0.2em]">Default Required Role</th>
                                    <th className="px-6 py-4 text-xs font-black text-foreground/70 uppercase tracking-[0.2em]">Current Override</th>
                                    <th className="px-6 py-4 text-xs font-black text-foreground/70 uppercase tracking-[0.2em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-foreground/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-foreground/80 text-sm font-medium">
                                            Loading configurations...
                                        </td>
                                    </tr>
                                ) : featuresList.map(feature => {
                                    const defaultRole = feature.minRole || 'member';
                                    const currentOverride = overrides[feature.id];
                                    const isOverridden = !!currentOverride;
                                    const activeRole = currentOverride || defaultRole;

                                    return (
                                        <tr key={feature.id} className="hover:bg-foreground/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-bold text-foreground capitalize">
                                                        {feature.id.replace(/([A-Z])/g, ' $1').trim()}
                                                    </span>
                                                    {feature.isLabs && (
                                                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 text-[10px] font-bold tracking-wider uppercase">
                                                            Labs
                                                        </span>
                                                    )}
                                                    {isOverridden && (
                                                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-bold tracking-wider uppercase">
                                                            Modified
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-foreground/80 capitalize">
                                                    {defaultRole}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={activeRole}
                                                    onChange={(e) => handleOverrideChange(feature.id, e.target.value)}
                                                    className={`border rounded-full px-4 py-1.5 text-xs font-bold capitalize outline-none focus:ring-2 focus:ring-primary/40 transition-all ${
                                                        isOverridden ? 'border-primary/30 text-primary bg-primary/10 shadow-sm' : 'border-foreground/10 text-foreground/90 bg-foreground/[0.03]'
                                                    }`}
                                                >
                                                    {ROLES.map(role => (
                                                        <option key={role} value={role} className="bg-popover text-foreground">
                                                            {role} {role === defaultRole ? '(Default)' : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={!isOverridden}
                                                    onClick={() => handleReset(feature.id)}
                                                    className={`text-xs rounded-full ${isOverridden ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10' : 'text-foreground/70'}`}
                                                >
                                                    Reset to Default
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
