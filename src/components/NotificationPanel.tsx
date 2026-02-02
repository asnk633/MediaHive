import React, { useState, useEffect } from 'react';
import { Layers } from 'lucide-react';
import { NotificationService } from '@/services/notificationService';
import { AppNotification } from '@/types/notification';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { useAuth } from '@/contexts/AuthContextProvider';
import { useRouter } from 'next/navigation';
import { groupNotifications, GroupedNotification } from '@/lib/notification-grouping';
import { formatDistanceToNow } from 'date-fns';
import { apiClient } from '@/lib/apiClient';
import { nativeNavigate } from '@/lib/utils';

export const NotificationPanel = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    // Initial fetch and setup
    useEffect(() => {
        if (!user) return;

        const fetchNotifications = async () => {
            try {
                const data = await NotificationService.getUserNotifications({ limit: 100 }); // Fetch more for panel
                setNotifications(data);
            } catch (e) {
                console.error(e);
            }
        };

        fetchNotifications();

        // Simple polling for now
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [user]);

    const handleNotificationClick = async (notification: AppNotification | GroupedNotification) => {
        if ('isGroup' in notification) {
            // It's a group
            const items = notification.items;

            // Mark all valid items as read optimistically
            const itemIds = new Set(items.map(i => i.id));
            setNotifications(prev => prev.map(n =>
                itemIds.has(n.id) ? { ...n, isRead: true } : n
            ));

            // Server update
            items.filter(i => !i.isRead).forEach(n => {
                apiClient(`/api/notifications/${n.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ action: 'markRead' })
                });
            });

            // Navigation
            const target = items[0];
            if (target.actionUrl) {
                let url = target.actionUrl;
                if (url.includes('/tasks/view/') && !url.includes('?id=')) {
                    url = url.replace('/tasks/view/', '/tasks/view?id=');
                }
                nativeNavigate(url, router, 'NotificationPanel (Group Click)');
            } else if (target.entityType === 'task') {
                nativeNavigate(`/tasks/view?id=${target.entityId}`, router, 'NotificationPanel (Group Task)');
            } else if (target.entityType === 'event') {
                nativeNavigate('/events', router, 'NotificationPanel (Group Event)');
            }

        } else {
            // Single Notification
            if (!notification.isRead) {
                // Optimistic update
                setNotifications(prev => prev.map(n =>
                    n.id === notification.id ? { ...n, isRead: true } : n
                ));

                // API call
                await apiClient(`/api/notifications/${notification.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ action: 'markRead' })
                });
            }

            if (notification.actionUrl) {
                let url = notification.actionUrl;
                if (url.includes('/tasks/view/') && !url.includes('?id=')) {
                    url = url.replace('/tasks/view/', '/tasks/view?id=');
                }
                nativeNavigate(url, router, 'NotificationPanel (Single Click)');
            }
        }
    };

    const handleMarkAllRead = async () => {
        if (!user) return;
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        await NotificationService.markAllAsRead();
    };

    // Calculate groups for display
    const displayList = groupNotifications(notifications);

    return (
        <div className="bg-[#0f172a] border border-white/20 rounded-2xl shadow-2xl text-left w-full max-w-sm sm:max-w-md md:max-w-xl mx-auto overflow-hidden ring-1 ring-black/50">
            <div className="p-4 border-b border-[#ffffff1a] flex justify-between items-center bg-white/5">
                <h3 className="font-bold text-white text-sm tracking-wide uppercase">Notifications</h3>
                {notifications.some(n => !n.isRead) && (
                    <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                    >
                        Mark all reads
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
                                    className="flex items-start gap-4 p-4 cursor-pointer transition-colors border-b border-white/5 hover:bg-white/5 group"
                                >
                                    <div className="mt-1 flex-shrink-0">
                                        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30 group-hover:border-blue-500/50 transition-colors">
                                            <Layers size={20} className="text-blue-400" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                                            {item.count} updates on <span className="font-bold text-white">'{entityName}'</span>
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Click to view all activities
                                        </p>
                                        <p className="text-[10px] text-gray-600 mt-2 font-medium uppercase tracking-wider">
                                            {typeof item.latestCreatedAt === 'string'
                                                ? formatDistanceToNow(new Date(item.latestCreatedAt), { addSuffix: true })
                                                : item.latestCreatedAt?.seconds
                                                    ? formatDistanceToNow(new Date(item.latestCreatedAt.seconds * 1000), { addSuffix: true })
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
                                <div key={item.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                    <NotificationItem
                                        notification={item}
                                        onClick={handleNotificationClick}
                                    />
                                </div>
                            );
                        }
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <div className="p-4 bg-white/5 rounded-full mb-4">
                            <Layers size={32} className="opacity-40" />
                        </div>
                        <p className="text-sm font-medium">No notifications yet</p>
                        <p className="text-xs opacity-60 mt-1">We'll notify you when something happens.</p>
                    </div>
                )}
            </div>
            <div className="p-3 border-t border-[#ffffff1a] bg-[#0f172a] text-center">
                <small className="text-[10px] text-gray-600 font-medium uppercase tracking-widest">Notifications are stored for 30 days</small>
            </div>
        </div>
    );
};
