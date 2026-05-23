import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { usePersistentConflicts } from '@/hooks/usePersistentConflicts';
import { ConflictStatus } from '@/lib/conflictStore';
import Link from 'next/link';

import { usePermissions } from '@/hooks/usePermissions';

export const ConflictAwarenessBadge: React.FC = () => {
    const { role } = usePermissions();
    const { conflicts } = usePersistentConflicts({
        status: [ConflictStatus.DETECTED, ConflictStatus.SURFACED]
    });

    const conflictCount = conflicts.length;

    // Only show if there are actual conflicts to resolve
    if (conflictCount === 0) return null;

    return (
        <Link href="/conflicts" passHref>
            <button
                className="flex items-center gap-2 px-3 py-2 bg-red-950/20 hover:bg-red-900/30 border border-red-900/50 text-red-400 rounded-xl transition-all active:scale-95 text-sm font-bold relative animate-pulse"
                aria-label="Review Conflicts"
            >
                <AlertTriangle size={16} className="text-red-500" />
                <span className="hidden sm:inline text-red-300">Conflicts</span>
                <div className="absolute -top-2 -right-2 bg-red-600 text-foreground text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-black shadow-lg shadow-red-900/50">
                    {conflictCount}
                </div>
            </button>
        </Link>
    );
};
