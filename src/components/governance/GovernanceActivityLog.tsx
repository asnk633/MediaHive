'use client';

import React, { useEffect, useState } from 'react';
import { ActivityHistory, ActivityEntry } from '@/lib/activityHistory';
import { useAuth } from '@/contexts/AuthContextProvider';
import { History, ShieldCheck, AlertCircle, Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const GovernanceActivityLog: React.FC = () => {
    const { user } = useAuth();
    const [entries, setEntries] = useState<ActivityEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const logs = (ActivityHistory as any).getAllGovernance(user.uid, user.role);
            setEntries(logs);
            setLoading(false);
        }
    }, [user]);

    if (loading) return <div className="animate-pulse h-32 bg-white/5 rounded-3xl" />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold text-white">Governance Audit Trail</h3>
                <p className="text-sm text-white/40 font-medium tracking-tight leading-relaxed">
                    Recent policy adherence, overrides, and manual resolutions across the institution.
                </p>
            </div>

            <div className="bg-[#0B0E14] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl">
                {!entries.length ? (
                    <div className="p-12 flex flex-col items-center justify-center text-white/20 gap-4">
                        <History size={48} className="opacity-10" />
                        <p className="text-sm font-bold uppercase tracking-widest italic">No governance events recorded yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {entries.map((entry) => {
                            const isOverride = entry.label.includes('(Overrode policy)');
                            const isResolution = entry.action === 'conflict_resolved';

                            return (
                                <div key={entry.id} className="p-6 hover:bg-white/[0.02] transition-colors flex items-start gap-5">
                                    <div className={`mt-1 p-2.5 rounded-xl border ${isOverride ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                            isResolution ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                                                'bg-white/5 border-white/10 text-white/40'
                                        }`}>
                                        {isOverride ? <AlertCircle size={18} /> : <ShieldCheck size={18} />}
                                    </div>

                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between gap-4">
                                            <p className="text-sm font-bold text-white leading-tight">
                                                {entry.label}
                                            </p>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/20 whitespace-nowrap flex items-center gap-1">
                                                <Clock size={10} />
                                                {formatDistanceToNow(entry.timestamp)} ago
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-white/40 font-medium">
                                            <User size={12} className="opacity-50" />
                                            <span>{entry.actorName}</span>
                                            <span className="w-1 h-1 rounded-full bg-white/10" />
                                            <span className="text-[10px] uppercase font-bold tracking-tight opacity-50">Task: {entry.taskId.substring(0, 8)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
