"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { CalendarMasterList } from '@/components/admin/CalendarMasterList';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLoader } from '@/components/ui/AppLoader';

export default function CalendarMasterPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <AppLoader />
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        // router.push('/home'); // Can't push while rendering? UseEffect is better but for now naive return is safer to prevent hydration mismatch
        return <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center text-white">Access Denied</div>;
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl"
                    >
                        <ChevronLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-display font-bold text-white tracking-tight">
                            Calendar Master List
                        </h1>
                        <p className="text-[var(--color-text-secondary)]">
                            Authoritative source for System Events & Holidays.
                        </p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-[#0f172a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                    <CalendarMasterList />
                </div>
            </div>
        </div>
    );
}
