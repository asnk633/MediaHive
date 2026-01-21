'use client';

export const dynamic = 'force-static';


import React from 'react';
import { useRouter } from 'next/navigation';
import { LeaveRequestForm } from '@/components/leave/LeaveRequestForm';
import { ChevronLeft } from 'lucide-react';

export default function RequestLeavePage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] p-4 md:p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-display font-bold text-white tracking-tight">
                            Request Leave
                        </h1>
                        <p className="text-[var(--color-text-secondary)]">
                            Submit a new leave request for approval
                        </p>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-8 shadow-2xl">
                    <LeaveRequestForm
                        onSuccess={() => router.push('/leave/my-requests')}
                        onCancel={() => router.back()}
                    />
                </div>
            </div>
        </div>
    );
}
