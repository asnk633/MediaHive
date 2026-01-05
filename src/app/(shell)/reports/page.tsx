"use client";

/**
 * 🔴 NON-REGRESSION CONTRACT 🔴
 * 
 * This page hosts multiple independent admin systems:
 * 1. Analytics Dashboard (Intelligence)
 * 2. Compliance Audit Log
 * 3. Team & Roles (User Management)
 * 4. Organization (Institutions & Departments)
 * 
 * Any future change MUST be additive.
 * Removing or replacing tabs is FORBIDDEN without explicit instruction.
 * Do not hide tabs behind new sub-permissions unless strictly required.
 */

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import {
  Building,
  AlertTriangle,
  Activity,
  Download,
  Shield,
  Users,
  Clock,
  CheckCircle,
  AlertOctagon
} from 'lucide-react';

import { TeamContributionChart } from '@/components/admin/intelligence/TeamContributionChart';
import { PerformanceHistoryModal } from '@/components/admin/intelligence/PerformanceHistoryModal';
import { ExportModal } from '@/components/admin/intelligence/ExportModal';
import { AuditLogTable } from '@/components/admin/intelligence/AuditLogTable';
import { UserManagementPanel } from '@/components/admin/UserManagementPanel';
import { InstitutionManagement } from '@/components/admin/InstitutionManagement';
import { DepartmentManagement } from '@/components/admin/DepartmentManagement';
import { useAuth } from '@/contexts/AuthContext';
import { LeadershipSummaryPanel } from '@/components/admin/intelligence/LeadershipSummaryPanel';
import { PersonalDashboard } from '@/components/reports/PersonalDashboard';

// --- CONFIGURATION ---
/*
 * [REGRESSION SAFEGUARD]
 * The 'intelligence' and 'performance' tabs are CORE views.
 * Removing or hiding them breaks the Compliance Loop.
 * DO NOT MODIFY without Leadership approval.
 */
const REPORTS_TABS = [
  { id: 'intelligence', label: 'Analytics Dashboard', icon: Activity, color: 'text-indigo-400', borderColor: 'border-indigo-400' },
  { id: 'audit', label: 'Compliance Audit Log', icon: Shield, color: 'text-emerald-400', borderColor: 'border-emerald-400' },
  { id: 'team', label: 'Team & Roles', icon: Users, color: 'text-blue-400', borderColor: 'border-blue-400' },
  { id: 'organization', label: 'Organization', icon: Building, color: 'text-purple-400', borderColor: 'border-purple-400' },
] as const;

type TabId = typeof REPORTS_TABS[number]['id'];

// Types derived from API
type DepartmentHealth = {
  score: number;
  grade: 'Healthy' | 'Strained' | 'Poor Performance';
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  avgCompletionRate: number;
  avgOnTimeRate: number;
  overdueLoadRatio: number;
};

type UnderperformingUser = {
  userId: number;
  name: string;
  avatarUrl: string | null;
  tasksAssigned: number;
  tasksCompleted: number;
  tasksOverdue: number;
  onTimeRate: number;
  // attendanceHours: number; // Removed
  pendingTasks: number;
  ipsScore: number;
  status: 'Performing' | 'At Risk' | 'Underperforming';
  insight: string;
};

type AgingData = {
  '0-2 days': number;
  '3-7 days': number;
  '8-14 days': number;
  '14+ days': number;
};

type IntelligenceData = {
  departmentHealth: DepartmentHealth;
  underperformingUsers: UnderperformingUser[];
  teamContribution: { name: string, value: number }[];
  aging: AgingData;
};

