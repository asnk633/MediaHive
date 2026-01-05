"use client";

import { useEffect, useState } from 'react';
import { X, TrendingUp, TrendingDown, Minus, Activity, Users, AlertTriangle, MessageSquare, Shield } from 'lucide-react';
import { SafeAvatar } from '@/components/ui/SafeAvatar';
import { apiClient } from '@/lib/apiClient';
import { PerformanceChart } from './PerformanceChart';
import type { TrendClassification } from '@/utils/trendAnalysis';
import type { UserBenchmark } from '@/utils/benchmarkAnalysis';
import type { EarlyWarningResult } from '@/utils/earlyWarningAnalysis';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface PerformanceHistoryItem {
    period: string;
    ips: number;
    ipsScore: number;
    status: string;
    assignedTasks: number;
    completedTasks: number;
    overdueTasks: number;
    avgDailyHours: number;
}

interface AdminIntervention {
    id: number;
    period: string;
    riskLevelAtTime: 'Low' | 'Medium' | 'High';
    note: string;
    actionType: string;
    createdAt: string;
    adminName: string;
    adminAvatar: string | null;
}

interface PerformanceHistoryModalProps {
    userId: number;
    userName: string;
    avatarUrl: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export function PerformanceHistoryModal({
    userId,
    userName,
    avatarUrl,
    isOpen,
    onClose
}: PerformanceHistoryModalProps) {
    const [history, setHistory] = useState<PerformanceHistoryItem[]>([]);
    const [trend, setTrend] = useState<TrendClassification>('Insufficient Data');
    const [delta, setDelta] = useState<number>(0);
    const [benchmark, setBenchmark] = useState<UserBenchmark | null>(null);
    const [earlyWarning, setEarlyWarning] = useState<EarlyWarningResult | null>(null);
    const [interventions, setInterventions] = useState<AdminIntervention[]>([]);
    const [note, setNote] = useState('');
    const [actionType, setActionType] = useState('Observation');
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && userId) {
            fetchHistory();
            fetchInterventions();
        }
    }, [isOpen, userId]);

    const fetchInterventions = async () => {
        try {
            const data = await apiClient(`/api/admin/interventions/${userId}`);
            setInterventions(data.interventions || []);
        } catch (err) {
            console.error('Failed to fetch interventions:', err);
        }
    };

    const handleSaveIntervention = async () => {
        if (!note.trim()) return;

        setSubmitting(true);
        try {
            const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
            const riskLevel = earlyWarning?.riskLevel || 'Low';

            await apiClient('/api/admin/interventions', {
                method: 'POST',
                body: JSON.stringify({
                    userId,
                    period: currentPeriod,
                    riskLevel,
                    note,
                    actionType
                })
            });

            setNote('');
            setActionType('Observation');
            fetchInterventions(); // Refresh list
        } catch (err: any) {
            console.error('Failed to save intervention:', err);
            // Optional: Show error toast
        } finally {
            setSubmitting(false);
        }
    };

    const fetchHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiClient(`/api/admin/performance-history/${userId}`);
            setHistory(data.history || []);
            setTrend(data.trend || 'Insufficient Data');
            setDelta(data.delta || 0);
            setBenchmark(data.benchmark || null);
            setEarlyWarning(data.earlyWarning || null);
        } catch (err: any) {
            console.error('Failed to fetch performance history:', err);
            setError('Failed to load performance history');
        } finally {
            setLoading(false);
        }
    };

    // Render Logic
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                showCloseButton={false}
                className="max-w-4xl w-full max-h-[90vh] overflow-hidden bg-gradient-to-br from-[#1a2639] to-[#0f172a] border-white/10 p-0 gap-0 rounded-2xl shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 ring-2 ring-white/10">
                            <SafeAvatar
                                src={avatarUrl}
                                alt={userName}
                                size={48}
                                className="w-full h-full"
                            />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-white flex items-center gap-3">
                                {userName}
                                {trend !== 'Insufficient Data' && (
                                    <TrendBadge trend={trend} delta={delta} />
                                )}
                            </DialogTitle>
                            <div className="flex items-center gap-3 mt-1">
                                <p className="text-sm text-blue-200/60">Performance History</p>
                                {earlyWarning && earlyWarning.riskLevel !== 'Low' && (
                                    <EarlyWarningBadge warning={earlyWarning} />
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                        aria-label="Close"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-20">
                            <p className="text-red-400">{error}</p>
                        </div>
                    ) : history.length < 3 ? (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                <TrendingUp size={40} className="text-white/20" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                                Not enough historical data yet
                            </h3>
                            <p className="text-white/40">
                                Performance history will appear after 3 months of snapshots
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Chart Section */}
                            <div>
                                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-6 px-1">
                                    Performance Trend (Last {history.length} Months)
                                </h3>
                                <div className="bg-black/20 rounded-2xl p-4 border border-white/5 shadow-inner">
                                    <PerformanceChart data={history} />
                                </div>

                                {/* Legend */}
                                <div className="flex flex-wrap items-center justify-center gap-6 mt-6">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/5 border border-green-500/10">
                                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                        <span className="text-xs font-medium text-green-200/80">Performing (≥80)</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/5 border border-yellow-500/10">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                                        <span className="text-xs font-medium text-yellow-200/80">At Risk (60-79)</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/5 border border-red-500/10">
                                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                        <span className="text-xs font-medium text-red-200/80">Underperforming (&lt;60)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Team Context */}
                            {benchmark && benchmark.relativeStatus !== 'Insufficient Team Data' && (
                                <div className="pt-8 border-t border-white/10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                                            <Users size={18} />
                                        </div>
                                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Team Context</h4>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors group">
                                            <p className="text-[10px] uppercase font-bold text-white/40 mb-2 group-hover:text-white/60 transition-colors">Team Median</p>
                                            <p className="text-3xl font-bold text-white font-[gill-sans-mt,sans-serif]">{benchmark.teamMedian}</p>
                                        </div>

                                        <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors group">
                                            <p className="text-[10px] uppercase font-bold text-white/40 mb-2 group-hover:text-white/60 transition-colors">Your Percentile</p>
                                            <p className="text-3xl font-bold text-white font-[gill-sans-mt,sans-serif]">{benchmark.percentile}<span className="text-lg text-white/40 ml-1">th</span></p>
                                        </div>

                                        <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors group">
                                            <p className="text-[10px] uppercase font-bold text-white/40 mb-2 group-hover:text-white/60 transition-colors">Relative Position</p>
                                            <RelativeStatusBadge status={benchmark.relativeStatus} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Admin Review Section */}
                            <div className="pt-8 border-t border-white/10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                        <Shield size={18} />
                                    </div>
                                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Admin Review</h4>
                                </div>

                                <div className="bg-white/5 rounded-2xl border border-white/10 p-5 overflow-hidden relative">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-50" />

                                    <div className="flex flex-col md:flex-row gap-5">
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Observation / Note</label>
                                            <textarea
                                                value={note}
                                                onChange={(e) => setNote(e.target.value)}
                                                placeholder="Record your observation or decision..."
                                                className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent min-h-[100px] placeholder:text-white/20 transition-all resize-none"
                                            />
                                        </div>
                                        <div className="w-full md:w-1/3 space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Action Type</label>
                                                <div className="relative">
                                                    <select
                                                        value={actionType}
                                                        onChange={(e) => setActionType(e.target.value)}
                                                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer hover:bg-white/5 transition-colors"
                                                    >
                                                        <option className="bg-[#1a2639]">Observation</option>
                                                        <option className="bg-[#1a2639]">Counselled</option>
                                                        <option className="bg-[#1a2639]">Warning Issued</option>
                                                        <option className="bg-[#1a2639]">Support Planned</option>
                                                        <option className="bg-[#1a2639]">No Action Needed</option>
                                                    </select>
                                                    {/* Custom Arrow could go here */}
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleSaveIntervention}
                                                disabled={submitting || !note.trim()}
                                                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all transform active:scale-95"
                                            >
                                                {submitting ? 'Saving...' : 'Save Note'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Past Interventions Timeline */}
                            {interventions.length > 0 && (
                                <div className="pt-8 border-t border-white/10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                                            <MessageSquare size={18} />
                                        </div>
                                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Associate History</h4>
                                    </div>
                                    <div className="space-y-6 pl-2">
                                        {interventions.map((item) => (
                                            <div key={item.id} className="relative pl-8 border-l-2 border-white/5 last:border-0 pb-2">
                                                <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#1a2639] border-2 border-indigo-500 ring-4 ring-[#1a2639]" />
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{item.period}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${item.riskLevelAtTime === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                        item.riskLevelAtTime === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                                            'bg-green-500/10 text-green-400 border border-green-500/20'
                                                        }`}>
                                                        {item.riskLevelAtTime} Risk
                                                    </span>
                                                </div>
                                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                                                    <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-3">
                                                        <span className="text-sm font-bold text-white">{item.actionType}</span>
                                                        <span className="text-[10px] font-medium text-white/40">
                                                            {new Date(item.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-white/70 leading-relaxed">{item.note}</p>
                                                    <div className="mt-4 flex items-center gap-2 pt-3 border-t border-white/5">
                                                        <div className="w-5 h-5 rounded-full overflow-hidden bg-white/10 ring-1 ring-white/10">
                                                            {item.adminAvatar ? (
                                                                <img src={item.adminAvatar} alt={item.adminName} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[8px] text-white font-bold">
                                                                    {item.adminName?.[0] || 'A'}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-white/40 font-medium">Recorded by <span className="text-white/60">{item.adminName}</span></span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Relative Status Badge Component
 */
function RelativeStatusBadge({ status }: { status: string }) {
    const getStatusConfig = () => {
        switch (status) {
            case 'Top Quartile': return { color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'Top 25%' };
            case 'Above Team Median': return { color: 'text-blue-400', bgColor: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'Above Median' };
            case 'Below Team Median': return { color: 'text-amber-400', bgColor: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'Below Median' };
            case 'Bottom Quartile': return { color: 'text-red-400', bgColor: 'bg-red-500/10', border: 'border-red-500/20', text: 'Bottom 25%' };
            default: return { color: 'text-gray-400', bgColor: 'bg-gray-500/10', border: 'border-gray-500/20', text: status };
        }
    };
    const config = getStatusConfig();
    return (
        <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold border ${config.bgColor} ${config.color} ${config.border}`}>
            {config.text}
        </div>
    );
}

/**
 * Trend Badge Component
 */
function TrendBadge({ trend, delta }: { trend: TrendClassification; delta: number }) {
    const getTrendConfig = () => {
        switch (trend) {
            case 'Improving': return { icon: TrendingUp, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', text: `+${delta}` };
            case 'Declining': return { icon: TrendingDown, color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20', text: `${delta}` };
            case 'Volatile': return { icon: Activity, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20', text: `${delta > 0 ? '+' : ''}${delta}` };
            case 'Stable': return { icon: Minus, color: 'text-blue-300', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20', text: `${delta > 0 ? '+' : ''}${delta}` };
            default: return null;
        }
    };
    const config = getTrendConfig();
    if (!config) return null;
    const Icon = config.icon;
    return (
        <div className={`inline-flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-md border ${config.bgColor} ${config.borderColor}`}>
            <Icon size={12} className={config.color} />
            <span className={`text-xs font-bold ${config.color}`}>{config.text}</span>
        </div>
    );
}

/**
 * Early Warning Badge Component
 */
function EarlyWarningBadge({ warning }: { warning: EarlyWarningResult }) {
    if (warning.riskLevel === 'Low') return null;
    const color = warning.riskLevel === 'High' ? 'text-red-400' : 'text-amber-400';
    return (
        <div className="flex items-center gap-1.5">
            <AlertTriangle size={14} className={color} />
            <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>
                {warning.riskLevel} Risk Detected
            </span>
        </div>
    );
}
