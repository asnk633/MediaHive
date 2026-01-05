import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

// Mock ThemeContext
const ThemeContext = React.createContext({
  theme: 'dark',
  setTheme: () => {}
});

// Mock NotificationContext
const NotificationContext = React.createContext({
  notifications: [] as any[],
  unreadCount: 0,
  markRead: async () => {},
  pushNotification: async () => {},
  deleteNotification: async () => {}
});

// Mock TaskContext
const TaskContext = React.createContext({
  tasks: [] as any[],
  loading: false
});

// Mock RoleContext
const RoleContext = React.createContext({
  user: { id: "test", name: "Test User", role: "guest" },
  setRole: () => {}
});

interface ProvidersOptions {
  user?: any;
  role?: any;
  theme?: 'dark' | 'light';
  notifications?: any[];
  tasks?: any[];
}

interface RenderWithProvidersResult {
  ui: React.ReactNode;
}

export function renderWithProviders(
  ui: React.ReactNode, 
  options: ProvidersOptions = {}
): RenderWithProvidersResult {
  const {
    user = null,
    role = { role: 'guest', tags: [] },
    theme = 'dark',
    notifications = [],
    tasks = []
  } = options;

  const themeValue = {
    theme,
    setTheme: () => {}
  };

  const authValue = {
    user,
    role,
    loading: false,
    verified: true
  };

  const notificationValue = {
    notifications,
    unreadCount: notifications.filter((n: any) => !(n.readBy || []).includes(user?.uid)).length,
    markRead: async () => {},
    pushNotification: async () => {},
    deleteNotification: async () => {}
  };

  const taskValue = {
    tasks,
    loading: false
  };

  const roleValue = {
    user: user || { id: "test", name: "Test User", role: role?.role || "guest" },
    setRole: () => {}
  };

  return {
    ui: (
      <ThemeContext.Provider value={themeValue}>
        <AuthContext.Provider value={authValue}>
          <NotificationContext.Provider value={notificationValue}>
            <TaskContext.Provider value={taskValue}>
              <RoleContext.Provider value={roleValue}>
                <BrowserRouter>
                  {ui}
                </BrowserRouter>
              </RoleContext.Provider>
            </TaskContext.Provider>
          </NotificationContext.Provider>
        </AuthContext.Provider>
      </ThemeContext.Provider>
    )
  };
}