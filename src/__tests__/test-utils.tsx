import React, { ReactNode } from 'react';
import { render as rtlRender } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { TaskContext } from '../context/TaskContext';

type ProvidersOptions = {
  theme?: 'dark' | 'light';
  user?: any;
  role?: any;
  notifications?: any[];
  tasks?: any[];
};

function Providers({ children, options }: { children: ReactNode; options?: ProvidersOptions }) {
  const opts = options || {};
  const theme = opts.theme || 'dark';
  const user = opts.user ?? null;
  const role = opts.role ?? { role: 'guest', tags: [] };
  const notifications = opts.notifications ?? [];
  const tasks = opts.tasks ?? [];

  return (
    <ThemeContext.Provider value={{ theme, setTheme: () => null }}>
      <AuthContext.Provider value={{ user, role, loading: false, verified: true }}>
        <NotificationContext.Provider value={{
          notifications,
          unreadCount: notifications.filter((n: any) => !(n.readBy || []).includes(user?.uid)).length,
          markRead: async () => { },
          pushNotification: async () => { },
          deleteNotification: async () => { }
        }}>
          <TaskContext.Provider value={{ tasks, loading: false }}>
            <MemoryRouter>
              {children}
            </MemoryRouter>
          </TaskContext.Provider>
        </NotificationContext.Provider>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}

export function render(ui: React.ReactElement, options?: any) {
  return rtlRender(ui, { wrapper: ({ children }) => <Providers options={options}>{children}</Providers>, ...options });
}

// re-export everything
export * from '@testing-library/react';
