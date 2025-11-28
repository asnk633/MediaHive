import React, { createContext, useContext, useEffect, useState } from 'react';
import { listenNotifications, pushNotification, deleteNotification } from '@/services/notificationService';
import { db } from '@/firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

export const NotificationContext = createContext<any>(null);

export const NotificationProvider = ({ children }: any) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = listenNotifications((all: any[]) => {
      setNotifications(all);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const unreadCount = notifications.filter((n) => !n.readBy?.includes(user?.uid)).length;

  const markRead = async (notif: any) => {
    if (!user) return;
    const ref = doc(db, 'notifications', notif.id);
    await updateDoc(ref, {
      readBy: Array.from(new Set([...(notif.readBy || []), user.uid]))
    });
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, loading, pushNotification, deleteNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
