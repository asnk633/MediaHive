'use client';

import React from 'react';
import { PresenceUser } from '@/lib/collaboration/collabManager';
import { cn } from '@/lib/utils';

interface FieldPresenceProps {
    users: PresenceUser[];
    field: string;
}

/**
 * FieldPresence Component
 * 
 * Shows which users are currently editing a specific field.
 */
export function FieldPresence({ users, field }: FieldPresenceProps) {
    const activeHere = users.filter(u => u.editingField === field);
    
    if (activeHere.length === 0) return null;

    return (
        <div className="flex -space-x-1 ml-2">
            {activeHere.map((user) => (
                <div
                    key={user.id}
                    className="w-4 h-4 rounded-full border border-surface flex items-center justify-center text-[6px] font-bold text-white shadow-sm"
                    style={{ backgroundColor: user.color || '#3B82F6' }}
                    title={`${user.name} is editing...`}
                >
                    {user.name.charAt(0).toUpperCase()}
                </div>
            ))}
        </div>
    );
}
