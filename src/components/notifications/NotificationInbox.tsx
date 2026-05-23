"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppNotification } from '@/types/notification';
import { AlertService } from '@/services/alertService';
import { NotificationItem } from './NotificationItem';
import { useAuth } from '@/contexts/AuthContextProvider';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { nativeNavigate } from '@/lib/utils';
import { Loader2, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { DataList } from '@/components/ui/DataList';

type FilterType = 'all' | 'unread' | 'mentions';

export const NotificationInbox: React.FC = () => {
    const { user, authStatus } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            // Limit to 100 for the inbox view for performance
            const data = await AlertService.getUserNotifications({ limit: 100 });
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.read).length);
            setLoading(false);
        } catch (error: unknown) {
            console.error('Failed to fetch notifications:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authStatus === 'authenticated') {
            fetchNotifications();
            // Poll every 30s
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user, authStatus]);

    const handleMarkAllRead = async () => {
        if (unreadCount === 0) return;

        // Optimistic update
        const prevNotifications = [...notifications];
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        toast.success("Marked all as read");

        try {
            await AlertService.markAllAsRead();
        } catch (error) {
            console.error("Failed to mark all read", error);
            toast.error("Failed to sync read status");
            setNotifications(prevNotifications); // Revert on error
            setUnreadCount(prevNotifications.filter(n => !n.read).length);
        }
    };

    const handleNotificationClick = async (notification: AppNotification) => {
        // Mark read logic
        if (!notification.read) {
            // Optimistic
            setNotifications(prev => prev.map(n =>
                n.id === notification.id ? { ...n, read: true } : n,
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));

            try {
                await AlertService.markAsRead(notification.id);
            } catch (e) {
                console.error(e);
            }
        }

        // Navigate
        if (notification.action_url) {
            let url = notification.action_url;
            if (url.includes('/tasks/view/') && !url.includes('?id=')) {
                url = url.replace('/tasks/view/', '/tasks/view?id=');
            }
            nativeNavigate(url, router, 'NotificationInbox (Click)');
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.read;
        if (filter === 'mentions') return n.type === 'task_assigned' || n.title.toLowerCase().includes('mention');
        return true;
    });

    // --- Bulk Selection ---
    const allIds = React.useMemo(
        () => filteredNotifications.map(n => n.id),
        [filteredNotifications],
    );

    const sel = useBulkSelection<string>({ allIds });

    // Shift+click: track last clicked index via ref (no re-render)
    const lastSelectedIndexRef = useRef<number | null>(null);

    const handleSelectToggle = useCallback(
        (id: string, index: number, e: React.MouseEvent) => {
            if (e.shiftKey && lastSelectedIndexRef.current !== null) {
                sel.selectRange(lastSelectedIndexRef.current, index);
            } else {
                sel.toggle(id);
                lastSelectedIndexRef.current = index;
            }
        },
        [sel],
    );

    // Reset last-index when filter changes (selection also resets via allIds change)
    useEffect(() => {
        lastSelectedIndexRef.current = null;
        sel.clear();
        // sel.clear is stable; disabling exhaustive-deps is intentional here
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-foreground/5 p-4 rounded-2xl border border-foreground/10 backdrop-blur-sm">
                <div className="flex items-center gap-2 p-1 bg-surface rounded-xl border border-soft">
                    {(['all', 'unread', 'mentions'] as FilterType[]).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`
                                px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                                ${filter === f
                                    ? 'bg-primary text-foreground shadow-md font-extrabold'
                                    : 'text-foreground/75 hover:text-foreground hover:bg-foreground/5 font-semibold'
                                }
                            `}
                        >
                            {f === 'all' ? 'All' : f === 'unread' ? `Unread (${unreadCount})` : 'Mentions'}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    {/* Selection count badge */}
                    {sel.selectedIds.size > 0 && (
                        <span className="text-xs font-semibold text-foreground/85 tabular-nums">
                            {sel.selectedIds.size} selected
                        </span>
                    )}

                    <button
                        onClick={handleMarkAllRead}
                        disabled={unreadCount === 0}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/10 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <CheckCheck size={16} />
                        Mark all read
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-foreground/5 rounded-2xl border border-foreground/10 overflow-hidden shadow-sm">
                {filteredNotifications.length > 0 ? (
                    <DataList
                        selectable
                        isAllSelected={sel.isAllSelected}
                        isIndeterminate={sel.isIndeterminate}
                        onSelectAll={sel.selectAll}
                        onClearAll={sel.clear}
                        selectionLabel="Select all notifications"
                    >
                        {filteredNotifications.map((notification, index) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onRead={() => handleNotificationClick(notification)}
                                onArchive={() => { }}
                                selectable
                                selected={sel.isSelected(notification.id)}
                                onSelectToggle={(e) => handleSelectToggle(notification.id, index, e)}
                            />
                        ))}
                    </DataList>
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center opacity-90">
                        <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4">
                            <CheckCheck size={32} className="text-foreground/70" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">All caught up!</h3>
                        <p className="text-sm text-foreground/75 mt-1">
                            {filter === 'all'
                                ? "You have no notifications."
                                : `No ${filter} notifications found.`}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
