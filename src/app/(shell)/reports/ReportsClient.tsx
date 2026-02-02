'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/ui/layout/PageLayout';
import { nativeNavigate } from '@/lib/utils';
import { PageHeader } from '@/components/ui/layout/PageHeader';
import { FileText, Activity, BarChart3, TrendingUp, WifiOff } from 'lucide-react';
import { useState, useEffect } from 'react';

import { OfflinePlaceholder } from '@/components/OfflinePlaceholder';
import { useNative } from '@/hooks/useNative';

export default function ReportsClient() {
    const router = useRouter();
    const { isNative } = useNative();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        setIsChecking(false);
    }, []);

    if (isChecking) return <div className="min-h-screen bg-[var(--bg-card)]" />;

    // TODO: [Future Sync]
    // Allow render for native.
    /*
    if (isNative) {
        return (
            <PageLayout mode="plain">
                <OfflinePlaceholder
                    title="Reports Unavailable"
                    message="Generation of reports requires access to the server database. Please use the web version."
                    icon={BarChart3}
                />
            </PageLayout>
        );
    }
    */

    const reports = [
        {
            title: 'Activity Report',
            description: 'Task requests and completion status',
            icon: Activity,
            href: '/reports/activity',
            color: 'blue'
        },
        {
            title: 'Performance Metrics',
            description: 'Team and individual performance',
            icon: TrendingUp,
            href: '/reports/performance',
            color: 'green'
        },
        {
            title: 'Analytics Dashboard',
            description: 'System-wide analytics and insights',
            icon: BarChart3,
            href: '/reports/analytics',
            color: 'purple'
        },
        {
            title: 'Custom Reports',
            description: 'Build custom reports',
            icon: FileText,
            href: '/reports/custom',
            color: 'orange'
        }
    ];

    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
        green: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
        purple: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20',
        orange: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20'
    };

    return (
        <PageLayout mode="plain">
            <PageHeader
                title="Reports"
                description="View analytics and generate reports"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
                {reports.map((report) => {
                    const Icon = report.icon;
                    return (
                        <button
                            key={report.href}
                            onClick={() => nativeNavigate(report.href, router, 'ReportsClient (Report Click)')}
                            className="group p-6 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl hover:border-[var(--border-primary)] transition-all text-left"
                        >
                            <div className={`inline-flex p-3 rounded-xl mb-4 ${colorClasses[report.color]}`}>
                                <Icon size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                                {report.title}
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                                {report.description}
                            </p>
                        </button>
                    );
                })}
            </div>
        </PageLayout>
    );
}
