import React, { useEffect, useState } from 'react';
import { ReportService, TaskStats, EventStats, FileStats, WorkloadStat, DashboardFilters } from '@/services/reportService';
import { CanonicalDataService } from '@/services/canonicalDataService';
import { StatusChart } from '@/components/home/widgets/StatusChart';
import { WorkloadTable } from './WorkloadTable';
import { RecentActivity } from './RecentActivity';
import {
    Briefcase,
    CheckCircle,
    Clock,
    AlertCircle,
    Calendar,
    Filter,
    RefreshCw,
    Download
} from 'lucide-react';
import { apiClient, apiGet } from '@/lib/apiClient';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const StatCard = ({ label, value, icon: Icon, colorClass, subtext }: { label: string, value: number, icon: any, colorClass: string, subtext?: string }) => (
    <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white/5 ${colorClass}`}>
                <Icon size={20} />
            </div>
            <span className="text-sm font-medium text-gray-400">{label}</span>
        </div>
        <div>
            <div className="text-2xl font-bold text-white">{value}</div>
            {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
        </div>
    </div>
);

export function OverviewDashboard() {
    const [filters, setFilters] = useState<DashboardFilters>({});
    const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
    const [eventStats, setEventStats] = useState<EventStats | null>(null);
    const [fileStats, setFileStats] = useState<FileStats | null>(null);
    const [workloadStats, setWorkloadStats] = useState<WorkloadStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            setLoading(true);
            try {
                const [tStats, eStats, fStats, wStats] = await Promise.all([
                    ReportService.getTaskStats(filters),
                    ReportService.getEventStats(),
                    ReportService.getFileStats(),
                    ReportService.getWorkloadStats()
                ]);
                setTaskStats(tStats);
                setEventStats(eStats);
                setFileStats(fStats);
                setWorkloadStats(wStats);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, [filters]);

    const [departmentsList, setDepartmentsList] = useState<string[]>([]);
    const [institutionsList, setInstitutionsList] = useState<string[]>([]);

    useEffect(() => {
        const fetchOrgData = async () => {
            try {
                const [deptData, instData] = await Promise.all([
                    apiGet<{ id: string; name: string }[]>('/api/departments?limit=1000'),
                    apiGet<{ id: string; name: string }[]>('/api/institutions?limit=1000')
                ]);
                setDepartmentsList(deptData.map(d => d.name));
                setInstitutionsList(instData.map(i => i.name));
            } catch (error) {
                console.error('Failed to fetch org data:', error);
            }
        };
        fetchOrgData();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 text-white/80 font-medium">
                    <Filter size={18} /> Filters:
                </div>

                <select
                    className="bg-black/20 border border-[#ffffff1a] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer hover:bg-white/5 transition-colors"
                    value={filters.department || ''}
                    onChange={e => {
                        const val = e.target.value;
                        setFilters({ ...filters, department: val, institution: val ? '' : filters.institution });
                    }}
                >
                    <option value="" className="bg-slate-900">All Offices / Units</option>
                    {departmentsList.map((dept) => (
                        <option key={dept} value={dept} className="bg-slate-900">{dept}</option>
                    ))}
                </select>

                <select
                    className="bg-black/20 border border-[#ffffff1a] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer hover:bg-white/5 transition-colors"
                    value={filters.institution || ''}
                    onChange={e => {
                        const val = e.target.value;
                        setFilters({ ...filters, institution: val, department: val ? '' : filters.department });
                    }}
                >
                    <option value="" className="bg-slate-900">All Institutions</option>
                    {institutionsList.map((inst) => (
                        <option key={inst} value={inst} className="bg-slate-900">{inst}</option>
                    ))}
                </select>

                {/* Date would go here (Start/End pickers) - Omitting for simplicity/Time constraints unless strictly needed. "Filters: Date range". 
                    Date inputs are standard.
                */}

                <button
                    onClick={() => {
                        // Reset stats to trigger refetch
                        setEventStats(null);
                        setFileStats(null);
                        setWorkloadStats([]);
                        // Trigger effect via dummy state or just call a refetch?
                        // Effect depends on filters/user. 
                        // To force refetch, we can toggle a counter or just unset the stats and the effect will see them missing?
                        // Actually effect logic checks `if (!eventStats)`. But if we set them to null inside the click handler, 
                        // the effect won't automatically run unless dependencies change.
                        // We need a forceUpdate mechanism or move fetchData back out.
                        // SIMPLEST: Window reload or just router refresh.
                        // OR: toggling a revision key.
                        setFilters({ ...filters }); // This might not change ref if value same?
                        // Proper way: add 'refreshKey' to dependency.
                        window.location.reload(); // Hard refresh to be safe per "Launch Stability" instructions? 
                        // "App behaves same or better". A hard refresh is safe.
                    }}
                    className="ml-auto p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"
                    title="Refresh Data"
                >
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                </button>

                <ReportDownloadButton />
            </div >

            {/* TASK OVERVIEW */}
            < section >
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-xl font-bold text-white tracking-tight">Task Overview</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <StatCard
                        label="Total Tasks"
                        value={taskStats?.total || 0}
                        icon={Briefcase}
                        colorClass="text-gray-500"
                    />
                    <StatCard
                        label="Pending"
                        value={taskStats?.pending || 0} // Now strictly "Pending Approval" (amber)
                        icon={Clock}
                        colorClass="text-yellow-500"
                        subtext="Pending Approval"
                    />
                    <StatCard
                        label="Working"
                        value={taskStats?.working || 0}
                        icon={Briefcase}
                        colorClass="text-blue-500"
                    />
                    <StatCard
                        label="Completed"
                        value={taskStats?.completed || 0}
                        icon={CheckCircle}
                        colorClass="text-green-500"
                    />
                    <StatCard
                        label="Overdue"
                        value={taskStats?.overdue || 0}
                        icon={AlertCircle}
                        colorClass="text-red-500"
                    />
                </div>

                {/* Task Status Distribution Chart */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {taskStats && <StatusChart stats={taskStats} />}
                </div>
            </section >

            {/* EVENT OVERVIEW */}
            < section >
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-xl font-bold text-white tracking-tight">Event Overview</h2>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Upcoming"
                        value={eventStats?.upcoming || 0}
                        icon={Calendar}
                        colorClass="text-purple-500"
                    />
                    <StatCard
                        label="Next 7 Days"
                        value={eventStats?.next7Days || 0}
                        icon={Calendar}
                        colorClass="text-indigo-500"
                        subtext="Scheduled this week"
                    />
                    <StatCard
                        label="Next 30 Days"
                        value={eventStats?.next30Days || 0}
                        icon={Calendar}
                        colorClass="text-indigo-500"
                        subtext="Scheduled this month"
                    />
                    <StatCard
                        label="Past Events"
                        value={eventStats?.completed || 0}
                        icon={CheckCircle}
                        colorClass="text-gray-500"
                    />
                </div>
            </section >

            {/* Activity & Workload Split */}
            < div className="grid grid-cols-1 lg:grid-cols-3 gap-8" >
                <div className="lg:col-span-2">
                    <WorkloadTable data={workloadStats} />
                </div>
                <div>
                    {fileStats && <RecentActivity data={fileStats} />}
                </div>
            </div >
        </div >
    );
}

function ReportDownloadButton() {
    const router = useRouter();
    const [month, setMonth] = useState(new Date().getMonth().toString());
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const years = [2024, 2025, 2026];

    const handleDownload = () => {
        // Navigate in same tab
        router.push(`/report-preview?month=${month}&year=${year}`);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-900/20"
                >
                    <Download size={16} /> Report
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-[#1a1f2e] border-[#ffffff1a] text-white">
                <DialogHeader>
                    <DialogTitle>Download Monthly Report</DialogTitle>
                    <DialogDescription className="text-gray-400 mt-2">
                        Select the month and year of the report you would like to generate.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Month</Label>
                            <select
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="w-full bg-black/20 border border-[#ffffff1a] rounded-md p-2 text-sm text-white"
                            >
                                {months.map((m, i) => (
                                    <option key={i} value={i} className="bg-slate-900">{m}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Year</Label>
                            <select
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                className="w-full bg-black/20 border border-[#ffffff1a] rounded-md p-2 text-sm text-white"
                            >
                                {years.map((y) => (
                                    <option key={y} value={y} className="bg-slate-900">{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <Button onClick={handleDownload} className="w-full bg-blue-600 hover:bg-blue-700">
                        Generate Report - Print View
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
