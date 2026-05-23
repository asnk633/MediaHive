import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Layers } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { AlertService } from '@/services/alertService';
import { AppNotification } from '@/types/notification';
import { NotificationItem } from './NotificationItem';
import { useAuth } from '@/contexts/AuthContextProvider';
import { useRouter } from 'next/navigation';
import { groupNotifications, GroupedNotification } from '@/lib/notification-grouping';
import { formatDistanceToNow } from 'date-fns';
import { apiClient } from '@/lib/apiClient';
import { nativeNavigate, cn } from '@/lib/utils';
import { computeBadgeCount } from '@/lib/notificationSelectors';

export const NotificationBell = () => {
    const { user, authStatus } = useAuth();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const [isMobile, setIsMobile] = useState(false);
    const [isPulsing, setIsPulsing] = useState(false);

    // Trigger pulse on unread count increase
    useEffect(() => {
        if (unreadCount > 0) {
            setIsPulsing(true);
            const timer = setTimeout(() => setIsPulsing(false), 200);
            return () => clearTimeout(timer);
        }
    }, [unreadCount]);

    // Poll for notifications
    useEffect(() => {
        if (!user || authStatus !== 'authenticated') return;

        const controller = new AbortController();

        // Initial load
        const fetchNotifications = async () => {
            try {
                const data = await AlertService.getUserNotifications({ signal: controller.signal });
                setNotifications(data);
                // Phase 14: Use new badge count logic (High + Medium unread only)
                setUnreadCount(computeBadgeCount(data));
            } catch (error: any) {
                if (error.name === 'AbortError') return;
                const msg = error.message?.toLowerCase() || '';
                if (msg.includes('429') || msg.includes('403') || msg.includes('401') || msg.includes('unauthorized')) {
                    return;
                }
                console.error('Failed to fetch notifications:', error);
            }
        };

        fetchNotifications();

        // Poll for updates every 30 seconds (Web Only)
        let pollInterval: NodeJS.Timeout;
        if (!Capacitor.isNativePlatform()) {
            pollInterval = setInterval(fetchNotifications, 30000);
        }

        return () => {
            if (pollInterval) clearInterval(pollInterval);
            controller.abort();
        };
    }, [user?.id, authStatus]);

    // Calculate dropdown position when opening
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const dropdownWidth = 360; // match dropdown width
            const margin = 12;

            // Detect mobile
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);

            let left = rect.left;

            // Prevent overflow on right side
            if (left + dropdownWidth > window.innerWidth - margin) {
                left = window.innerWidth - dropdownWidth - margin;
            }

            // Prevent overflow on left side
            if (left < margin) {
                left = margin;
            }

            setDropdownPosition({
                top: rect.bottom + 8,
                left
            });
        }
    }, [isOpen]);

    // Reposition on window resize
    useEffect(() => {
        const handleResize = () => {
            if (isOpen && buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                const dropdownWidth = 360;
                const margin = 12;

                // Detect mobile
                const mobile = window.innerWidth < 768;
                setIsMobile(mobile);

                let left = rect.left;

                // Prevent overflow on right side
                if (left + dropdownWidth > window.innerWidth - margin) {
                    left = window.innerWidth - dropdownWidth - margin;
                }

                // Prevent overflow on left side
                if (left < margin) {
                    left = margin;
                }

                setDropdownPosition({
                    top: rect.bottom + 8,
                    left
                });
            }
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleResize, true); // Capture phase for all scroll containers
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleResize, true);
        };
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const handleNotificationClick = async (notification: AppNotification | GroupedNotification) => {
        if ('isGroup' in notification) {
            // It's a group
            const items = notification.items;

            // Mark all valid items as read optimistically
            const itemIds = new Set(items.map(i => i.id));
            const updatedNotifications = notifications.map(n =>
                itemIds.has(n.id) ? { ...n, read: true } : n
            );
            setNotifications(updatedNotifications);
            setUnreadCount(computeBadgeCount(updatedNotifications));

            // API calls
            items.filter(i => !i.read).forEach(async n => {
                try {
                    await AlertService.markAsRead(n.id);
                } catch (error) {
                    console.error('Failed to mark notification as read:', error);
                }
            });

            // Navigation
            const target = items[0];
            if (target.action_url && typeof target.action_url === 'string') {
                setIsOpen(false);
                let url = target.action_url;
                if (url.includes('/tasks/view/') && !url.includes('?id=')) {
                    url = url.replace('/tasks/view/', '/tasks/view?id=');
                }
                nativeNavigate(url, router, 'NotificationBell (Group URL Click)');
            } else if (target.entity_type === 'task') {
                setIsOpen(false);
                nativeNavigate(`/tasks/view?id=${target.entity_id}`, router, 'NotificationBell (Group Task Click)');
            } else if (target.entity_type === 'event') {
                setIsOpen(false);
                nativeNavigate('/events', router, 'NotificationBell (Group Event Click)');
            }

        } else {
            // Single Notification
            if (!notification.read) {
                const updatedNotifications = notifications.map(n =>
                    n.id === notification.id ? { ...n, read: true } : n
                );
                setNotifications(updatedNotifications);
                setUnreadCount(computeBadgeCount(updatedNotifications));

                // API call
                await AlertService.markAsRead(notification.id);
            }

            if (notification.action_url && typeof notification.action_url === 'string') {
                setIsOpen(false);
                let url = notification.action_url;
                if (url.includes('/tasks/view/') && !url.includes('?id=')) {
                    url = url.replace('/tasks/view/', '/tasks/view?id=');
                }
                nativeNavigate(url, router, 'NotificationBell (Single URL Click)');
            }
        }
    };

    const handleMarkAllRead = async () => {
        if (!user) return;
        const allRead = notifications.map(n => ({ ...n, read: true }));
        setNotifications(allRead);
        setUnreadCount(0);
        await AlertService.markAllAsRead();
    };

    // Calculate groups for display
    const displayList = groupNotifications(notifications);

    return (
        <>
            <button
                id="notification-bell"
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                title="Notifications"
                className={cn(
                    "relative p-2 rounded-full hover:bg-foreground/5 transition-all text-foreground/70 button-micro",
                    isPulsing && "animate-bell"
                )}
            >
                <Bell size={20} className={cn("transition-colors", unreadCount > 0 ? "text-indigo-400" : "text-foreground/80")} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-500 text-foreground text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-[var(--popover-bg)] shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && typeof window !== 'undefined' && createPortal(
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-[9998]"
                        onClick={() => setIsOpen(false)}
                        aria-hidden="true"
                    />
                    {/* Dropdown */}
                    <div
                        ref={dropdownRef}
                        className="fixed z-[9999] w-[360px] max-md:left-3 max-md:right-3 max-md:w-auto bg-[var(--glass-liquid-bg)] backdrop-blur-2xl border border-[var(--glass-liquid-border)] rounded-2xl shadow-2xl overflow-hidden text-left ring-1 ring-foreground/5 animate-in fade-in zoom-in-95 duration-200"
                        style={{
                            top: `${dropdownPosition.top}px`,
                            // Only apply left on desktop; mobile uses Tailwind classes
                            ...(isMobile ? {} : { left: `${dropdownPosition.left}px` }),
                            maxHeight: '70vh'
                        }}
                    >

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
                                        const latest = item.items[0];
                                        let entityName = latest.metadata?.entityTitle || latest.metadata?.taskTitle || latest.metadata?.eventTitle;

                                        if (!entityName) return (
                                            <NotificationItem
                                                key={item.id}
                                                notification={latest}
                                                onRead={() => handleNotificationClick(latest)}
                                                onArchive={() => { }}
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
                                                    <p className="text-sm font-medium text-foreground/90 group-hover:text-foreground transition-colors">
                                                        {item.count} updates on <span className="font-bold text-foreground">'{entityName}'</span>
                                                    </p>
                                                    <p className="text-xs text-foreground/80 mt-1">
                                                        Click to view all
                                                    </p>
                                                    <p className="text-[10px] text-foreground/70 mt-2 font-medium uppercase tracking-wider">
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
                                        return (
                                            <div key={item.id} className="border-b border-border last:border-0 hover:bg-muted/5 transition-colors">
                                                <NotificationItem
                                                    notification={item as any}
                                                    onRead={() => handleNotificationClick(item)}
                                                    onArchive={() => { }}
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
                                </div>
                             )}
                        </div>
                        <div className="p-3 border-t border-border bg-popover text-center flex flex-col gap-2">
                            <button
                                onClick={() => { setIsOpen(false); nativeNavigate('/notifications', router, 'NotificationBell (View Full Inbox)'); }}
                                className="text-xs font-bold text-primary hover:text-primary/80 uppercase tracking-wider transition-colors"
                            >
                                View Full Inbox
                            </button>
                            <small className="text-[10px] text-foreground/75 font-semibold uppercase tracking-widest">Notifications are stored for 30 days</small>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </>
    );
};
