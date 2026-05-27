"use client";

import React, { useState, useEffect } from 'react';
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { supabase } from '@/lib/supabaseClient';
import { tenantContext } from '@/lib/auth/tenantContext';
import { 
    Activity, 
    Search, 
    Loader2, 
    Filter, 
    User, 
    Database, 
    Clock,
    ShieldAlert,
    ChevronDown,
    Download
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminActivityPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedResource, setSelectedResource] = useState('ALL');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { tenantId } = await tenantContext();
            const { data, error } = await supabase
                .from('audit_log')
                .select(`
                    *,
                    profiles:user_id (
                        full_name,
                        email
                    )
                `)
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) {
                console.error('[AUDIT] Supabase Error Details:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                throw error;
            }
            setLogs(data || []);
        } catch (error: any) {
            console.error('Failed to fetch audit logs:', error);
            // If it's a join error, try fetching without join as fallback
            if (error?.code === 'PGRST204' || error?.message?.includes('relationship')) {
                console.warn('[AUDIT] Join failed, attempting fallback fetch...');
                const { data } = await supabase
                    .from('audit_log')
                    .select('*')
                    .eq('tenant_id', (await tenantContext()).tenantId)
                    .limit(100);
                setLogs(data || []);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.action.toLowerCase().includes(search.toLowerCase()) ||
            log.resource_type?.toLowerCase().includes(search.toLowerCase()) ||
            log.profiles?.full_name?.toLowerCase().includes(search.toLowerCase());
            
        const matchesResource = selectedResource === 'ALL' || 
            (log.resource_type || 'N/A') === selectedResource;

        return matchesSearch && matchesResource;
    });

    const resourceTypes = ['ALL', ...Array.from(new Set(logs.map(log => log.resource_type || 'N/A').filter(Boolean)))];

    return (
        <PageLayout mode="standard">
            <PageHeader
                title="System Audit Trail"
                description="Chronological record of all administrative and security actions."
                actions={
                    <button className="h-10 px-4 rounded-xl border border-foreground/10 text-foreground/80 text-sm font-bold flex items-center gap-2 hover:bg-foreground/5 transition-colors">
                        <Download size={16} /> Export Logs
                    </button>
                }
            />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/80" size={16} />
                        <input
                            placeholder="Filter by action, user, or resource..."
                            className="w-full h-11 pl-10 pr-4 bg-foreground/5 border border-foreground/5 rounded-2xl text-sm text-foreground placeholder:text-foreground/80 focus:outline-none focus:border-indigo-500/50 transition-colors"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={selectedResource} onValueChange={setSelectedResource}>
                        <SelectTrigger className="h-11 px-4 rounded-2xl border border-foreground/5 bg-foreground/5 text-foreground/80 flex items-center gap-2 text-sm font-bold hover:text-foreground hover:bg-foreground/10 transition-colors w-[180px]">
                            <Filter size={16} />
                            <SelectValue placeholder="All Resources" />
                        </SelectTrigger>
                        <SelectContent className="bg-surface border-soft backdrop-blur-xl">
                            {resourceTypes.map(type => (
                                <SelectItem key={type} value={type} className="text-foreground uppercase tracking-widest text-[10px] font-black cursor-pointer hover:bg-foreground/5">
                                    {type === 'ALL' ? 'All Resources' : type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="rounded-[32px] glass-liquid border-foreground/5 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-foreground/5 bg-foreground/[0.02]">
                                <th className="px-6 py-4 text-[10px] font-black text-foreground/80 uppercase tracking-[0.2em]">Timestamp</th>
                                <th className="px-6 py-4 text-[10px] font-black text-foreground/80 uppercase tracking-[0.2em]">Actor</th>
                                <th className="px-6 py-4 text-[10px] font-black text-foreground/80 uppercase tracking-[0.2em]">Action</th>
                                <th className="px-6 py-4 text-[10px] font-black text-foreground/80 uppercase tracking-[0.2em]">Resource</th>
                                <th className="px-6 py-4 text-[10px] font-black text-foreground/80 uppercase tracking-[0.2em]">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <Loader2 className="animate-spin text-foreground/80 mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-foreground/80 font-bold">
                                        No activity logs found matching your criteria.
                                    </td>
                                </tr>
                            ) : filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-foreground/[0.03] transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-xs text-foreground/80 font-medium">
                                            <Clock size={12} /> {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                                <User size={14} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-foreground truncate">{log.profiles?.full_name || 'System'}</p>
                                                <p className="text-[10px] text-foreground/80 font-medium truncate uppercase tracking-widest">{log.profiles?.email || 'AUTOMATED'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-foreground/5 border border-foreground/5 text-[10px] font-black text-foreground/80 uppercase tracking-widest">
                                            <ShieldAlert size={10} /> {log.action}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-xs text-foreground/80 font-bold">
                                            <Database size={12} className="text-foreground/70" /> {log.resource_type || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs text-foreground/70 truncate max-w-xs font-medium italic">
                                            {JSON.stringify(log.details)}
                                        </p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </PageLayout>
    );
}
