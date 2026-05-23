import React from 'react';
import { WorkloadStat } from '@/services/reportService';
import { User, CheckCircle, Clock, AlertCircle, Briefcase } from 'lucide-react';
import { getRoleBadgeColors } from '@/lib/roleStyles';
import { cn } from '@/lib/utils';

interface WorkloadTableProps {
    data: WorkloadStat[];
}

export const WorkloadTable: React.FC<WorkloadTableProps> = ({ data }) => {
    // Sort alphabetically by name
    const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="bg-surface backdrop-blur-md rounded-[20px] border border-soft overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-soft bg-muted/5 flex items-center justify-between">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                    <UsersIcon size={18} className="text-blue-500" /> Team Workload
                </h3>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                    {data.length} Members
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted uppercase bg-muted/10">
                        <tr>
                            <th className="px-6 py-4 font-bold tracking-wider">Member</th>
                            <th className="px-6 py-4 font-bold tracking-wider text-center">Assigned</th>
                            <th className="px-6 py-4 font-bold tracking-wider text-center text-yellow-500">Pending</th>
                            <th className="px-6 py-4 font-bold tracking-wider text-center text-blue-400">Working</th>
                            <th className="px-6 py-4 font-bold tracking-wider text-center text-green-400">Done</th>
                            <th className="px-6 py-4 font-bold tracking-wider text-center text-red-400">Overdue</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-soft">
                        {sorted.map(user => (
                            <tr key={user.uid} className="hover:bg-primary/5 transition-colors group">
                                <td className="px-6 py-4 font-medium text-foreground flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/80 to-purple-500/80 text-foreground flex items-center justify-center font-bold text-xs shadow-inner">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="line-clamp-1 font-semibold group-hover:text-blue-500 transition-colors">{user.name}</div>
                                        <div className={cn("text-[10px] capitalize tracking-wide px-2 py-0.5 rounded-full w-fit mt-1", getRoleBadgeColors(user.role))}>{user.role}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center font-bold text-muted">
                                    {user.totalAssigned}
                                </td>
                                <td className="px-6 py-4 text-center font-medium text-gray-400">
                                    {user.pending > 0 ? user.pending : '-'}
                                </td>
                                <td className="px-6 py-4 text-center font-medium text-gray-400">
                                    {user.working > 0 ? user.working : '-'}
                                </td>
                                <td className="px-6 py-4 text-center font-medium text-gray-400">
                                    {user.completed > 0 ? user.completed : '-'}
                                </td>
                                <td className="px-6 py-4 text-center font-bold">
                                    {user.overdue > 0 ? (
                                        <span className="text-red-400 bg-red-400/10 px-2 py-1 rounded-md border border-red-400/10">
                                            {user.overdue}
                                        </span>
                                    ) : (
                                        <span className="text-gray-600">-</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {data.length === 0 && (
                <div className="p-12 text-center text-muted text-sm">
                    No team data available.
                </div>
            )}
        </div>
    );
};

const UsersIcon = ({ size, className }: { size: number; className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className={className}
    >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);
