import React from 'react';
import { Task } from '@/types/task';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend
} from 'recharts';
import { SafeResponsiveContainer } from '@/components/SafeResponsiveContainer';
import { Network } from 'lucide-react';

interface TaskOriginWidgetProps {
    tasks: Task[];
}

export const TaskOriginWidget = ({ tasks }: TaskOriginWidgetProps) => {
    // Aggregation: Map<Provenance, Count>
    const originMap = {
        admin: 0,
        team: 0,
        system: 0,
        unknown: 0
    };

    tasks.forEach(task => {
        const provenance = (task.smartMetadata?.normalizedProvenance || 'Unknown').toLowerCase();

        if (provenance.includes('system')) {
            originMap.system++;
        } else if (task.created_by?.role === 'admin') {
            originMap.admin++;
        } else if (task.created_by?.role === 'team' || task.created_by?.role === 'editor' || task.created_by?.role === 'viewer') {
            originMap.team++;
        } else {
            // Check if user string matches known patterns or just bucket as 'Team' generally if not system or admin?
            // Let's stick to buckets.
            originMap.unknown++;
        }
    });

    const data = [
        { name: 'Admin', value: originMap.admin, color: '#8B5CF6' }, // Purple (Reserve Red for Risk)
        { name: 'Team', value: originMap.team + originMap.unknown, color: '#3B82F6' }, // Blue
        { name: 'System (Legacy)', value: originMap.system, color: '#6B7280' }, // Gray
    ].filter(d => d.value > 0);

    return (
        <div className="bg-white/5 backdrop-blur-md border border-[#ffffff1a] rounded-2xl p-6 shadow-xl h-full">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-gray-500/10 rounded-lg">
                    <Network className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Task Origin</h3>
                    <p className="text-xs text-gray-400">Distribution by source</p>
                </div>
            </div>

            <div className="flex items-center justify-center" style={{ width: '100%', height: 250 }}>
                <SafeResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.1)" />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1F2937', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </SafeResponsiveContainer>
            </div>
        </div>
    );
};
