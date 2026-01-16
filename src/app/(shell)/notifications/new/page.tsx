"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { NotificationForm } from '@/components/NotificationForm';

export default function NewNotificationPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-background py-20 px-4 sm:px-6 relative overflow-hidden">
            {/* Centered Glass Card */}
            <div className="w-full max-w-xl relative z-10">
                <div className="bg-surface/90 backdrop-blur-3xl border border-soft rounded-3xl p-6 sm:p-8 shadow-2xl ring-1 ring-soft">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-soft">
                        <button
                            onClick={() => router.back()}
                            className="text-muted hover:text-foreground font-medium transition-colors text-sm hover:bg-muted/10 px-3 py-1.5 rounded-full"
                        >
                            Cancel
                        </button>
                        <h1 className="text-lg font-bold text-foreground tracking-wide">New Notification</h1>

                        {/* Spacer for balance */}
                        <div className="w-[50px]"></div>
                    </div>

                    <NotificationForm
                        onCancel={() => router.back()}
                    />
                </div>
            </div>
        </div>
    );
}