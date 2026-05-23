"use client";

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

type DataItem = {
    name: string;
    value: number;
};

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

export function TeamContributionChart({ data }: { data: DataItem[] }) {
    if (!data || data.length === 0) {
        return <div className="text-foreground/70 text-center py-12">No data available</div>;
    }

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: 'white'
                        }}
                        itemStyle={{ color: 'white' }}
                        formatter={(value: any) => [`${value} Tasks`, 'Completed']}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        layout="horizontal"
                        formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
