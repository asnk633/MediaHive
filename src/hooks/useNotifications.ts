
import { useState, useEffect } from 'react';
import { AppNotification } from '@/types/notification';
import { AlertService } from '@/services/alertService';
import { listenNotifications } from '@/services/notificationRealtime';

export function useNotifications(userId: string | null) {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        // Initial fetch
        AlertService.getUserNotifications()
            .then(data => {
                setNotifications(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Initial notification fetch failed:', err);
                setLoading(false);
            });

        // Setup polling (or realtime if implemented)
        // The listenNotifications in service already implements polling logic
        const unsubscribe = listenNotifications(userId, (newData) => {
            setNotifications(newData);
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [userId]);

    return { notifications, loading, setNotifications };
}
