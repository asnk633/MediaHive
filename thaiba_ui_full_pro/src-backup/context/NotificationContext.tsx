// Mock NotificationContext for build purposes
import React, { createContext, useContext } from 'react';

const NotificationContext = createContext<any>({
  notifications: [],
  unreadCount: 0,
  markRead: () => {},
  loading: false,
  pushNotification: () => {},
  deleteNotification: () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  return (
    <NotificationContext.Provider value={{
      notifications: [],
      unreadCount: 0,
      markRead: () => {},
      loading: false,
      pushNotification: () => {},
      deleteNotification: () => {},
    }}>
      {children}
    </NotificationContext.Provider>
  );
}