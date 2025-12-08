// src/components/NotificationPanel.tsx
// Notification dropdown panel component

'use client';

import React, { useState, useEffect } from 'react';
// import { useNotificationsRealtime } from '../hooks/useNotificationsRealtime';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { Bell } from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const realtimeNotifications = useNotifications(user?.uid);

  // Realtime subscription handled by useNotifications hook below

  // Load initial notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await fetch('/api/notifications/list');
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };

    loadNotifications();
  }, []);

  // Update notifications when realtime data changes
  useEffect(() => {
    if (realtimeNotifications.length > 0) {
      // Merge realtime notifications with existing ones
      setNotifications(prev => {
        const newNotifications = [...prev];
        realtimeNotifications.forEach(realtimeNotif => {
          if (!newNotifications.some(n => n.id === realtimeNotif.id)) {
            newNotifications.unshift(realtimeNotif);
          }
        });
        return newNotifications;
      });

      // Update unread count based on realtime notifications
      const unreadRealtime = realtimeNotifications.filter(n => !n.readAt).length;
      setUnreadCount(prev => prev + unreadRealtime);
    }
  }, [realtimeNotifications]);

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: [notificationId]
        })
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.readAt);
      const unreadIds = unreadNotifications.map(n => n.id);

      const response = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: unreadIds
        })
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            unreadIds.includes(n.id) ? { ...n, readAt: new Date().toISOString() } : n
          )
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  return (
    <div className="relative">
      <button
        className="p-2 rounded-full hover:bg-[var(--panel)] transition-all duration-200 ease-in-out text-[var(--icon)] hover:text-[var(--text)] relative"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="notification-bell"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[var(--accent)] text-[var(--text)] text-xs flex items-center justify-center font-bold" data-testid="unread-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl bg-[var(--panel)] border border-[var(--glass-border)] shadow-lg z-50" data-testid="notification-dropdown">
          <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)]">
            <h3 className="text-lg font-semibold text-[var(--text)]">Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="text-sm text-[var(--accent)] hover:text-[var(--accent-2)] font-medium"
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-[var(--muted)]">
                <Bell className="mx-auto h-12 w-12 opacity-20 mb-2" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-[var(--glass-border)] hover:bg-[var(--panel-strong)] transition-colors duration-200 ease-in-out ${!notification.readAt ? 'bg-[var(--accent)]/5' : ''}`}
                  data-testid={`notification-item-${notification.id}`}
                >
                  <div className="notification-content">
                    <h4 className="font-semibold text-[var(--text)]">{notification.title}</h4>
                    <p className="mt-1 text-sm text-[var(--muted)]">{notification.body}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-[var(--muted)]">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                      {!notification.readAt && (
                        <button
                          className="text-xs text-[var(--accent)] hover:text-[var(--accent-2)] font-medium"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}