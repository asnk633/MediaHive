"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { CreateEventForm } from '@/components/library/organisms/CreateEventForm';

export default function NewEventPage() {
    const router = useRouter();

    return (
        <div className="min-h-full flex items-center justify-center py-6 px-4 sm:px-6 relative">
            {/* Full-screen Background Layer */}
            <div className="fixed inset-0 bg-gradient-to-b from-slate-950 to-[#0B0D10] z-0" />
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.15),transparent_50%)] pointer-events-none z-0" />

            {/* Centered Glass Card */}
            <div className="w-full max-w-xl relative z-10">
                <div className="bg-[#13161c]/90 backdrop-blur-3xl border border-[#ffffff1a] rounded-3xl p-6 sm:p-8 shadow-2xl ring-1 ring-white/5">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                        <button
                            onClick={() => router.back()}
                            className="text-red-400/80 font-medium hover:text-red-300 transition-colors text-sm hover:bg-white/5 px-3 py-1.5 rounded-full"
                        >
                            Cancel
                        </button>
                        <h1 className="text-lg font-bold text-white tracking-wide">New Event</h1>
                        {/* Spacer for balance */}
                        <div className="w-[50px]"></div>
                    </div>

                    <CreateEventForm
                        onSuccess={() => router.push('/events')}
                        onCancel={() => router.back()}
                        isModal={false}
                    />
                </div>
            </div>
        </div>
    );
}
