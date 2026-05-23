import { useClientReady } from '@/hooks/useClientReady';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { SafeResponsiveContainer } from '@/components/SafeResponsiveContainer';
import { TaskStats } from '@/services/statsService';

interface StatusChartProps {
    stats: TaskStats;
}

export const StatusChart = ({ stats }: StatusChartProps) => {
    // Recharts requires explicit client-side rendering to avoid hydration mismatches
    const isReady = useClientReady();

    const data = [
        { name: 'Pending', value: stats.pending, color: '#f59e0b' }, // Amber
        { name: 'To Do', value: stats.todo, color: '#3b82f6' },     // Blue
        { name: 'In Prog', value: stats.inProgress, color: '#8b5cf6' }, // Violet
        { name: 'Review', value: stats.review, color: '#ec4899' },  // Pink
        { name: 'Done', value: stats.done, color: '#10b981' },      // Emerald
    ];

    // Filter out zero values to avoid empty segments
    const activeData = data.filter(d => d.value > 0);

    if (!isReady) {
        return (
            <div className="bg-surface backdrop-blur-md rounded-2xl p-5 shadow-xl h-[350px] animate-pulse" />
        );
    }

    if (activeData.length === 0) {
        return (
            <div className="bg-surface backdrop-blur-md rounded-2xl p-5 shadow-xl h-[350px] flex items-center justify-center">
                <p className="text-gray-400 text-sm">No task data available</p>
            </div>
        );
    }

    return (
        <div className="bg-surface backdrop-blur-md rounded-2xl p-5 shadow-xl flex flex-col h-[350px]">
            <h3 className="text-lg font-bold text-foreground mb-4">Task Status Distribution</h3>
            <div className="flex-1 w-full min-h-0">
                <SafeResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={activeData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={5}
                        >
                            {activeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9' }}
                            itemStyle={{ color: '#f1f5f9' }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            formatter={(value) => <span className="text-gray-300 text-xs ml-1">{value}</span>}
                        />
                    </PieChart>
                </SafeResponsiveContainer>
            </div>
        </div>
    );
};
