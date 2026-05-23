import React from 'react';
import { Task } from '@/features/tasks/types/task';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
import { SafeResponsiveContainer } from '@/components/SafeResponsiveContainer';
import { Users } from 'lucide-react';

interface TeamLoadWidgetProps {
    tasks: Task[];
}

type LoadStat = {
    name: string;
    shoot: number;
    edit: number;
    review: number;
    publish: number;
    general: number;
    [key: string]: string | number; // Allow dynamic stage access
};

export const TeamLoadWidget = ({ tasks }: TeamLoadWidgetProps) => {
    // Aggregation: Map<UserId, LoadStat>
    const loadMap = new Map<string, LoadStat>();

    tasks.forEach(task => { // Fix applied
        if (task.status === 'done') return;

        const stage = task.smartMetadata?.inferredStage || 'general';
        const assignees = task.assigned_to || [];

        if (assignees.length === 0) {
            // Unassigned bucket? Optional. Let's skip for "Team Load" specific
            return;
        }

        assignees.forEach(assignee => {
            const uid = typeof assignee === 'string' ? assignee : assignee.uid;
            const name = typeof assignee === 'string' ? 'Unknown' : assignee.name;

            if (!loadMap.has(uid)) {
                loadMap.set(uid, { name, shoot: 0, edit: 0, review: 0, publish: 0, general: 0 });
            }

            const stats = loadMap.get(uid)!;
            if (stats[stage] !== undefined) {
                (stats[stage] as number)++;
            } else {
                stats.general++;
            }
        });
    });

    const data = Array.from(loadMap.values())
        .map(stat => ({
            ...stat,
            name: stat.name.split(' ')[0] // Short name
        }))
        .sort((a, b) => {
            // Sort by total load
            const totalA = a.shoot + a.edit + a.review + a.publish + a.general;
            const totalB = b.shoot + b.edit + b.review + b.publish + b.general;
            return totalB - totalA;
        })
        .slice(0, 8); // Top 8 loaded members

    if (data.length === 0) {
        return (
            <div className="bg-foreground/5 backdrop-blur-md border border-[#ffffff1a] rounded-2xl p-6 shadow-xl h-full flex flex-col items-center justify-center text-gray-500">
                <Users size={48} className="opacity-20 mb-4" />
                <p>No active team assignments found.</p>
            </div>
        );
    }

    return (
        <div className="bg-foreground/5 backdrop-blur-md border border-[#ffffff1a] rounded-2xl p-6 shadow-xl h-full">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-foreground">Team Load Overview</h3>
                    <p className="text-xs text-gray-400">Active assignments by stage</p>
                </div>
            </div>

            <div style={{ width: '100%', height: 300 }}>
                <SafeResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ backgroundColor: '#1F2937', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />

                        <Bar dataKey="shoot" stackId="a" fill="#F59E0B" name="Shoot" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="edit" stackId="a" fill="#3B82F6" name="Edit" />
                        <Bar dataKey="review" stackId="a" fill="#8B5CF6" name="Review" />
                        <Bar dataKey="publish" stackId="a" fill="#10B981" name="Publish" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </SafeResponsiveContainer>
            </div>
        </div>
    );
};
