"use client";

import React, { useEffect, useState } from "react";
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Activity, Database, Server, RefreshCw, FileText, HardDrive } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface HealthStats {
    api: 'healthy' | 'degraded' | 'down' | 'unknown';
    db: 'healthy' | 'degraded' | 'down' | 'unknown';
    drive: 'healthy' | 'degraded' | 'down' | 'unknown';
    logger: 'healthy' | 'degraded' | 'down' | 'unknown';
    lastScan: string | null;
    lastLog: string | null;
    generatedAt: string;
}

export default function SystemHealthPage() {
    const router = useRouter();
    const [stats, setStats] = useState<HealthStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchHealth = async () => {
        setRefreshing(true);
        try {
            const data = await apiClient<{ health: HealthStats }>('/api/admin/health');
            setStats(data.health);
        } catch (error) {
            console.error("Failed to fetch health:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHealth();
        // Auto-refresh every 30s
        const interval = setInterval(fetchHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <PageLayout mode="plain">
            <PageHeader
                title="System Health"
                description="Live operational status of core system components."
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={fetchHealth} disabled={refreshing} className="text-slate-400 hover:text-white">
                            <RefreshCw size={16} className={cn("mr-2", refreshing && "animate-spin")} />
                            Refresh
                        </Button>
                        <Button variant="ghost" onClick={() => router.push('/admin')} className="gap-2 text-slate-400 hover:text-white">
                            <ArrowLeft size={16} />
                            Back
                        </Button>
                    </div>
                }
            />

            <div className="max-w-5xl mx-auto pb-20">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <HealthCard
                        title="API Response"
                        status={stats?.api || 'unknown'}
                        icon={<Server className="w-5 h-5" />}
                        description="Next.js API Routes"
                        detail={stats ? "Responding normally" : "Checking..."}
                        loading={loading}
                    />
                    <HealthCard
                        title="Database"
                        status={stats?.db || 'unknown'}
                        icon={<Database className="w-5 h-5" />}
                        description="Firestore (Admin SDK)"
                        detail={stats ? "Read/Write available" : "Checking..."}
                        loading={loading}
                    />
                    <HealthCard
                        title="Drive Integration"
                        status={stats?.drive || 'unknown'}
                        icon={<HardDrive className="w-5 h-5" />}
                        description="Google Drive Sync"
                        detail={stats?.lastScan ? `Last Scan: ${formatDistanceToNow(new Date(stats.lastScan))} ago` : "No recent scans"}
                        loading={loading}
                    />
                    <HealthCard
                        title="Activity Logger"
                        status={stats?.logger || 'unknown'}
                        icon={<FileText className="w-5 h-5" />}
                        description="Audit Trail System"
                        detail={stats?.lastLog ? `Last Log: ${formatDistanceToNow(new Date(stats.lastLog))} ago` : "No recent logs"}
                        loading={loading}
                    />
                </div>

                <div className="bg-white/5 border border-white/5 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-400" />
                        Health Logic Explanation
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-slate-400">
                        <ul className="space-y-3">
                            <li className="flex gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                                <div>
                                    <strong className="text-slate-200">API Response:</strong> Checks if the internal API can receive and process requests without error.
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                                <div>
                                    <strong className="text-slate-200">Database:</strong> Verifies connectivity to Firestore via the Firebase Admin SDK.
                                </div>
                            </li>
                        </ul>
                        <ul className="space-y-3">
                            <li className="flex gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                                <div>
                                    <strong className="text-slate-200">Drive Integration:</strong> Monitors the `system_activity` log for recent `drive_scan` actions. If no scans occur for &gt;24h, this may show as degraded.
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                                <div>
                                    <strong className="text-slate-200">Activity Logger:</strong> Checks if the system is successfully writing to the audit log. Critical for security and data integrity.
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

            </div>
        </PageLayout>
    );
}

function HealthCard({ title, status, icon, description, detail, loading }: any) {
    const statusColor = {
        healthy: "bg-green-500",
        degraded: "bg-amber-500",
        down: "bg-red-500",
        unknown: "bg-slate-500"
    };

    const statusText = {
        healthy: "Operational",
        degraded: "Degraded",
        down: "Down",
        unknown: "Hidden"
    };

    return (
        <div className="bg-white/5 border border-white/5 p-5 rounded-xl relative overflow-hidden group hover:border-white/10 transition-colors">
            {loading ? (
                <div className="animate-pulse space-y-3">
                    <div className="h-4 w-24 bg-white/10 rounded" />
                    <div className="h-8 w-16 bg-white/10 rounded" />
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-white/5 rounded-lg text-slate-300">
                            {icon}
                        </div>
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] uppercase font-bold tracking-wider ${status === 'healthy' ? 'text-green-400' : status === 'degraded' ? 'text-amber-400' : 'text-red-400'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${statusColor[status as keyof typeof statusColor]} animate-pulse`} />
                            {statusText[status as keyof typeof statusText]}
                        </div>
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
                    <p className="text-xs text-slate-400 mb-4">{description}</p>

                    <div className="pt-4 border-t border-white/5">
                        <p className="text-xs text-slate-500 font-mono">{detail}</p>
                    </div>
                </>
            )}
        </div>
    );
}
