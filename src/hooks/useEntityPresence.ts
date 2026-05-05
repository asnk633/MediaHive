'use client';

import { useEffect, useState } from 'react';
import { collabManager, PresenceUser } from '@/lib/collaboration/collabManager';
import { useAuth } from '@/contexts/AuthContextProvider';

/**
 * useEntityPresence Hook
 * 
 * Synchronizes presence for a specific entity (Task, Event, etc.)
 * Handles joining, leaving, and subscribing to other users' presence.
 */
export function useEntityPresence(type: 'task' | 'event' | 'inventory' | 'project', id?: string) {
    const { user } = useAuth();
    const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);

    useEffect(() => {
        if (!user || !id) return;

        // 1. Join the entity channel
        collabManager.joinEntity(type, id);

        // 2. Subscribe to presence updates
        const unsubscribe = collabManager.subscribe(type, id, (users) => {
            // Filter out self to only show others in the pile
            setActiveUsers(users.filter(u => u.id !== user.uid));
        });

        return () => {
            // 3. Leave the entity channel on unmount
            unsubscribe();
            collabManager.leaveEntity(type, id);
        };
    }, [type, id, user?.uid]);

    const updateFocus = (field: string | null, isTyping: boolean = false) => {
        if (!id) return;
        collabManager.broadcastFocus(type, id, field, isTyping);
    };

    return {
        activeUsers,
        updateFocus,
        currentUser: user
    };
}
