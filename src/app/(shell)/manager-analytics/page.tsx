'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContextProvider';
import { nativeNavigate } from '@/lib/utils';
import { CanonicalDataService } from '@/services/canonicalDataService';
import { ManagerAnalyticsClient } from './ManagerAnalyticsClient';
import { Loader2 } from 'lucide-react';

export default function ManagerAnalyticsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            nativeNavigate('/login', router, 'ManagerAnalytics (Unauthenticated)');
            return;
        }

        const role = user.role || 'member';
        if (role !== 'admin' && role !== 'manager') {
            nativeNavigate('/home', router, 'ManagerAnalytics (Unauthorized)');
            return;
        }

        // Fetch operational summary client-side
        let active = true;
        const fetchData = async () => {
            try {
                const data = await CanonicalDataService.getTodayOperationalSummary();
                if (active) {
                    setSummary(data);
                    setLoading(false);
                }
            } catch (err) {
                console.error('Failed to fetch analytics summary:', err);
                if (active) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            active = false;
        };
    }, [user, authLoading, router]);

    if (authLoading || loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <h2 className="text-3xl font-bold tracking-tight">Team Velocity & Analytics</h2>
                <div>Failed to load analytics data.</div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Team Velocity & Analytics</h2>
            </div>
            <ManagerAnalyticsClient summary={summary} />
        </div>
    );
}
