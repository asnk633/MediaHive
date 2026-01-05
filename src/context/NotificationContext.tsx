import React, { createContext, useContext, useEffect, useState } from 'react';
import { listenNotifications, pushNotification, deleteNotification } from '@/services/notificationService';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';

export const NotificationContext = createContext<any>(null);

export const NotificationProvider = ({ children }: any) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = listenNotifications(user.uid, (all: any[]) => {
      setNotifications(all);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.readBy?.includes(user?.uid)).length;

  const markRead = async (notif: any) => {
    if (!user) return;
    await apiClient(`/api/notifications/${notif.id}/read`, {
      method: 'POST',
      body: JSON.stringify({
        userId: user.uid
      })
    });
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, loading, pushNotification, deleteNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
