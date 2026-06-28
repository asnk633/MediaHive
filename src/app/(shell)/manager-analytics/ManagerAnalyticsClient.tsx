'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

interface ManagerAnalyticsClientProps {
    summary: any;
}

export const ManagerAnalyticsClient: React.FC<ManagerAnalyticsClientProps> = ({ summary }) => {
    // Generate some mock data for velocity based on summary
    const taskStatusData = [
        { name: 'To Do', value: summary.tasks.filter((t: any) => t.status === 'todo').length },
        { name: 'In Progress', value: summary.tasks.filter((t: any) => t.status === 'in_progress').length },
        { name: 'Completed', value: summary.tasks.filter((t: any) => t.status === 'completed').length },
    ];

    const weeklyVelocityData = [
        { day: 'Mon', completed: 4, new: 5 },
        { day: 'Tue', completed: 6, new: 3 },
        { day: 'Wed', completed: 5, new: 7 },
        { day: 'Thu', completed: 8, new: 2 },
        { day: 'Fri', completed: Math.max(summary.tasks.filter((t: any) => t.status === 'completed').length, 3), new: summary.tasks.length },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <div className="rounded-xl border bg-card text-card-foreground shadow">
                <div className="p-6 flex flex-col space-y-1.5">
                    <h3 className="font-semibold leading-none tracking-tight">Task Status Distribution</h3>
                </div>
                <div className="p-6 pt-0">
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={taskStatusData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow">
                <div className="p-6 flex flex-col space-y-1.5">
                    <h3 className="font-semibold leading-none tracking-tight">Team Velocity (Tasks per Day)</h3>
                </div>
                <div className="p-6 pt-0">
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={weeklyVelocityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} />
                                <Line type="monotone" dataKey="new" stroke="#f43f5e" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
