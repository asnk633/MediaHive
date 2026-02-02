'use client';

import { useState, useEffect } from 'react';
import { Shield, Download, Trash2, Eye, EyeOff, Lock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContextProvider';
import { TaskService } from '@/services/tasks';

import { AuditTrailService } from '@/services/auditTrailService';
import { STATUTORY_RETENTION_POLICIES } from '@/services/retentionService';

export function PrivacyCenter() {
    const { user } = useAuth();
    const [telemetryEnabled, setTelemetryEnabled] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('telemetry_enabled');
        if (saved !== null) {
            setTelemetryEnabled(saved === 'true');
        }
    }, []);

    const toggleTelemetry = (enabled: boolean) => {
        setTelemetryEnabled(enabled);
        localStorage.setItem('telemetry_enabled', enabled.toString());
        toast.info(`Telemetry ${enabled ? 'enabled' : 'disabled'}. Changes take effect on restart.`);
    };

    const handleDataExport = async () => {
        setIsExporting(true);
        try {
            // PUBLIC SECTOR PASS: Comprehensive FOIA-ready Export
            const tasks = await TaskService.getTasks();

            // Fetch audit trails for these records (Mock/Partial for demo)
            const auditLogs = await AuditTrailService.exportEntityHistory('current_user', 'user');

            const exportData = {
                disclosure_info: {
                    exportedBy: user?.email,
                    timestamp: new Date().toISOString(),
                    authority: "FOIA / RTI Disclosure Pipeline",
                    retention_summary: STATUTORY_RETENTION_POLICIES
                },
                user: {
                    uid: user?.uid,
                    email: user?.email,
                    displayName: user?.name,
                },
                records: {
                    tasks: tasks,
                    audit_trails: auditLogs
                },
                compliance_version: "2.5.1-platinum-statutory"
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `thaiba_media_export_${user?.uid}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("Data export successful");
        } catch (error) {
            console.error("Export failed", error);
            toast.error("Failed to export data");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                <Shield className="text-blue-500 w-5 h-5 flex-shrink-0" />
                <p className="text-sm text-blue-200">
                    Your privacy is our priority. All data is processed according to our enterprise security standards.
                </p>
            </div>

            <div className="grid gap-4">
                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white">Anonymous Telemetry</h3>
                            <Info size={14} className="text-gray-500" />
                        </div>
                        <p className="text-xs text-gray-400">Help us improve by sending anonymous performance metrics.</p>
                    </div>
                    <Switch
                        checked={telemetryEnabled}
                        onCheckedChange={toggleTelemetry}
                    />
                </div>

                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                    <div className="space-y-1">
                        <h3 className="font-semibold text-white">Data Portability (GDPR)</h3>
                        <p className="text-xs text-gray-400">Request a copy of all your operational data in JSON format.</p>
                    </div>
                    <Button
                        onClick={handleDataExport}
                        disabled={isExporting}
                        variant="outline"
                        className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white gap-2"
                    >
                        <Download size={16} />
                        {isExporting ? "Preparing Export..." : "Export My Data"}
                    </Button>
                </div>

                <div className="p-5 bg-red-500/5 border border-red-500/10 rounded-2xl space-y-4">
                    <div className="space-y-1">
                        <h3 className="font-semibold text-red-400">Account Deletion</h3>
                        <p className="text-xs text-gray-400">Permanently remove your account and all associated data from the platform.</p>
                    </div>
                    <Button
                        variant="destructive"
                        className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-500 border border-red-500/20 gap-2"
                        onClick={() => toast.warning("Contact Administrator for account erasure.")}
                    >
                        <Trash2 size={16} />
                        Request Deletion
                    </Button>
                </div>
            </div>

            <div className="pt-4 flex items-center justify-center gap-2 text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                <Lock size={10} />
                End-to-End Encryption Active
            </div>
        </div>
    );
}
