import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { usePersistentConflicts } from '@/hooks/usePersistentConflicts';
import { ConflictStatus } from '@/lib/conflictStore';
import Link from 'next/link';

export const ConflictAwarenessBadge: React.FC = () => {
    const { conflicts } = usePersistentConflicts({
        status: [ConflictStatus.DETECTED, ConflictStatus.SURFACED]
    });

    const conflictCount = conflicts.length;

    if (conflictCount === 0) return null;

    return (
        <Link href="/conflicts" passHref>
            <button
                className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 text-gray-400 rounded-xl transition-all active:scale-95 text-sm font-bold relative"
                aria-label="Review Conflicts"
            >
                <AlertTriangle size={16} className="text-gray-400" />
                <span className="hidden sm:inline text-gray-300">Conflicts</span>
                <div className="absolute -top-2 -right-2 bg-gray-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-black">
                    {conflictCount}
                </div>
            </button>
        </Link>
    );
};
