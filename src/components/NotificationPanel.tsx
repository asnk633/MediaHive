import React, { useState, useEffect } from 'react';
import { Layers } from 'lucide-react';
import { AlertService } from '@/services/alertService';
import { AppNotification } from '@/types/notification';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { useAuth } from '@/contexts/AuthContextProvider';
import { useRouter } from 'next/navigation';
import { groupNotifications, GroupedNotification } from '@/lib/notification-grouping';
import { formatDistanceToNow } from 'date-fns';
import { apiClient } from '@/lib/apiClient';
import { nativeNavigate } from '@/lib/utils';
import { listenNotifications } from '@/services/notificationRealtime';

export const NotificationPanel = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    // Subscribe to real-time notifications via SSE
    useEffect(() => {
        if (!user) return;

        const unsubscribe = listenNotifications(String(user.id), (data) => {
            setNotifications(data);
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user]);

    const handleNotificationClick = async (notification: AppNotification | GroupedNotification) => {
        if ('isGroup' in notification) {
            // It's a group
            const items = notification.items;

            // Mark all valid items as read optimistically
            const itemIds = new Set(items.map(i => i.id));
            setNotifications(prev => prev.map(n =>
                itemIds.has(n.id) ? { ...n, read: true } : n
            ));

            // Server update
            items.filter(i => !i.read).forEach(n => {
                AlertService.markAsRead(n.id);
            });

            // Navigation
            const target = items[0];
            if (target.action_url && typeof target.action_url === 'string') {
                let url = target.action_url;
                if (url.includes('/tasks/view/') && !url.includes('?id=')) {
                    url = url.replace('/tasks/view/', '/tasks/view?id=');
                }
                nativeNavigate(url, router, 'NotificationPanel (Group Click)');
            } else if (target.entity_type === 'task') {
                nativeNavigate(`/tasks/view?id=${target.entity_id}`, router, 'NotificationPanel (Group Task)');
            } else if (target.entity_type === 'event') {
                nativeNavigate('/events', router, 'NotificationPanel (Group Event)');
            }

        } else {
            // Single Notification
            if (!notification.read) {
                // Optimistic update
                setNotifications(prev => prev.map(n =>
                    n.id === notification.id ? { ...n, read: true } : n
                ));

                // API call
                await AlertService.markAsRead(notification.id);
            }

            if (notification.action_url && typeof notification.action_url === 'string') {
                let url = notification.action_url;
                if (url.includes('/tasks/view/') && !url.includes('?id=')) {
                    url = url.replace('/tasks/view/', '/tasks/view?id=');
                }
                nativeNavigate(url, router, 'NotificationPanel (Single Click)');
            }
        }
    };

    const handleMarkAllRead = async () => {
        if (!user) return;
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        await AlertService.markAllAsRead();
    };

    // Calculate groups for display
    const displayList = groupNotifications(notifications);

    return (
        <div className="bg-popover border border-foreground/20 rounded-2xl shadow-2xl text-left w-full max-w-sm sm:max-w-md md:max-w-xl mx-auto overflow-hidden ring-1 ring-black/5">
            <div className="p-4 border-b border-foreground/10 flex justify-between items-center bg-foreground/5">
                <h3 className="font-bold text-foreground text-sm tracking-wide uppercase">Notifications</h3>
                {notifications.some(n => !n.read) && (
                    <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {displayList.length > 0 ? (
                    displayList.map(item => {
                        if ('isGroup' in item) {
                            const latest = item.items[0];
                            let entityName = latest.metadata?.entityTitle || latest.metadata?.taskTitle || latest.metadata?.eventTitle;
                            if (!entityName) entityName = "Item";

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleNotificationClick(item)}
                                    className="flex items-start gap-4 p-4 cursor-pointer transition-colors border-b border-foreground/5 hover:bg-foreground/5 group"
                                >
                                    <div className="mt-1 flex-shrink-0">
                                        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30 group-hover:border-blue-500/50 transition-colors">
                                            <Layers size={20} className="text-blue-400" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground/90 group-hover:text-foreground transition-colors">
                                            {item.count} updates on <span className="font-bold text-foreground">'{entityName}'</span>
                                        </p>
                                        <p className="text-xs text-foreground/80 mt-1">
                                            Click to view all activities
                                        </p>
                                        <p className="text-[10px] text-foreground/75 mt-2 font-medium uppercase tracking-wider">
                                            {typeof item.latestCreatedAt === 'string'
                                                ? formatDistanceToNow(new Date(item.latestCreatedAt), { addSuffix: true })
                                                : (item.latestCreatedAt as any)?.seconds
                                                    ? formatDistanceToNow(new Date((item.latestCreatedAt as any).seconds * 1000), { addSuffix: true })
                                                    : 'Just now'
                                            }
                                        </p>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                </div>
                            );
                        } else {
                            // Single Item - We reuse NotificationItem but ensuring it looks good in a full panel
                            return (
                                <div
                                    key={item.id}
                                    className="border-b border-foreground/5 last:border-0 hover:bg-foreground/5 transition-colors cursor-pointer"
                                    onClick={() => handleNotificationClick(item)}
                                >
                                    <NotificationItem
                                        notification={item}
                                        onRead={(id) => handleNotificationClick({ ...item, id } as any)} // Hack or correct? handleNotificationClick marks read.
                                        onArchive={(id) => console.log('Archive not impl in panel yet', id)}
                                    />
                                </div>
                            );
                        }
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-foreground/85">
                        <div className="p-4 bg-foreground/5 rounded-full mb-4">
                            <Layers size={32} className="opacity-40" />
                        </div>
                        <p className="text-sm font-medium">No notifications yet</p>
                        <p className="text-xs text-foreground/70 mt-1">We'll notify you when something happens.</p>
                    </div>
                )}
            </div>
            <div className="p-3 border-t border-foreground/10 bg-foreground/5 text-center">
                <small className="text-[10px] text-foreground/80 font-semibold uppercase tracking-widest">Notifications are stored for 30 days</small>
            </div>
        </div>
    );
};
