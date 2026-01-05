"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LeaveType, LEAVE_TYPE_LABELS } from '@/types/leave';
import { LeaveBalance } from '@/types/leaveBalance';
import { LeaveBalanceService } from '@/services/leaveBalanceService';
import { Loader2 } from 'lucide-react';

interface LeaveBalanceDisplayProps {
    compact?: boolean;
}

export const LeaveBalanceDisplay: React.FC<LeaveBalanceDisplayProps> = ({ compact = false }) => {
    const { user } = useAuth();
    const [balance, setBalance] = useState<LeaveBalance | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchBalance = async () => {
            try {
                const data = await LeaveBalanceService.getUserBalance(user.uid);
                setBalance(data);
            } catch (error) {
                console.error('Error fetching balance:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBalance();
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <Loader2 size={20} className="animate-spin text-blue-400" />
            </div>
        );
    }

    if (!balance) return null;

    const leaveTypes: LeaveType[] = ['casual', 'sick', 'planned', 'emergency', 'other'];

    if (compact) {
        return (
            <div className="grid grid-cols-2 gap-3">
                {leaveTypes.map(type => {
                    const { taken, total } = balance.balances[type];
                    const remaining = total - taken;
                    const percentage = (taken / total) * 100;

                    return (
                        <div key={type} className="bg-white/5 border border-white/10 rounded-xl p-3">
                            <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1">
                                {LEAVE_TYPE_LABELS[type]}
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-white">{remaining}</span>
                                <span className="text-sm text-white/40">/ {total}</span>
                            </div>
                            <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${percentage > 80 ? 'bg-red-500' :
                                        percentage > 50 ? 'bg-amber-500' :
                                            'bg-emerald-500'
                                        }`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider">
                    Your Leave Balance ({balance.year})
                </h3>
            </div>

            {leaveTypes.map(type => {
                const { taken, total } = balance.balances[type];
                const remaining = total - taken;
                const percentage = (taken / total) * 100;
                const isLow = remaining <= 2;

                return (
                    <div key={type} className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <div className="text-sm font-bold text-white">
                                    {LEAVE_TYPE_LABELS[type]}
                                </div>
                                <div className="text-xs text-white/40 mt-0.5">
                                    {taken} used • {remaining} remaining
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-2xl font-bold ${isLow ? 'text-red-400' : 'text-white'}`}>
                                    {remaining}
                                </div>
                                <div className="text-xs text-white/30">/ {total} days</div>
                            </div>
                        </div>

                        <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${percentage > 80 ? 'bg-red-500' :
                                    percentage > 50 ? 'bg-amber-500' :
                                        'bg-emerald-500'
                                    }`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>

                        {isLow && remaining > 0 && (
                            <div className="mt-2 text-xs text-amber-400 flex items-center gap-1">
                                ⚠️ Low balance
                            </div>
                        )}

                        {remaining === 0 && (
                            <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                                ❌ No balance remaining
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
