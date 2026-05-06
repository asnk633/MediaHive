"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SystemSettingsRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/admin/structure');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                <p className="text-sm font-medium text-white/40 uppercase tracking-widest">Redirecting to Structure...</p>
            </div>
        </div>
    );
}
