'use client';

import { useEffect } from 'react';

/**
 * useTableRealtime
 * 
 * A hook that listens for Realtime updates for a specific table 
 * and triggers a callback. Ideal for auto-refreshing lists or 
 * detail views when the server data changes.
 */
export function useTableRealtime(table: string, onUpdate: (payload: any) => void) {
    useEffect(() => {
        const eventName = `mediahive_table_update_${table}`;
        
        const handler = (event: any) => {
            onUpdate(event.detail);
        };

        window.addEventListener(eventName, handler);
        
        return () => {
            window.removeEventListener(eventName, handler);
        };
    }, [table, onUpdate]);
}
