import os
import json
from pathlib import Path

# ============================================================
# 1) jest.config.cjs
# ============================================================
(Path("jest.config.cjs")).write_text("""/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.(spec|test).{ts,tsx,js,jsx}'],
  transform: {
    '^.+\\\\.(ts|tsx)$': 'ts-jest'
  },
  moduleNameMapper: {
    '\\\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/src/jest.setup.ts'],
  collectCoverage: false
};
""", encoding='utf-8')

# ============================================================
# 2) src/jest.setup.ts
# ============================================================
(Path("src/jest.setup.ts")).write_text("""import '@testing-library/jest-dom/extend-expect';

// Silence some console noise from tests (optional)
const orig = console.error;
beforeAll(() => {
  // keep it, but you can filter when necessary
});
afterAll(() => {
  console.error = orig;
});
""", encoding='utf-8')

# ============================================================
# 3) src/test-utils.tsx
# ============================================================
(Path("src/test-utils.tsx")).write_text("""import React, { ReactNode } from 'react';
import { render as rtlRender } from '@testing-library/react';
import { ThemeContext } from './context/ThemeContext';
import { AuthContext } from './context/AuthContext';
import { NotificationContext } from './context/NotificationContext';
import { TaskContext } from './context/TaskContext';

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
          markRead: async () => {},
          pushNotification: async () => {},
          deleteNotification: async () => {}
        }}>
          <TaskContext.Provider value={{ tasks, loading: false }}>
            {children}
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
""", encoding='utf-8')

# ============================================================
# 4) Test Files
# ============================================================
tests_dir = Path("src/__tests__")
tests_dir.mkdir(parents=True, exist_ok=True)

(tests_dir / "TopBar.test.tsx").write_text("""import React from 'react';
import { render, screen, fireEvent } from '../test-utils';
import TopBar from '../components/TopBar';

test('renders TopBar and toggles theme button text', () => {
  render(<TopBar />, { options: { theme: 'dark' } });
  const btn = screen.getByRole('button', { name: /Light|Dark/i });
  // initial theme 'dark' -> button shows "Light"
  expect(btn).toBeInTheDocument();
  expect(btn).toHaveTextContent(/Light/i);
  // clicking toggles theme (ThemeContext.setTheme is a no-op in test util)
  fireEvent.click(btn);
  // still present (we can't inspect DOM class because setTheme is stubbed)
  expect(btn).toBeInTheDocument();
});
""", encoding='utf-8')

(tests_dir / "ThemeContext.test.tsx").write_text("""import React from 'react';
import { render } from '../test-utils';
import { useTheme } from '../context/ThemeContext';
import { screen } from '@testing-library/react';

function Consumer() {
  const { theme } = useTheme();
  return <div data-testid="theme">{theme}</div>;
}

test('ThemeContext provides theme value', () => {
  render(<Consumer />, { options: { theme: 'light' } });
  expect(screen.getByTestId('theme')).toHaveTextContent('light');
});
""", encoding='utf-8')

(tests_dir / "TaskCard.test.tsx").write_text("""import React from 'react';
import { render, screen, fireEvent } from '../test-utils';
import TaskCard from '../components/TaskCard';

const sampleTask = {
  id: 't1',
  title: 'Sample Task',
  description: 'desc',
  priority: 'high',
  createdBy: 'user-123'
};

test('TaskCard shows edit for creator and delete for admin', () => {
  // as the creator (team)
  render(<TaskCard task={sampleTask} />, { options: { user: { uid: 'user-123' }, role: { role: 'team', tags: [] } } });
  expect(screen.getByText(/Sample Task/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument();
  // delete should not be shown for team
  expect(screen.queryByRole('button', { name: /Delete/i })).not.toBeInTheDocument();

  // as admin
  render(<TaskCard task={sampleTask} />, { options: { user: { uid: 'someone-else' }, role: { role: 'admin', tags: [] } } });
  expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
});
""", encoding='utf-8')

(tests_dir / "TaskModal.test.tsx").write_text("""import React from 'react';
import { render, screen } from '../test-utils';
import TaskModal from '../components/TaskModal';
import userEvent from '@testing-library/user-event';

test('TaskModal renders and has Save and Cancel', async () => {
  render(<TaskModal open={true} onClose={() => {}} edit={null} />, {});
  expect(screen.getByText(/New Task|Edit Task/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
});
""", encoding='utf-8')

(tests_dir / "NotificationPanel.test.tsx").write_text("""import React from 'react';
import { render, screen, fireEvent } from '../test-utils';
import NotificationPanel from '../components/NotificationPanel';

const notifs = [
  { id: 'n1', title: 'Hello', body: 'World', readBy: [] }
];

test('NotificationPanel lists notifications and shows delete for admin', () => {
  // as guest: no delete
  render(<NotificationPanel open={true} onClose={() => {}} />, { options: { notifications: notifs, user: { uid: 'u1' }, role: { role: 'guest' } } });
  expect(screen.getByText('Hello')).toBeInTheDocument();
  expect(screen.queryByText(/Delete/i)).not.toBeInTheDocument();

  // as admin: delete present
  render(<NotificationPanel open={true} onClose={() => {}} />, { options: { notifications: notifs, user: { uid: 'u1' }, role: { role: 'admin' } } });
  expect(screen.getByText(/Delete/i)).toBeInTheDocument();
});
""", encoding='utf-8')

(tests_dir / "taskService.mock.test.ts").write_text("""import * as svc from '../services/taskService';

test('task service exports exist', () => {
  expect(typeof svc.listenTasks).toBe('function');
  expect(typeof svc.createTask).toBe('function');
  expect(typeof svc.updateTask).toBe('function');
  expect(typeof svc.deleteTask).toBe('function');
});
""", encoding='utf-8')

# ============================================================
# 5) Update package.json
# ============================================================
pkg_path = Path("package.json")
if pkg_path.exists():
    try:
        pkg = json.loads(pkg_path.read_text(encoding='utf-8-sig'))
    except json.JSONDecodeError:
        pkg = json.loads(pkg_path.read_text(encoding='utf-8'))
        
    if "scripts" not in pkg:
        pkg["scripts"] = {}
    pkg["scripts"]["test"] = "jest --passWithNoTests"
    pkg_path.write_text(json.dumps(pkg, indent=2), encoding='utf-8')
    print("Updated package.json with test script")

print("Test setup files created successfully!")
