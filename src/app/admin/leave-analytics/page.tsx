'use client';



import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContextProvider';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { nativeNavigate } from '@/lib/utils';
import { LeaveAnalytics } from '@/components/leave/LeaveAnalytics';
import { Loader2, Download, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';

export default function LeaveAnalyticsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [department, setDepartment] = useState('');

    useEffect(() => {
        if (!user) return;

        // Check if user is admin
        const checkAdmin = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) {
                    nativeNavigate('/', router, 'LeaveAnalytics (No Auth)');
                    return;
                }

                const response = await apiClient('/api/user/role', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });

                if (!response.success) {
                    nativeNavigate('/', router, 'LeaveAnalytics (Role Fetch Fail)');
                    return;
                }

                if (response.role !== 'admin') {
                    toast.error('Admin access required');
                    nativeNavigate('/', router, 'LeaveAnalytics (Not Admin)');
                    return;
                }

                fetchAnalytics();
            } catch (error) {
                console.error('Error checking admin status:', error);
                nativeNavigate('/', router, 'LeaveAnalytics (Check Admin Catch)');
            }
        };

        checkAdmin();
    }, [user, router]);

    const fetchAnalytics = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) throw new Error("Not authenticated");

            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            if (department) params.append('department', department);

            const response = await apiClient(`/api/leave/analytics?${params.toString()}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });

            if (!response.success) {
                throw new Error('Failed to fetch analytics');
            }

            setAnalyticsData(response);
        } catch (error: any) {
            console.error('Error fetching analytics:', error);
            toast.error(error.message || 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        if (!user) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) throw new Error("Not authenticated");

            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            if (department) params.append('department', department);

            window.location.href = `/api/leave/export?${params.toString()}&token=${session.access_token}`;
            toast.success('Export started');
        } catch (error) {
            console.error('Error exporting:', error);
            toast.error('Failed to export');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0a0c10] via-[#1a1d29] to-[#0a0c10] flex items-center justify-center">
                <Loader2 size={40} className="animate-spin text-blue-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0c10] via-[#1a1d29] to-[#0a0c10] p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Leave Analytics
                        </h1>
                        <p className="text-white/50">
                            Insights and statistics for leave requests
                        </p>
                    </div>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
                    >
                        <Download size={18} />
                        Export CSV
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white/5 border border-[#ffffff1a] rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar size={18} className="text-blue-400" />
                        <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider">
                            Filters
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-[#0a0c10] text-white border border-[#ffffff1a] rounded-xl py-2 px-3 outline-none focus:border-blue-500/50 [color-scheme:dark]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-[#0a0c10] text-white border border-[#ffffff1a] rounded-xl py-2 px-3 outline-none focus:border-blue-500/50 [color-scheme:dark]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
                                Department
                            </label>
                            <input
                                type="text"
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                placeholder="All departments"
                                className="w-full bg-[#0a0c10] text-white placeholder:text-white/30 border border-[#ffffff1a] rounded-xl py-2 px-3 outline-none focus:border-blue-500/50"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={fetchAnalytics}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Analytics Display */}
                {analyticsData && <LeaveAnalytics data={analyticsData} />}
            </div>
        </div>
    );
}
