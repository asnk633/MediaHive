import React from 'react';
import { Task } from '@/features/tasks/types/task';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell
} from 'recharts';
import { SafeResponsiveContainer } from '@/components/SafeResponsiveContainer';
import { Activity } from 'lucide-react';

interface WorkflowHealthWidgetProps {
    tasks: Task[];
}

export const WorkflowHealthWidget = ({ tasks }: WorkflowHealthWidgetProps) => {
    // Process Data
    const stageCounts: Record<string, number> = {
        intake: 0,
        shoot: 0,
        edit: 0,
        review: 0,
        publish: 0,
        general: 0
    };

    tasks.forEach(task => { // Fix applied
        if (task.status === 'done') return; // Exclude completed from active workflow
        const stage = task.smartMetadata?.inferredStage || 'general';
        if (stageCounts[stage] !== undefined) {
            stageCounts[stage]++;
        } else {
            stageCounts.general++;
        }
    });

    const data = [
        { name: 'Intake', count: stageCounts.intake, color: '#6366f1' }, // Indigo
        { name: 'Shoot', count: stageCounts.shoot, color: '#F59E0B' }, // Amber
        { name: 'Edit', count: stageCounts.edit, color: '#3B82F6' },   // Blue
        { name: 'Review', count: stageCounts.review, color: '#8B5CF6' }, // Purple
        { name: 'Publish', count: stageCounts.publish, color: '#10B981' }, // Green
    ];

    return (
        <div className="bg-foreground/5 backdrop-blur-md border border-[#ffffff1a] rounded-2xl p-6 shadow-xl h-full">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-foreground">Workflow Health</h3>
                    <p className="text-xs text-foreground/60">Active tasks by inferred stage</p>
                </div>
            </div>

            <div style={{ width: '100%', height: 250 }}>
                <SafeResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
                            width={60}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ backgroundColor: '#1F2937', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </SafeResponsiveContainer>
            </div>

            {/* Legend / Summary */}
            <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-foreground/5">
                {data.map((item) => (
                    <div key={item.name} className="text-center">
                        <p className="text-[10px] uppercase text-foreground/50 font-bold tracking-wider">{item.name}</p>
                        <p className="text-xl font-bold text-foreground mt-1">{item.count}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
