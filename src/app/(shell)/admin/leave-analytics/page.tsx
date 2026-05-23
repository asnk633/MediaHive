'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContextProvider';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { LeaveBalanceService } from '@/services/leaveBalanceService';
import { UserService } from '@/services/userService';
import { LeaveAnalytics } from '@/components/leave/LeaveAnalytics';
import { 
    Loader2, 
    Download, 
    Calendar, 
    ShieldAlert, 
    LayoutDashboard, 
    Users, 
    ClipboardCheck, 
    Settings2,
    Search,
    Filter,
    MoreHorizontal,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { apiGet, apiPost } from '@/lib/apiClient';
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LEAVE_TYPE_LABELS } from '@/types/leave';

type TabType = 'insights' | 'approvals' | 'allocations';

export default function LeaveAnalyticsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('insights');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [teamBalances, setTeamBalances] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchAllData = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const [analytics, balances, requests, allTeamMembers] = await Promise.all([
                apiGet('/api/leave/analytics'),
                LeaveBalanceService.getAllBalances(),
                apiGet('/api/leave/requests?status=pending'),
                UserService.getTeamMembers(null, user.id, { forceMediaIT: true })
            ]);
            
            const MEDIA_IT_DEPT_IDS = [103, 100, 4];
            
            // Build an array of teamBalances that includes EVERY valid team member.
            // Filter out 'manager' and 'admin' roles, as they manage others and shouldn't appear in the team allocations list.
            const unifiedBalances = allTeamMembers
                .filter(member => member.role !== 'manager' && member.role !== 'admin')
                .map(member => {
                const existingBalance = (balances || []).find((b: any) => b.user_id === member.uid);
                if (existingBalance) return existingBalance;
                
                // Provide a default structure for users who haven't had their leave initialized
                return {
                    id: `dummy-${member.uid}`,
                    user_id: member.uid,
                    balances: {
                        casual: { total: 0, taken: 0 },
                        sick: { total: 0, taken: 0 },
                        planned: { total: 0, taken: 0 },
                        unpaid: { total: 0, taken: 0 },
                        emergency: { total: 0, taken: 0 },
                        other: { total: 0, taken: 0 }
                    },
                    profiles: {
                        id: member.uid,
                        full_name: member.name,
                        avatar_url: member.avatar_url,
                        department_id: member.department_id
                    }
                };
            });
            
            const filteredRequests = (requests || []).filter((r: any) => {
                const isMediaIT = r.profiles?.department_id && MEDIA_IT_DEPT_IDS.includes(Number(r.profiles.department_id));
                const fullName = r.profiles?.full_name?.toLowerCase() || '';
                const isSystemUser = fullName.includes('admin user') || fullName.includes('super admin') || fullName.includes('generic admin');
                return isMediaIT && !isSystemUser;
            });
            
            setAnalyticsData(analytics);
            setTeamBalances(unifiedBalances);
            setPendingRequests(filteredRequests);
        } catch (err: any) {
            console.error('[LeaveAnalyticsPage] Fetch error:', err);
            setError(err.message || "Failed to load management data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchAllData();
    }, [user]);

    const handleAction = async (requestId: string, status: 'approved' | 'rejected') => {
        try {
            await apiPost(`/api/leave/requests/${requestId}/status`, { status });
            toast.success(`Request ${status} successfully`);
            fetchAllData(); // Refresh
        } catch (err) {
            toast.error('Failed to process request');
        }
    };

    const handleUpdateAllocation = async (userId: string, type: string, total: number) => {
        try {
            await LeaveBalanceService.updateAllocation(userId, type as any, total);
            fetchAllData(); // Refresh
        } catch (err) {
            // Error handled in service
        }
    };

    if (loading && !analyticsData) {
        return (
            <PageLayout mode="plain">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 size={40} className="animate-spin text-indigo-500" />
                        <p className="text-sm font-medium text-foreground/80 animate-pulse">Initializing Dashboard...</p>
                    </div>
                </div>
            </PageLayout>
        );
    }

    const tabs: { id: TabType; label: string; icon: any }[] = [
        { id: 'insights', label: 'Operational Insights', icon: LayoutDashboard },
        { id: 'approvals', label: 'Pending Approvals', icon: ClipboardCheck },
        { id: 'allocations', label: 'Team Allocations', icon: Users },
    ];

    return (
        <PageLayout mode="plain" className="pt-8 pb-20">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-500/20 rounded-xl">
                                <Settings2 size={20} className="text-indigo-400" />
                            </div>
                            <h1 className="text-4xl font-bold text-foreground tracking-tight">Governance</h1>
                        </div>
                        <p className="text-foreground/80 text-sm font-medium ml-1">
                            Media & IT Department • Leave & Resource Management
                        </p>
                    </div>
                    
                    {/* Tab Navigation */}
                    <div className="flex p-1.5 bg-foreground/[0.03] border border-foreground/5 rounded-2xl backdrop-blur-sm">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap",
                                        isActive 
                                            ? "bg-foreground/10 text-foreground shadow-xl shadow-black/20" 
                                            : "text-foreground/70 hover:text-foreground/80 hover:bg-foreground/[0.02]"
                                    )}
                                >
                                    <tab.icon size={16} className={isActive ? "text-indigo-400" : ""} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content Area */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {activeTab === 'insights' && (
                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-foreground/90">Strategic Overview</h2>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-foreground/5 hover:bg-foreground/10 text-foreground/70 rounded-xl transition-all border border-foreground/5 text-xs font-bold uppercase tracking-widest">
                                        <Download size={14} />
                                        Export Report
                                    </button>
                                </div>
                                <LeaveAnalytics data={analyticsData} teamBalances={teamBalances} />
                            </div>
                        )}

                        {activeTab === 'approvals' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-xl font-bold text-foreground/90">Approval Queue</h2>
                                    <div className="flex items-center gap-3">
                                        <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                                                {pendingRequests.length} Pending
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {pendingRequests.length === 0 ? (
                                    <div className="glass-liquid border border-foreground/5 rounded-[32px] p-20 text-center space-y-4">
                                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto">
                                            <CheckCircle2 size={32} />
                                        </div>
                                        <p className="text-foreground/80 font-medium">All clear! No pending leave requests.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {pendingRequests.map((req) => (
                                            <motion.div 
                                                key={req.id}
                                                layout
                                                className="glass-liquid border border-foreground/10 rounded-[28px] p-6 space-y-6 relative group overflow-hidden"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-lg">
                                                            {req.profiles?.full_name?.[0] || '?'}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-foreground text-lg">{req.profiles?.full_name}</h3>
                                                            <p className="text-xs text-foreground/70 font-bold uppercase tracking-wider">{LEAVE_TYPE_LABELS[req.type as keyof typeof LEAVE_TYPE_LABELS]}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xl font-black text-foreground">{req.total_days}d</p>
                                                        <p className="text-[10px] text-foreground/80 uppercase font-black">Duration</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-3 bg-foreground/[0.02] p-4 rounded-2xl border border-foreground/5">
                                                    <div className="flex items-center justify-between text-xs font-bold">
                                                        <span className="text-foreground/70 uppercase tracking-widest">Period</span>
                                                        <span className="text-indigo-300">
                                                            {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-black text-foreground/70 uppercase tracking-widest">Reason</span>
                                                        <p className="text-sm text-foreground/70 line-clamp-2 italic">"{req.reason}"</p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 pt-2">
                                                    <button 
                                                        onClick={() => handleAction(req.id, 'rejected')}
                                                        className="flex-1 py-3 rounded-xl bg-foreground/5 hover:bg-red-500/10 text-foreground/80 hover:text-red-400 font-bold text-xs uppercase tracking-widest transition-all border border-transparent hover:border-red-500/20 active:scale-95 flex items-center justify-center gap-2"
                                                    >
                                                        <XCircle size={14} />
                                                        Decline
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAction(req.id, 'approved')}
                                                        className="flex-[2] py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-foreground font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2"
                                                    >
                                                        <CheckCircle2 size={14} />
                                                        Grant Leave
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'allocations' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-foreground/90">Team Leave Allocations</h2>
                                    <div className="relative group w-72">
                                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/80 group-focus-within:text-indigo-400 transition-colors" />
                                        <input 
                                            type="text" 
                                            placeholder="Search team member..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-foreground/[0.03] border border-foreground/5 rounded-xl py-2.5 pl-12 pr-4 text-sm text-foreground focus:outline-none focus:border-indigo-500/30 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="glass-liquid border border-foreground/5 rounded-[32px] overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-foreground/5 border-b border-foreground/5">
                                            <tr>
                                                <th className="px-8 py-5 text-[10px] font-black text-foreground/70 uppercase tracking-[0.2em]">Team Member</th>
                                                {Object.keys(LEAVE_TYPE_LABELS).map(type => (
                                                    <th key={type} className="px-6 py-5 text-[10px] font-black text-foreground/70 uppercase tracking-[0.2em] text-center">
                                                        {LEAVE_TYPE_LABELS[type as keyof typeof LEAVE_TYPE_LABELS]} (Total)
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {teamBalances
                                                .filter(item => item.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
                                                .map((item) => (
                                                <tr key={item.id} className="hover:bg-foreground/[0.02] transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-sm">
                                                                {item.profiles?.full_name?.[0] || '?'}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-foreground">{item.profiles?.full_name}</p>
                                                                <p className="text-[10px] text-foreground/80 font-black uppercase tracking-widest">ID: {item.user_id.substring(0, 8)}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {Object.keys(LEAVE_TYPE_LABELS).map(type => (
                                                        <td key={type} className="px-6 py-6 text-center">
                                                            <div className="inline-flex flex-col items-center gap-1 group/input">
                                                                <input 
                                                                    type="number"
                                                                    defaultValue={item.balances?.[type]?.total || 0}
                                                                    onBlur={(e) => {
                                                                        const val = parseInt(e.target.value);
                                                                        if (val !== item.balances?.[type]?.total) {
                                                                            handleUpdateAllocation(item.user_id, type, val);
                                                                        }
                                                                    }}
                                                                    className="w-16 bg-foreground/5 border border-foreground/10 rounded-lg py-1.5 text-center text-sm font-bold text-foreground focus:outline-none focus:border-indigo-500/50 transition-all hover:bg-foreground/10"
                                                                />
                                                                <span className="text-[9px] font-black text-foreground/80 uppercase tracking-tighter opacity-0 group-hover/input:opacity-100 transition-opacity">Edit Days</span>
                                                            </div>
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </PageLayout>
    );
}
