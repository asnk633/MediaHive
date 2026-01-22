import React, { useState, useEffect, useRef } from 'react';
import { Bell, Layers } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { NotificationService } from '@/services/notificationService';
import { AppNotification } from '@/types/notification';
import { NotificationItem } from './NotificationItem';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { groupNotifications, GroupedNotification } from '@/lib/notification-grouping';
import { formatDistanceToNow } from 'date-fns';
import { apiClient } from '@/lib/apiClient';

export const NotificationBell = () => {
    const { user, authStatus } = useAuth();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Poll for notifications
    useEffect(() => {
        if (!user || authStatus !== 'authenticated') return;

        // Initial load
        const fetchNotifications = async () => {
            try {
                const data = await NotificationService.getUserNotifications();
                setNotifications(data);
                // Calculate unread count from the live data
                // (Assuming data includes isRead status)
                const count = data.filter(n => !n.isRead).length;
                setUnreadCount(count);
            } catch (error: any) {
                // Silently ignore 403/429 failures and 401 Unauthorized in polling to avoid console spam
                const msg = error.message?.toLowerCase() || '';
                if (msg.includes('429') || msg.includes('403') || msg.includes('401') || msg.includes('unauthorized')) {
                    // console.warn('Polling suppressed:', error.message);
                    return;
                }
                console.error('Failed to fetch notifications:', error);
            }
        };

        fetchNotifications();

        fetchNotifications();

        // Poll for updates every 30 seconds (Web Only)
        let pollInterval: NodeJS.Timeout;
        if (!Capacitor.isNativePlatform()) {
            pollInterval = setInterval(fetchNotifications, 30000);
        }

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [user?.uid, authStatus]); // Stable dependency: only re-run if UID changes or auth status confirms

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = async (notification: AppNotification | GroupedNotification) => {
        if ('isGroup' in notification) {
            // It's a group
            const items = notification.items;

            // Mark all valid items as read optimistically
            const itemIds = new Set(items.map(i => i.id));
            setNotifications(prev => prev.map(n =>
                itemIds.has(n.id) ? { ...n, isRead: true } : n
            ));

            // Reduce unread count
            setUnreadCount(prev => Math.max(0, prev - items.filter(i => !i.isRead).length));

            // Server update (batch if possible, but for now specific loop or modify API)
            // Ideally we'd have a bulk mark-read. Since we don't, we loop.
            // Constraint: "No new API endpoints"? Ideally yes.
            // But we have `markAllAsRead`. Maybe `markAsRead(ids[])`?
            // Existing `api/notifications/[id]` handles single.
            // We'll iterate fetch calls (simplest, robust) or use `markAllAsRead` if acceptable.
            // Parallel fetch is fine for a few items (usually < 10 in a group).
            items.filter(i => !i.isRead).forEach(async n => {
                try {
                    await apiClient(`/api/notifications/${n.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ action: 'markRead' })
                    });
                } catch (error) {
                    console.error('Failed to mark notification as read:', error);
                }
            });

            // Navigation: Use the latest item's actionUrl or construct from entity
            // Group assumes same entity.
            const target = items[0];
            if (target.actionUrl) {
                setIsOpen(false);
                let url = target.actionUrl;
                if (url.includes('/tasks/view/') && !url.includes('?id=')) {
                    url = url.replace('/tasks/view/', '/tasks/view?id=');
                }
                router.push(url);
            } else if (target.entityType === 'task') {
                setIsOpen(false);
                router.push(`/tasks/view?id=${target.entityId}`);
            } else if (target.entityType === 'event') {
                setIsOpen(false);
                // Assuming events have a view or just generic
                router.push('/events');
            }

        } else {
            // Single Notification
            if (!notification.isRead) {
                // Optimistic update
                setNotifications(prev => prev.map(n =>
                    n.id === notification.id ? { ...n, isRead: true } : n
                ));
                setUnreadCount(prev => Math.max(0, prev - 1));

                // API call
                await apiClient(`/api/notifications/${notification.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ action: 'markRead' })
                });
            }

            if (notification.actionUrl) {
                setIsOpen(false);
                let url = notification.actionUrl;
                if (url.includes('/tasks/view/') && !url.includes('?id=')) {
                    url = url.replace('/tasks/view/', '/tasks/view?id=');
                }
                router.push(url);
            }
        }
    };

    const handleMarkAllRead = async () => {
        if (!user) return;
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        await NotificationService.markAllAsRead();
    };

    // Calculate groups for display
    const displayList = groupNotifications(notifications);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)]"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-background">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden text-left ring-1 ring-white/10">
                    <div className="p-4 border-b border-border flex justify-between items-center bg-muted/5">
                        <h3 className="font-bold text-popover-foreground text-sm tracking-wide uppercase">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-muted/10 scrollbar-track-transparent">
                        {displayList.length > 0 ? (
                            displayList.map(item => {
                                if ('isGroup' in item) {
                                    // Render Group
                                    const latest = item.items[0];
                                    let entityName = latest.metadata?.entityTitle || latest.metadata?.taskTitle || latest.metadata?.eventTitle;

                                    if (!entityName) return (
                                        <NotificationItem
                                            key={item.id}
                                            notification={latest}
                                            onClick={() => handleNotificationClick(latest)}
                                        />
                                    );

                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => handleNotificationClick(item)}
                                            className="flex items-start gap-4 p-4 cursor-pointer transition-colors border-b border-border hover:bg-muted/5 group"
                                        >
                                            <div className="mt-1 flex-shrink-0">
                                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 group-hover:border-primary/40 transition-colors">
                                                    <Layers size={20} className="text-primary" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                                    {item.count} updates on <span className="font-bold text-foreground">'{entityName}'</span>
                                                </p>
                                                <p className="text-xs text-muted-foreground/70 mt-1">
                                                    Click to view all
                                                </p>
                                                <p className="text-[10px] text-muted-foreground/60 mt-2 font-medium uppercase tracking-wider">
                                                    {typeof item.latestCreatedAt === 'string'
                                                        ? formatDistanceToNow(new Date(item.latestCreatedAt), { addSuffix: true })
                                                        : item.latestCreatedAt?.seconds
                                                            ? formatDistanceToNow(new Date(item.latestCreatedAt.seconds * 1000), { addSuffix: true })
                                                            : 'Just now'
                                                    }
                                                </p>
                                            </div>
                                            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                        </div>
                                    );
                                } else {
                                    // Single Item
                                    return (
                                        <div key={item.id} className="border-b border-border last:border-0 hover:bg-muted/5 transition-colors">
                                            <NotificationItem
                                                notification={item}
                                                onClick={handleNotificationClick}
                                            />
                                        </div>
                                    );
                                }
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                <div className="p-4 bg-muted/10 rounded-full mb-4">
                                    <Layers size={32} className="opacity-40" />
                                </div>
                                <p className="text-sm font-medium">No notifications yet</p>
                            </div>
                        )}
                    </div>
                    <div className="p-3 border-t border-border bg-popover text-center flex flex-col gap-2">
                        <button
                            onClick={() => { setIsOpen(false); router.push('/notifications'); }}
                            className="text-xs font-bold text-primary hover:text-primary/80 uppercase tracking-wider transition-colors"
                        >
                            View Full Inbox
                        </button>
                        <small className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Notifications are stored for 30 days</small>
                    </div>
                </div>
            )}
        </div>
    );
};
