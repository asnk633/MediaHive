/**
 * Phase 8B: Conflict Center Navigation Link
 * 
 * Passive entry point for the Conflict Resolution Center
 */

import React from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { usePersistentConflicts } from '@/hooks/usePersistentConflicts';
import { ConflictStatus } from '@/lib/conflictStore';

export const ConflictCenterLink: React.FC = () => {
    const { conflicts } = usePersistentConflicts({
        status: [ConflictStatus.DETECTED, ConflictStatus.SURFACED]
    });
    
    const conflictCount = conflicts.length;
    
    return (
        <Link 
            href="/conflicts"
            className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 text-foreground/60 rounded-xl transition-all active:scale-95 text-sm font-bold relative"
            aria-label="Review Conflicts"
        >
            <AlertTriangle size={16} className="text-foreground/60" />
            <span className="hidden sm:inline text-foreground">Conflicts</span>
            {conflictCount > 0 && (
                <div className="absolute -top-2 -right-2 bg-gray-600 text-foreground text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-black">
                    {conflictCount}
                </div>
            )}
        </Link>
    );
};
