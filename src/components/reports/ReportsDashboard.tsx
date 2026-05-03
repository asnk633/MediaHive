'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminIntelligenceView } from './AdminIntelligenceView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Calendar, FileText, TrendingUp, Users, List, LayoutDashboard, History, Activity, Download } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { DropdownSelector } from '@/components/ui/selectors/DropdownSelector';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';

interface ReportOverview {
    totalTasks: number;
    totalEvents: number;
    totalInventory: number;
    lowStock: number;
    outOfStock: number;
    generatedAt: string;
}

interface ActivityItem {
    id: string;
    type: string;
    severity: 'info' | 'warning' | 'critical';
    title: string;
    description: string;
    timestamp: string;
    meta: any;
}

import { useRouter } from 'next/navigation';
import { nativeNavigate } from '@/lib/utils';

// Helper for safe date formatting
function safeFormatDistanceToNow(dateStr: string | undefined | null) {
    if (!dateStr) return 'some time ago';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'some time ago';
        return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
        return 'some time ago';
    }
}

export default function ReportsDashboard() {
    const router = useRouter();
    const [overview, setOverview] = useState<ReportOverview | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState('60d'); // Default to 60 days (Soft Retention)
    const [filterSeverity, setFilterSeverity] = useState<string>(''); // '' | 'info' | 'warning' | 'critical'

    // Advanced Filters (Manual Apply)
    const [filterActor, setFilterActor] = useState('');
    const [filterEntityType, setFilterEntityType] = useState('');
    const [appliedFilters, setAppliedFilters] = useState({ actor: '', entityType: '' });

    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loadingOverview, setLoadingOverview] = useState(true);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string>('viewer'); // State to track role

    // Check role from API or Context (Simple simulation here, properly user should come from props or context)
    // For now, if fetch fails with 403, we know.

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (filterSeverity) queryParams.set('severity', filterSeverity);
            if (appliedFilters.actor) queryParams.set('actorId', appliedFilters.actor);
            if (appliedFilters.entityType) queryParams.set('entityType', appliedFilters.entityType);

            // Period logic
            const now = new Date();
            let fromDate: Date | null = null;

            if (selectedPeriod === '7d') {
                fromDate = new Date(now.setDate(now.getDate() - 7));
            } else if (selectedPeriod === '30d') {
                fromDate = new Date(now.setDate(now.getDate() - 30));
            } else if (selectedPeriod === '60d') {
                fromDate = new Date(now.setDate(now.getDate() - 60));
            } else { // 'all' - explicit opt-in
                fromDate = null;
            }

            if (fromDate) {
                queryParams.set('from', fromDate.toISOString());
            }

            const data = await apiClient(`/api/reports/activity?${queryParams.toString()}`);
            if (data.activity) {
                setActivities(data.activity);
            }
        } catch (error) {
            console.error('Failed to fetch activity:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilters = () => {
        setAppliedFilters({
            actor: filterActor,
            entityType: filterEntityType
        });
    };

    const handleExport = (format: 'csv' | 'json') => {
        // Trigger download via window location or direct fetch blob
        const queryParams = new URLSearchParams();
        if (filterSeverity) queryParams.set('severity', filterSeverity);
        if (appliedFilters.actor) queryParams.set('actorId', appliedFilters.actor);
        if (appliedFilters.entityType) queryParams.set('entityType', appliedFilters.entityType);

        // Date params for export need to match fetch logic
        const now = new Date();
        if (selectedPeriod === '7d') {
            queryParams.set('from', new Date(now.setDate(now.getDate() - 7)).toISOString());
        } else if (selectedPeriod === '30d') {
            queryParams.set('from', new Date(now.setDate(now.getDate() - 30)).toISOString());
        } else if (selectedPeriod === '60d') {
            queryParams.set('from', new Date(now.setDate(now.getDate() - 60)).toISOString());
        }
        // For 'all', don't set 'from' parameter

        queryParams.set('export', format);
        // Use router to navigate to the download URL
        nativeNavigate(`/api/reports/activity?${queryParams.toString()}`, router, 'Reports (Export)');
    };

    useEffect(() => {
        const fetchOverview = async () => {
            try {
                // Determine if we should even try
                // Note: userRole state is currently just 'viewer' default in this component, real auth comes from context passed down or inferred.
                // Since this component uses apiClient which handles auth, we just rely on the response.

                const data = await apiClient<{ overview: ReportOverview }>('/api/reports/overview');
                setOverview(data.overview);
            } catch (error: any) {
                // Check if it's a 403 Forbidden
                if (error?.status === 403 || error?.message?.includes('Forbidden')) {
                    // Expected for Guests/Viewers. Do nothing or show "Access Denied" UI.
                    // The Tabs (Intelligence/Activity) are admin focused anyway.
                    console.log("User is not authorized for Report Overview (Guest/Viewer)");
                } else {
                    console.error('Failed to load overview', error);
                }
            } finally {
                setLoadingOverview(false);
            }
        };

        fetchOverview();
        fetchActivities(); // Initial fetch for activities
    }, [selectedPeriod, filterSeverity, appliedFilters]);

    return (
        <div className="space-y-6">
            <Tabs defaultValue="intelligence" className="w-full space-y-6">
                <div className="w-full overflow-x-auto pb-2 -mb-2">
                    <TabsList className="bg-slate-900/50 border border-[#ffffff1a] p-1 w-full md:w-auto inline-flex">
                        <TabsTrigger value="intelligence" className="flex-1 md:flex-none data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400">
                            <LayoutDashboard size={16} className="mr-2" /> Admin Intelligence
                        </TabsTrigger>
                        <TabsTrigger
                            value="activity"
                            className="flex-1 md:flex-none data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400"
                            title="This is a read-only audit log. Entries cannot be edited or deleted."
                        >
                            <List size={16} className="mr-2" /> System Activity (Admin Only)
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* TAB 1: ADMIN INTELLIGENCE */}
                <TabsContent value="intelligence" className="focus-visible:outline-none">
                    <AdminIntelligenceView overview={overview} loading={loadingOverview} />
                </TabsContent>

                {/* TAB 2: ACTIVITY LOGS (Legacy View Preserved) */}
                <TabsContent value="activity" className="focus-visible:outline-none">
                    {/* Header Controls */}
                    <div className="flex flex-col gap-4 bg-[#ffffff05] p-4 rounded-xl border border-[#ffffff0a]">

                        {/* Row 1: Primary Filters */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
                                <div className="space-y-0.5">
                                    <DropdownSelector 
                                        label="Severity"
                                        value={filterSeverity}
                                        onChange={setFilterSeverity}
                                        options={[
                                            { id: '', label: 'All Severity' },
                                            { id: 'info', label: 'Info', icon: <AlertCircle size={14} className="text-blue-400" /> },
                                            { id: 'warning', label: 'Warning', icon: <AlertCircle size={14} className="text-orange-400" /> },
                                            { id: 'critical', label: 'Critical', icon: <AlertCircle size={14} className="text-red-400" /> },
                                        ]}
                                    />
                                </div>

                                <div className="space-y-0.5">
                                    <DropdownSelector 
                                        label="Period"
                                        value={selectedPeriod}
                                        onChange={setSelectedPeriod}
                                        options={[
                                            { id: '7d', label: 'Last 7 Days', icon: <Clock size={14} /> },
                                            { id: '30d', label: 'Last 30 Days', icon: <Clock size={14} /> },
                                            { id: '60d', label: 'Last 60 Days', icon: <Clock size={14} /> },
                                            { id: 'all', label: 'All Time', icon: <Clock size={14} /> },
                                        ]}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => handleExport('csv')}
                                className="w-full md:w-auto flex items-center justify-center space-x-2 px-3 py-2 md:py-1.5 bg-[#ffffff05] hover:bg-[#ffffff0a] border border-[#ffffff1a] rounded text-sm text-white/70 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                <span>CSV</span>
                            </button>
                        </div>

                        {/* Row 2: Advanced Manual Filters */}
                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 pt-2 border-t border-[#ffffff0a]">
                            <input
                                type="text"
                                placeholder="Filter by Actor ID"
                                value={filterActor}
                                onChange={(e) => setFilterActor(e.target.value)}
                                className="bg-[#0f121a] border border-[#ffffff1a] text-white/70 text-sm rounded px-3 py-2 md:py-1 w-full md:w-40 focus:outline-none focus:border-blue-500 placeholder:text-white/20"
                            />
                            <input
                                type="text"
                                placeholder="Entity Type (e.g. task)"
                                value={filterEntityType}
                                onChange={(e) => setFilterEntityType(e.target.value)}
                                className="bg-[#0f121a] border border-[#ffffff1a] text-white/70 text-sm rounded px-3 py-2 md:py-1 w-full md:w-40 focus:outline-none focus:border-blue-500 placeholder:text-white/20"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleApplyFilters}
                                    className="flex-1 md:flex-none px-3 py-2 md:py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-500 text-sm rounded border border-blue-500/50 transition-colors"
                                >
                                    Apply Filters
                                </button>
                                {(filterActor || filterEntityType) && (
                                    <button
                                        onClick={() => { setFilterActor(''); setFilterEntityType(''); setAppliedFilters({ actor: '', entityType: '' }); }}
                                        className="px-3 md:px-0 text-white/40 text-xs hover:text-white border border-[#ffffff1a] md:border-none rounded md:rounded-none"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0f121a]/50 rounded-2xl border border-[#ffffff0a] p-6 backdrop-blur-xl">
                        <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
                            <History className="w-5 h-5 text-blue-400" />
                            <span>System Activity Logs</span>
                        </h2>

                        <div className="space-y-6">
                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex gap-4">
                                            <Skeleton className="w-12 h-12 rounded-full bg-slate-800" />
                                            <div className="space-y-2 flex-1">
                                                <Skeleton className="h-4 w-1/3 bg-slate-800" />
                                                <Skeleton className="h-3 w-1/2 bg-slate-800" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : activities.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center border2 border-dashed border-[#ffffff1a] rounded-xl bg-slate-900/20">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                        <Activity className="w-8 h-8 text-white/20" />
                                    </div>
                                    <h3 className="text-white/40 font-medium">Log is quiet</h3>
                                    <p className="text-white/20 text-sm mt-1">No system events yet. Activity will appear as actions occur.</p>
                                </div>
                            ) : (
                                <div className="relative border-l border-[#ffffff1a] ml-4 space-y-8 py-2">
                                    {activities.map((item, index) => (
                                        <div key={item.id + index} className="relative pl-8">
                                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-slate-900 ${getActivityColor(item.type)}`} />
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-medium text-white text-sm">{item.title}</p>
                                                    <span className="text-xs text-slate-500 whitespace-nowrap">
                                                        {safeFormatDistanceToNow(item.timestamp)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-400">{item.description}</p>
                                                {item.type === 'task' && item.meta?.status && (
                                                    <Badge variant="neutral" className="text-[10px] border-[#ffffff1a] text-slate-400 mt-1">
                                                        {item.meta.status}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Helper for severity color
function getSeverityColor(severity: string) {
    switch (severity) {
        case 'critical': return 'bg-red-500/20 text-red-500 border-red-500/50';
        case 'warning': return 'bg-orange-500/20 text-orange-500 border-orange-500/50';
        default: return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
    }
}

function getActivityColor(type: string) {
    switch (type) {
        case 'task': return 'bg-blue-500';
        case 'event': return 'bg-purple-500';
        case 'inventory': return 'bg-emerald-500';
        case 'file': return 'bg-orange-500';
        case 'drive_scan': return 'bg-yellow-500';
        case 'permission': return 'bg-red-500';
        default: return 'bg-slate-500';
    }
}