function ReportsPageContent() {
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<{ id: number; name: string; avatarUrl: string | null } | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const { user } = useAuth();

  // Navigation State (URL Persistent)
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // --- ROLE CHECK: If not Admin, show Personal Dashboard ONLY ---
  // This simplifies the view for Team/Guest users as requested.
  if (user && user.role !== 'admin') {
    return (
      <div className="pt-24 p-6 md:pt-28 md:p-8 max-w-[1600px] mx-auto">
        <PersonalDashboard />
      </div>
    );
  }

  // --- ADMIN LOGIC BELOW ---

  const visibleTabs = REPORTS_TABS; // Admin sees all tabs

  // Get requested tab or default (Admin defaults to intelligence)
  const activeTab = (searchParams.get('tab') as TabId) || 'intelligence';

  const setActiveTab = (tabId: TabId) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tabId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    // Admin Data Loading
    if (activeTab !== 'intelligence') {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const res = await apiClient('/api/admin/intelligence');
        setData(res);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load intelligence data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeTab]);

  if (loading) return <div className="p-8 text-center text-white/50">Loading intelligence analysis...</div>;
  if (activeTab === 'intelligence' && !data) return <div className="p-8 text-center text-white/50">No data available.</div>;

  if (activeTab === 'intelligence' && data && 'departmentHealth' in data) {
    var { departmentHealth, underperformingUsers, teamContribution, aging } = data;
  } else {
    // Fallback for non-intelligence tabs OR if data is invalid/error
    var { departmentHealth, underperformingUsers, teamContribution, aging } = {
      departmentHealth: {
        score: 0,
        grade: 'Healthy',
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        avgCompletionRate: 0,
        avgOnTimeRate: 0,
        overdueLoadRatio: 0
      } as DepartmentHealth,
      underperformingUsers: [] as UnderperformingUser[],
      teamContribution: [] as { name: string, value: number }[],
      aging: { '0-2 days': 0, '3-7 days': 0, '8-14 days': 0, '14+ days': 0 }
    };
  }

  // Health Colors (Conditional check to avoid crashing if data is missing on other tabs)
  const isHealthy = departmentHealth?.grade === 'Healthy';
  const isPoor = departmentHealth?.grade === 'Poor Performance';

  const healthColor = isHealthy ? 'text-green-400' : isPoor ? 'text-red-500' : 'text-yellow-400';
  const healthBg = isHealthy ? 'bg-green-500/10' : isPoor ? 'bg-red-500/10' : 'bg-yellow-500/10';
  const healthBorder = isHealthy ? 'border-green-500/20' : isPoor ? 'border-red-500/20' : 'border-yellow-500/20';
  const ringColor = isHealthy ? 'stroke-green-500' : isPoor ? 'stroke-red-500' : 'stroke-yellow-500';

  return (
    <div className="pt-24 p-6 md:pt-28 md:p-8 max-w-[1600px] mx-auto space-y-8">
      <header className="mb-4 space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              {activeTab === 'intelligence' ? 'Admin Intelligence' :
                activeTab === 'audit' ? 'Compliance Log' :
                  activeTab === 'team' ? 'Team Directory' : 'Organization'}
            </h1>
            <p className="text-[var(--color-text-secondary)] uppercase tracking-widest text-xs font-semibold">
              {activeTab === 'intelligence' ? 'Strict Accountability Dashboard' : 'System Management'}
            </p>
          </div>
          {activeTab === 'intelligence' && (
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg border border-white/10 transition-colors"
            >
              <Download size={16} className="text-indigo-400" />
              Export Data
            </button>
          )}
        </div>

        {/* Tab Navigation Registry */}
        <div className="flex gap-4 border-b border-white/10 overflow-x-auto">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${isActive
                  ? `${tab.color} ${tab.borderColor}`
                  : 'text-white/50 border-transparent hover:text-white hover:border-white/20'
                  }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>



      {/* Content Rendering Switch */}
      {activeTab === 'intelligence' ? (
        <>
          {/* Leadership Summary (Admins Only) */}
          <LeadershipSummaryPanel />

          {/* 1. Department Health Index (Primary & Dominant) */}
          <section className={`rounded-3xl border p-8 ${healthBg} ${healthBorder} relative overflow-hidden`}>
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Activity size={120} className={healthColor} />
            </div>

            <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
              {/* Gauge */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-black/20" />
                    <circle
                      cx="96" cy="96" r="88"
                      stroke="currentColor" strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={553}
                      strokeDashoffset={553 - (553 * departmentHealth.score) / 100}
                      strokeLinecap="round"
                      className={`${ringColor} transition-all duration-1000 ease-out`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-6xl font-bold ${healthColor}`}>{departmentHealth.score}</span>
                    <span className="text-sm text-white/50 uppercase tracking-wider font-semibold mt-1">Health Score</span>
                  </div>
                </div>
                <div className={`mt-4 px-6 py-1.5 rounded-full text-lg font-bold border ${healthColor} ${healthBorder} bg-black/20`}>
                  {departmentHealth.grade.toUpperCase()}
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
                <HealthMetric label="Completion Rate" value={`${departmentHealth.avgCompletionRate}%`} sub="Avg across department" />
                <HealthMetric label="On-Time Rate" value={`${departmentHealth.avgOnTimeRate}%`} sub="Target: >80%" />
                <HealthMetric label="Overdue Load" value={`${departmentHealth.overdueTasks}`} sub="Active overdue tasks" alert={departmentHealth.overdueTasks > 5} />
                <HealthMetric label="Active Tasks" value={departmentHealth.totalTasks} sub="Total workload" />
              </div>
            </div>
          </section>

          {/* 2. Main Layout: Wall of Shame vs Detail Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Underperformance Panel ("Wall of Shame") */}
            <section className="lg:col-span-8 bg-[#0f172a] border border-red-900/30 rounded-2xl shadow-2xl flex flex-col">
              <div className="p-6 border-b border-white/5 bg-red-950/10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-red-500" size={24} />
                  <h2 className="text-xl font-bold text-white tracking-wide">Underperforming Team Members</h2>
                </div>
                <span className="text-xs font-mono text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                  IPS SCORE {'<'} 60
                </span>
              </div>

              <div className="p-0 flex-1">
                {underperformingUsers.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                      <CheckCircle size={32} className="text-green-500" />
                    </div>
                    <h3 className="text-white font-medium text-lg">All Systems Nominal</h3>
                    <p className="text-white/40 mt-1 max-w-sm">No team members are currently flagged as underperforming. Performance thresholds are being met.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-black/20 text-xs uppercase text-white/40 font-semibold tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Team Member</th>
                          <th className="px-6 py-4 text-center">IPS Score</th>
                          <th className="px-6 py-4">Primary Insight</th>
                          <th className="px-6 py-4 text-center">Pending</th>
                          <th className="px-6 py-4 text-center">Avg Completion</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {underperformingUsers.map(user => (
                          <tr
                            key={user.userId}
                            className="hover:bg-white/5 transition-colors cursor-pointer"
                            onClick={() => setSelectedUser({ id: user.userId, name: user.name, avatarUrl: user.avatarUrl })}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {/* Use UI Avatar if no avatarUrl */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg ${user.avatarUrl ? '' : 'bg-gradient-to-br from-indigo-500 to-indigo-700'}`}>
                                  {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                                  ) : (
                                    user.name.substring(0, 2).toUpperCase()
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-white">{user.name}</div>
                                  <div className={`text-xs font-bold px-1.5 py-0.5 rounded inline-block mt-1 ${user.status === 'Underperforming' ? 'bg-red-500/20 text-red-200 border border-red-500/30' : 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30'
                                    }`}>
                                    {user.status.toUpperCase()}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="text-2xl font-black text-white">{user.ipsScore}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-red-300/80 font-medium flex items-start gap-2 text-sm">
                                <AlertOctagon size={16} className="mt-0.5 shrink-0 text-red-400" />
                                {user.insight}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="text-white font-mono opacity-60 text-sm">
                                {user.tasksAssigned} assigned
                              </div>
                              <div className="text-white font-bold font-mono">
                                {-user.pendingTasks} remaining
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className={`font-mono font-bold ${user.onTimeRate < 80 ? 'text-yellow-400' : 'text-green-400'}`}>
                                {user.onTimeRate}%
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            {/* Right Column: Contribution & Attendance */}
            <div className="lg:col-span-4 space-y-8">
              <section className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Users size={18} className="text-indigo-400" />
                  Team Contribution
                </h3>
                <p className="text-xs text-white/50 mb-4">Distribution of completed tasks</p>
                <TeamContributionChart data={teamContribution} />
              </section>

              <section className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Clock size={18} className="text-orange-400" />
                  Task Aging Overview
                </h3>
                <div className="space-y-3">
                  <AgingBar label="0-2 Days" count={aging['0-2 days']} color="bg-green-500" total={Object.values(aging).reduce((a, b) => a + b, 0)} />
                  <AgingBar label="3-7 Days" count={aging['3-7 days']} color="bg-blue-500" total={Object.values(aging).reduce((a, b) => a + b, 0)} />
                  <AgingBar label="8-14 Days" count={aging['8-14 days']} color="bg-yellow-500" total={Object.values(aging).reduce((a, b) => a + b, 0)} />
                  <AgingBar label="14+ Days" count={aging['14+ days']} color="bg-red-500" total={Object.values(aging).reduce((a, b) => a + b, 0)} />
                </div>
              </section>
            </div>
          </div>

          {/* Attendance Input Section */}

        </>
      ) : activeTab === 'audit' ? (
        <AuditLogTable />
      ) : activeTab === 'team' ? (
        // Providing default institution ID if undefined, ensuring component renders
        <UserManagementPanel institutionId={(user as any)?.institutionId?.toString() || '1'} />
      ) : activeTab === 'organization' ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          <section>
            <InstitutionManagement />
          </section>
          <section>
            <DepartmentManagement />
          </section>
        </div>
      ) : null}

      {/* Models */}
      {selectedUser && (
        <PerformanceHistoryModal
          userId={selectedUser.id}
          userName={selectedUser.name}
          avatarUrl={selectedUser.avatarUrl}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        availableUsers={underperformingUsers.map(u => ({ id: u.userId, name: u.name }))}
      />
    </div>
  );
}

export default function AdminIntelligenceReportsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-white/50">Loading reports...</div>}>
      <ReportsPageContent />
    </Suspense>
  );
}

function HealthMetric({ label, value, sub, alert }: { label: string, value: string | number, sub: string, alert?: boolean }) {
  return (
    <div className={`bg-black/20 rounded-xl p-4 border ${alert ? 'border-red-500/50' : 'border-white/5'}`}>
      <div className="text-xs text-white/50 uppercase font-bold tracking-wider mb-2">{label}</div>
      <div className={`text-3xl font-black ${alert ? 'text-red-400' : 'text-white'}`}>{value}</div>
      <div className="text-xs text-white/30 mt-1">{sub}</div>
    </div>
  );
}

function AgingBar({ label, count, color, total }: { label: string, count: number, color: string, total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs font-medium mb-1">
        <span className="text-white/70">{label}</span>
        <span className="text-white">{count}</span>
      </div>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}
