'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
// import { NotificationForm } from '@/components/NotificationForm';

const NotificationForm = dynamic(() => import('@/components/NotificationForm').then(mod => mod.NotificationForm), { ssr: false });

export default function NotificationsNewClient() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-transparent py-20 px-4 sm:px-6 relative overflow-hidden">
            {/* Ambient Light Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Centered Glass Card */}
            <div className="w-full max-w-xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="glass-liquid rounded-[32px] p-6 sm:p-10 shadow-2xl ring-1 ring-white/10 overflow-hidden relative">
                    {/* Top Glow Accent */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />

                    {/* Header */}
                    <div className="flex items-center justify-between mb-10">
                        <button
                            onClick={() => router.back()}
                            className="text-white/40 hover:text-white font-bold tracking-tight transition-all text-xs hover:bg-white/5 px-4 py-2 rounded-xl flex items-center gap-2 group"
                        >
                            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
                            Cancel
                        </button>
                        
                        <div className="text-center flex-1">
                            <h1 className="text-xl font-black text-white tracking-tight">
                                New <span className="text-blue-400">Notification</span>
                            </h1>
                            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-white/30 mt-1">
                                Broadcast Intelligence
                            </p>
                        </div>

                        {/* Spacer for balance */}
                        <div className="w-[80px]"></div>
                    </div>

                    <NotificationForm
                        onCancel={() => router.back()}
                    />
                </div>
            </div>
        </div>
    );
}
