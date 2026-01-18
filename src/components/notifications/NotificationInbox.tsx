"use client";

import React, { useState, useEffect } from 'react';
import { AppNotification } from '@/types/notification';
import { NotificationService } from '@/services/notificationService';
import { NotificationItem } from './NotificationItem';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { Loader2, CheckCheck, Filter } from 'lucide-react';
import { toast } from 'sonner';

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
            const data = await NotificationService.getUserNotifications(100);
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
            setLoading(false);
        } catch (error: any) {
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
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success("Marked all as read");

        try {
            await NotificationService.markAllAsRead();
        } catch (error) {
            console.error("Failed to mark all read", error);
            // Revert only if necessary, but failing to mark read on server is low critical
            toast.error("Failed to sync read status");
            setNotifications(prevNotifications); // Revert on error
            setUnreadCount(prevNotifications.filter(n => !n.isRead).length);
        }
    };

    const handleNotificationClick = async (notification: AppNotification) => {
        // Mark read logic
        if (!notification.isRead) {
            // Optimistic
            setNotifications(prev => prev.map(n =>
                n.id === notification.id ? { ...n, isRead: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));

            try {
                await apiClient(`/api/notifications/${notification.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ action: 'markRead' })
                });
            } catch (e) {
                console.error(e);
            }
        }

        // Navigate
        if (notification.actionUrl) {
            let url = notification.actionUrl;
            if (url.includes('/tasks/view/') && !url.includes('?id=')) {
                url = url.replace('/tasks/view/', '/tasks/view?id=');
            }
            router.push(url);
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.isRead;
        if (filter === 'mentions') return n.type === 'task_assigned' || n.title.toLowerCase().includes('mention');
        return true;
    });

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
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-2 p-1 bg-surface rounded-xl border border-soft">
                    {(['all', 'unread', 'mentions'] as FilterType[]).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`
                                px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                                ${filter === f
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                }
                            `}
                        >
                            {f === 'all' ? 'All' : f === 'unread' ? `Unread (${unreadCount})` : 'Mentions'}
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleMarkAllRead}
                    disabled={unreadCount === 0}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/10 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <CheckCheck size={16} />
                    Mark all read
                </button>
            </div>

            {/* List */}
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-sm">
                {filteredNotifications.length > 0 ? (
                    <div className="divide-y divide-border">
                        {filteredNotifications.map(notification => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onClick={handleNotificationClick}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center opacity-60">
                        <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4">
                            <CheckCheck size={32} className="text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">All caught up!</h3>
                        <p className="text-sm text-muted-foreground mt-1">
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
