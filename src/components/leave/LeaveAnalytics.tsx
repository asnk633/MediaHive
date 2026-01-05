"use client";

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { LEAVE_TYPE_LABELS } from '@/types/leave';

interface AnalyticsData {
    summary: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        approvalRate: number;
        avgProcessingTime: number;
    };
    byType: { type: string; count: number }[];
    byMonth: { month: string; count: number }[];
    byDepartment: { department: string; count: number }[];
    upcoming: any[];
}

interface LeaveAnalyticsProps {
    data: AnalyticsData;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const LeaveAnalytics: React.FC<LeaveAnalyticsProps> = ({ data }) => {
    const { summary, byType, byMonth, byDepartment, upcoming } = data;

    // Format month labels
    const formattedMonthData = byMonth.map(item => ({
        month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        count: item.count
    }));

    // Format type data with labels
    const formattedTypeData = byType.map(item => ({
        name: LEAVE_TYPE_LABELS[item.type as keyof typeof LEAVE_TYPE_LABELS] || item.type,
        value: item.count
    }));

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={16} className="text-blue-400" />
                        <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Total</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{summary.total}</div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle size={16} className="text-amber-400" />
                        <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Pending</span>
                    </div>
                    <div className="text-3xl font-bold text-amber-400">{summary.pending}</div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle size={16} className="text-emerald-400" />
                        <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Approved</span>
                    </div>
                    <div className="text-3xl font-bold text-emerald-400">{summary.approved}</div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <XCircle size={16} className="text-red-400" />
                        <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Rejected</span>
                    </div>
                    <div className="text-3xl font-bold text-red-400">{summary.rejected}</div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={16} className="text-purple-400" />
                        <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Approval Rate</span>
                    </div>
                    <div className="text-3xl font-bold text-purple-400">{summary.approvalRate}%</div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-cyan-400" />
                        <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Avg Time</span>
                    </div>
                    <div className="text-3xl font-bold text-cyan-400">{summary.avgProcessingTime}h</div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Leave by Type - Pie Chart */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-4">
                        Leaves by Type
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={formattedTypeData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {formattedTypeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(10, 12, 16, 0.95)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    color: '#fff'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Leave by Month - Bar Chart */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-4">
                        Leaves by Month (Last 12 Months)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={formattedMonthData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="month"
                                stroke="rgba(255,255,255,0.3)"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.3)"
                                style={{ fontSize: '12px' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(10, 12, 16, 0.95)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    color: '#fff'
                                }}
                            />
                            <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Department Breakdown */}
            {byDepartment.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-4">
                        Leaves by Department
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={byDepartment} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis type="number" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '12px' }} />
                            <YAxis
                                type="category"
                                dataKey="department"
                                stroke="rgba(255,255,255,0.3)"
                                style={{ fontSize: '12px' }}
                                width={150}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(10, 12, 16, 0.95)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    color: '#fff'
                                }}
                            />
                            <Bar dataKey="count" fill="#10B981" radius={[0, 8, 8, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Upcoming Leaves */}
            {upcoming.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-4">
                        Upcoming Approved Leaves (Next 30 Days)
                    </h3>
                    <div className="space-y-3">
                        {upcoming.map((leave: any) => (
                            <div key={leave.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                                        {leave.requestedBy.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-white">{leave.requestedBy.name}</div>
                                        <div className="text-xs text-white/40">{leave.requestedBy.department || 'N/A'}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-white">
                                        {new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </div>
                                    <div className="text-xs text-white/40">
                                        {LEAVE_TYPE_LABELS[leave.type as keyof typeof LEAVE_TYPE_LABELS]} • {leave.totalDays} day{leave.totalDays > 1 ? 's' : ''}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
