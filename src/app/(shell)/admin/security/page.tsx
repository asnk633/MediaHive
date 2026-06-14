'use client';
import { API_BASE } from '@/lib/api-utils';


import React, { useEffect, useState } from "react";
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Users, Eye, Database, Globe, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiClient, apiPost } from '@/lib/apiClient';
import { nativeNavigate } from "@/lib/utils";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SystemSettings {
    allowMemberTasks: boolean;
    publicFilesDefault: boolean;
    driveAutoScan: boolean;
}

export default function SecurityRulesPage() {
    const router = useRouter();
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await apiClient<{ settings: SystemSettings }>(`${API_BASE}/admin/settings`);
            setSettings(data.settings);
        } catch (error) {
            console.error("Failed to load settings:", error);
            toast.error("Failed to load security settings");
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (key: keyof SystemSettings, currentValue: boolean) => {
        const newValue = !currentValue;

        // Optimistic update
        setSettings(prev => prev ? { ...prev, [key]: newValue } : null);

        try {
            await apiPost(`${API_BASE}/admin/settings`, { key, value: newValue });
            toast.success("Security rule updated");
        } catch (error) {
            console.error("Failed to update setting:", error);
            toast.error("Failed to update rule");
            // Revert
            setSettings(prev => prev ? { ...prev, [key]: currentValue } : null);
        }
    };

    return (
        <PageLayout mode="plain">
            <PageHeader
                title="Security Rules"
                description="Manage system access policies and protection rules."
                actions={
                    <Button variant="ghost" onClick={() => nativeNavigate('/admin', router, 'SecurityRules (Back)')} className="gap-2 text-foreground/60 hover:text-foreground">
                        <ArrowLeft size={16} />
                        Back to Command Center
                    </Button>
                }
            />

            <div className="max-w-5xl mx-auto pb-20 space-y-8">

                {/* Section 1: Read-Only Overview */}
                <div className="glass-liquid border-foreground/10 rounded-[32px] p-8 shadow-2xl space-y-6">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                            <Shield className="w-5 h-5 text-primary" />
                            Security Overview (Read-Only)
                        </h2>
                        <p className="text-foreground/60 text-sm">
                            Current enforcement policies hardcoded into the system core.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-foreground/5">
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-foreground/80 uppercase tracking-widest flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary" /> Role Access Model
                            </h3>
                             <div className="space-y-2.5">
                                <RoleBadge role="Admin" access="Full Access" color="bg-purple-500/10 text-purple-400 border-purple-500/20" />
                                <RoleBadge role="Manager" access="Full Access (Strategic)" color="bg-indigo-500/10 text-indigo-400 border-indigo-500/20" />
                                <RoleBadge role="Team" access="Operational Access (Execution)" color="bg-blue-500/10 text-blue-400 border-blue-500/20" />
                                <RoleBadge role="Member" access="Request Only (Pending Approval)" color="bg-emerald-500/10 text-emerald-400 border-emerald-500/20" />
                            </div>
                        </div>
 
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-foreground/80 uppercase tracking-widest flex items-center gap-2">
                                <Lock className="w-4 h-4 text-primary" /> Data Protection
                            </h3>
                            <ul className="space-y-3 text-sm text-foreground/60">
                                <li className="flex items-center gap-2.5">
                                    <Check className="w-3.5 h-3.5 text-primary" />
                                    <span>System Activity is <strong>Immutable</strong> (Append-Only)</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <Check className="w-3.5 h-3.5 text-primary" />
                                    <span>API Routes enforce <strong>Server-Side Validation</strong></span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <Check className="w-3.5 h-3.5 text-primary" />
                                    <span>Client Writes restricted via <strong>Firestore Rules</strong></span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
 
                {/* Section 2: Active Controls */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Globe className="w-5 h-5 text-primary" />
                        Active Security Controls
                    </h2>
                    <p className="text-foreground/60 text-sm">
                        Toggle these rules to adjust system behavior in real-time.
                        <strong> All changes are logged as CRITICAL security events.</strong>
                    </p>
 
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <SecurityToggle
                            label="Member Task Creation"
                            description="Allow members to submit tasks for approval."
                            checked={settings?.allowMemberTasks ?? true}
                            onChange={(checked: boolean) => handleToggle('allowMemberTasks', !checked)}
                            icon={<Users className="w-5 h-5 text-primary" />}
                            loading={loading}
                        />

                        <SecurityToggle
                            label="Public File Default"
                            description="Newly uploaded files are public by default."
                            checked={settings?.publicFilesDefault ?? true}
                            onChange={(checked: boolean) => handleToggle('publicFilesDefault', !checked)}
                            icon={<Eye className="w-5 h-5 text-primary" />}
                            loading={loading}
                        />

                        <SecurityToggle
                            label="Auto-Drive Scanning"
                            description="Automatically ingest files from Google Drive."
                            checked={settings?.driveAutoScan ?? true}
                            onChange={(checked: boolean) => handleToggle('driveAutoScan', !checked)}
                            icon={<Database className="w-5 h-5 text-primary" />}
                            loading={loading}
                        />
                    </div>
                </div>

            </div>
        </PageLayout>
    );
}

function RoleBadge({ role, access, color }: { role: string, access: string, color: string }) {
    return (
        <div className={`flex items-center justify-between px-4 py-2.5 rounded-full border text-xs font-semibold ${color}`}>
            <span className="uppercase tracking-wider">{role}</span>
            <span className="opacity-80">{access}</span>
        </div>
    );
}

function SecurityToggle({ label, description, checked, onChange, icon, loading }: any) {
    return (
        <div className="glass-liquid border border-foreground/10 p-5 rounded-[24px] flex flex-col justify-between gap-4 shadow-lg backdrop-blur-md">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-foreground/5 rounded-full">{icon}</div>
                    <div>
                        <h4 className="font-bold text-foreground text-sm">{label}</h4>
                    </div>
                </div>
                <Switch checked={checked} onCheckedChange={onChange} disabled={loading} className="data-[state=checked]:bg-primary" />
            </div>
            <p className="text-xs text-foreground/60 leading-relaxed font-medium">{description}</p>
        </div>
    );
}
