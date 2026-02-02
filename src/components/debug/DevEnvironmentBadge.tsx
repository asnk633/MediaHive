'use client';

import React, { useEffect, useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DevEnvironmentBadge({ className }: { className?: string }) {
    const [mode, setMode] = useState<'mock' | 'emulator' | 'production'>('production');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const noApi = process.env.NEXT_PUBLIC_DEV_NO_API === 'true';
        const override = localStorage.getItem('force_real_api') === 'true';
        const emulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

        if (noApi && !override) {
            setMode('mock');
        } else if (emulator) {
            setMode('emulator');
        } else {
            setMode('production');
        }
    }, []);

    const toggleMode = (e: React.MouseEvent) => {
        // Prevent event bubbling to avoid triggering parent handlers if nested
        e.stopPropagation();

        if (mode === 'mock') {
            const hasApiUrl = !!process.env.NEXT_PUBLIC_API_URL;
            if (!hasApiUrl) {
                alert('Cannot switch to Live: NEXT_PUBLIC_API_URL is missing in environment. Please configure it to fetch real data.');
                return;
            }

            if (confirm('Verify: Switch to LIVE FIREBASE data? This requires a valid network connection.')) {
                localStorage.setItem('force_real_api', 'true');
                window.location.reload();
            }
        } else if (mode === 'production') {
            if (confirm('Switch back to LOCAL MOCK data?')) {
                localStorage.removeItem('force_real_api');
                window.location.reload();
            }
        }
    };

    if (!mounted) return null;

    // Only show in non-prod builds or if explicitly mock
    if (process.env.NODE_ENV === 'production' && mode === 'production') return null;

    return (
        <button
            onClick={toggleMode}
            className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider border transition-all hover:brightness-110",
                mode === 'mock' && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                mode === 'emulator' && "bg-purple-500/10 text-purple-500 border-purple-500/20",
                mode === 'production' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                className
            )}
            title="Click to toggle Data Mode"
        >
            {mode === 'mock' && <ShieldAlert size={10} />}
            {mode === 'emulator' && <Database size={10} />}
            {mode === 'production' && <ShieldCheck size={10} />}
            {mode === 'mock' ? 'Local Mock' : mode === 'emulator' ? 'Emulator' : 'Firebase Live'}
        </button>
    );
}
