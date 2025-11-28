# setup_thaiba_ui.ps1
# Generates the Thaiba UI Full PRO project with all chunks (A-E) + extras (icons, persisted sidebar, page transitions).
# Usage: run from PowerShell in an empty folder where you want the project created.

$proj = "thaiba_ui_full_pro"
Write-Host "Creating project folder: $proj"
New-Item -ItemType Directory -Force -Path $proj | Out-Null

Set-Location $proj

# Helper to write files
function Write-File($path, $content) {
    $dir = Split-Path $path
    if ($dir -ne "") { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $content | Out-File -FilePath $path -Encoding utf8 -Force
    Write-Host "Wrote $path"
}

# -------------------------
# package.json
# -------------------------
Write-File "package.json" @"
{
  "name": "thaiba-ui-full-pro",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "firebase": "^10.7.0",
    "classnames": "^2.5.1",
    "react-icons": "^4.11.0",
    "framer-motion": "^10.12.7"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  }
}
"@

# -------------------------
# Vite + Tailwind + PostCSS
# -------------------------
Write-File "vite.config.js" @"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()]
})
"@

Write-File "postcss.config.js" @"
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
"@

Write-File "tailwind.config.js" @"
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        tg_dark1: '#0f172a',
        tg_dark2: '#020617'
      }
    }
  },
  plugins: []
}
"@

# -------------------------
# index.html
# -------------------------
Write-File "index.html" @"
<!doctype html>
<html lang='en'>
  <head>
    <meta charset='utf-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
    <title>Thaiba UI Full Pro</title>
  </head>
  <body class='bg-tg_dark1 text-white'>
    <div id='root'></div>
    <script type='module' src='/src/main.tsx'></script>
  </body>
</html>
"@

# -------------------------
# firebase: mock config + init
# -------------------------
Write-File "firebase/firebaseConfig.ts" @"
export const firebaseConfig = {
  apiKey: 'FAKE-API-KEY',
  authDomain: 'fake.firebaseapp.com',
  projectId: 'fake-project',
  storageBucket: 'fake.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:fakekey'
};
"@

Write-File "firebase/auth.ts" @"
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
"@

Write-File "firebase/roles.ts" @"
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './auth';

export type PrimaryRole = 'admin' | 'team' | 'guest';
export interface UserRole { role: PrimaryRole; tags: string[]; }

export async function getUserRole(uid: string): Promise<UserRole> {
  const ref = doc(db, 'roles', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as UserRole;
  return { role: 'guest', tags: [] };
}

export async function setUserRole(uid: string, role: UserRole) {
  const ref = doc(db, 'roles', uid);
  await setDoc(ref, role, { merge: true });
}
"@

# -------------------------
# src entry + styles directory
# -------------------------
Write-File "src/main.tsx" @"
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './routes/App'
import './styles/globals.css'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { NotificationProvider } from './context/NotificationContext'
import { TaskProvider } from './context/TaskContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <TaskProvider>
            <App />
          </TaskProvider>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
)
"@

Write-File "src/styles/globals.css" @"
@tailwind base;
@tailwind components;
@tailwind utilities;

:root { --bottom-nav-height: 26px; }

/* lighten/darken for .light/.dark on html root */
html.dark { background: #020617; color: #e6eef8; }
html.light { background: #ffffff; color: #111827; }

/* ensure main area above bottom nav */
body { padding-bottom: calc(var(--bottom-nav-height) + 60px); }

/* transition for sidebar */
@media (min-width: 768px) { aside { transition: width .22s ease; } }
@media (max-width: 480px) { .fab { bottom: 18px !important; width: 56px !important; height: 56px !important; } }
"@

# -------------------------
# contexts: Auth, Theme, Notification, Task
# -------------------------
Write-File "src/context/AuthContext.tsx" @"
import React, { createContext, useEffect, useState, useContext } from 'react';
import { auth, db } from '../../firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getUserRole } from '../../firebase/roles';

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<any>(null);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        setVerified(u.emailVerified);
        const roles = await getUserRole(u.uid);
        setRole(roles);
      } else {
        setUser(null);
        setRole(null);
        setVerified(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, verified, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
"@

Write-File "src/context/ThemeContext.tsx" @"
import React, { createContext, useEffect, useState, useContext } from 'react';

export const ThemeContext = createContext<any>(null);

export const ThemeProvider = ({ children }: any) => {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('light','dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
"@

Write-File "src/context/NotificationContext.tsx" @"
import React, { createContext, useContext, useEffect, useState } from 'react';
import { listenNotifications, pushNotification, deleteNotification } from '../services/notificationService';
import { db } from '../../firebase/auth';
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
"@

Write-File "src/context/TaskContext.tsx" @"
import React, { createContext, useContext, useEffect, useState } from 'react';
import { listenTasks } from '../services/taskService';

export const TaskContext = createContext<any>(null);

export const TaskProvider = ({ children }: any) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = listenTasks((all: any[]) => {
      setTasks(all);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <TaskContext.Provider value={{ tasks, loading }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);
"@

# -------------------------
# services: tasks & notifications
# -------------------------
Write-File "src/services/taskService.ts" @"
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/auth';
import { pushNotification } from './notificationService';

export const tasksRef = collection(db, 'tasks');

export function listenTasks(callback: Function) {
  const q = query(tasksRef, orderBy('createdAt','desc'));
  return onSnapshot(q, (snap) => {
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(all);
  });
}

export async function createTask(data: any) {
  data.createdAt = Date.now();
  data.updatedAt = Date.now();
  const res = await addDoc(tasksRef, data);

  await pushNotification({
    title: 'New task created',
    body: data.title,
    type: 'task',
    taskId: res.id,
    readBy: []
  });

  return res;
}

export async function updateTask(id: string, data: any) {
  data.updatedAt = Date.now();
  const ref = doc(db, 'tasks', id);
  await updateDoc(ref, data);

  await pushNotification({
    title: 'Task updated',
    body: data.title,
    type: 'task-update',
    taskId: id,
    readBy: []
  });
}

export async function deleteTask(id: string) {
  const ref = doc(db, 'tasks', id);
  await deleteDoc(ref);
}
"@

Write-File "src/services/notificationService.ts" @"
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/auth';

export const notifRef = collection(db, 'notifications');

export function listenNotifications(callback: Function) {
  const q = query(notifRef, orderBy('createdAt','desc'));
  return onSnapshot(q, (snap) => {
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(all);
  });
}

export async function pushNotification(data: any) {
  data.createdAt = Date.now();
  data.readBy = [];
  return await addDoc(notifRef, data);
}

export async function deleteNotification(id: string) {
  const ref = doc(db, 'notifications', id);
  await deleteDoc(ref);
}
"@

# -------------------------
# hooks
# -------------------------
Write-File "src/hooks/useWindowSize.tsx" @"
import { useEffect, useState } from 'react';

export default function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function onResize() { setSize({ width: window.innerWidth, height: window.innerHeight }); }
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return size;
}
"@

# -------------------------
# components: Layout, TopBar, BottomNav, Sidebar, Drawer, FABMenu, FAB, Task components, NotificationPanel
# -------------------------
Write-File "src/components/Layout.tsx" @"
import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import FABMenu from './FABMenu';
import Sidebar from './Sidebar';
import Drawer from './Drawer';
import useWindowSize from '../hooks/useWindowSize';

export default function Layout() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('sidebarCollapsed');
      return raw ? JSON.parse(raw) : false;
    } catch { return false; }
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const size = useWindowSize();

  useEffect(() => {
    if (size.width <= 768) setCollapsed(true);
  }, [size.width]);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  return (
    <div className='flex min-h-screen'>
      <div className='hidden md:block'>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((s)=>!s)} />
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className='flex-1 flex flex-col'>
        <TopBar />
        <main className='flex-1 p-4 max-w-6xl mx-auto w-full'>
          <div className='md:hidden mb-4'>
            <button className='px-3 py-2 bg-white/10 rounded' onClick={() => setDrawerOpen(true)}>Menu</button>
          </div>

          <Outlet />
        </main>

        <BottomNav />
        <FABMenu />
      </div>
    </div>
  );
}
"@

Write-File "src/components/TopBar.tsx" @"
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import NotificationPanel from './NotificationPanel';

export default function TopBar() {
  const { theme, setTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <header className='sticky top-0 z-50 bg-slate-900/80 backdrop-blur px-4 py-4 shadow flex justify-between items-center'>
      <h1 className='font-semibold text-lg'>Thaiba Garden Media Manager</h1>

      <div className='flex items-center gap-4'>
        <button className='relative' onClick={() => setOpen(!open)}>
          <span style={{ fontSize: 20 }}>🔔</span>
          {unreadCount > 0 && <span className='absolute -top-1 -right-1 bg-red-600 px-1.5 py-0.5 rounded-full text-xs'>{unreadCount}</span>}
        </button>

        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className='px-3 py-1 bg-white/10 rounded'>
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
      </div>

      <NotificationPanel open={open} onClose={() => setOpen(false)} />
    </header>
  );
}
"@

Write-File "src/components/BottomNav.tsx" @"
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import classNames from 'classnames';

export default function BottomNav() {
  const loc = useLocation();
  const items = [
    { name: 'Home', path: '/' },
    { name: 'Tasks', path: '/tasks' },
    { name: 'Events', path: '/events' },
    { name: 'Calendar', path: '/calendar' },
    { name: 'Profile', path: '/profile' }
  ];

  return (
    <nav className='fixed bottom-0 left-0 right-0 bg-slate-800 text-xs h-[26px] flex items-center justify-around'>
      {items.map((item) => (
        <Link key={item.path} to={item.path} className={classNames('px-2', loc.pathname === item.path && 'text-yellow-400 font-bold')}>
          {item.name}
        </Link>
      ))}
    </nav>
  );
}
"@

Write-File "src/components/Sidebar.tsx" @"
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import classNames from 'classnames';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiFileText, FiCalendar, FiUsers, FiSettings } from 'react-icons/fi';

export default function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void; }) {
  const loc = useLocation();
  const { role } = useAuth();

  const items: any[] = [
    { name: 'Home', path: '/', icon: <FiHome /> },
    { name: 'Tasks', path: '/tasks', icon: <FiFileText /> },
    { name: 'Events', path: '/events', icon: <FiCalendar /> },
    { name: 'Calendar', path: '/calendar', icon: <FiCalendar /> },
    { name: 'Reports', path: '/reports', icon: <FiFileText /> },
    { name: 'Profile', path: '/profile', icon: <FiUsers /> }
  ];

  if (role?.role === 'admin') {
    items.push({ name: 'Role Manager', path: '/admin/roles', icon: <FiUsers /> });
    items.push({ name: 'Create Notification', path: '/create-notif', icon: <FiFileText /> });
  }

  return (
    <motion.aside initial={false} animate={{ width: collapsed ? 72 : 220 }} className='bg-slate-900 border-r border-white/5 text-sm text-gray-200 h-full flex flex-col' style={{ minHeight: '100vh' }}>
      <div className='px-3 py-4 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 bg-indigo-600 rounded' />
          {!collapsed && <span className='font-semibold'>Thaiba</span>}
        </div>

        <button aria-label='Toggle sidebar' onClick={onToggle} className='p-1 rounded hover:bg-white/5'>
          {collapsed ? '»' : '«'}
        </button>
      </div>

      <nav className='flex-1 overflow-y-auto px-2 py-3 space-y-1'>
        {items.map((it) => (
          <Link key={it.path} to={it.path} className={classNames('flex items-center gap-3 px-3 py-2 rounded', loc.pathname === it.path ? 'bg-white/5 font-semibold' : 'hover:bg-white/2')}>
            <span className='w-6 text-center'>{it.icon}</span>
            {!collapsed && <span>{it.name}</span>}
          </Link>
        ))}
      </nav>

      <div className='px-3 py-4'>
        {!collapsed && <div className='text-xs opacity-70'>Version 1.0 • Thaiba Garden</div>}
      </div>
    </motion.aside>
  );
}
"@

Write-File "src/components/Drawer.tsx" @"
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Drawer({ open, onClose }: { open: boolean; onClose: () => void; }) {
  const { role } = useAuth();

  const items = [
    { name: 'Home', path: '/' },
    { name: 'Tasks', path: '/tasks' },
    { name: 'Events', path: '/events' },
    { name: 'Calendar', path: '/calendar' },
    { name: 'Reports', path: '/reports' },
    { name: 'Profile', path: '/profile' }
  ];

  if (role?.role === 'admin') items.push({ name: 'Role Manager', path: '/admin/roles' });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='fixed inset-0 bg-black/40 z-[60]' onClick={onClose} />
          <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween' }} className='fixed left-0 top-0 bottom-0 w-80 bg-slate-900 z-[70] p-4'>
            <div className='mb-6 flex items-center gap-3'>
              <div className='w-10 h-10 bg-indigo-600 rounded' />
              <div>
                <div className='font-semibold'>Thaiba Garden</div>
                <div className='text-xs opacity-70'>Media Manager</div>
              </div>
            </div>

            <nav className='flex flex-col gap-2'>
              {items.map(it => <Link key={it.path} to={it.path} onClick={onClose} className='px-3 py-2 rounded hover:bg-white/5'>{it.name}</Link>)}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
"@

Write-File "src/components/FABMenu.tsx" @"
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FABMenu() {
  const [open, setOpen] = useState(false);

  const actions = [
    { id: 'task', label: 'New Task', onClick: () => window.dispatchEvent(new CustomEvent('open-task-modal')) },
    { id: 'event', label: 'New Event', onClick: () => window.dispatchEvent(new CustomEvent('open-event-modal')) },
    { id: 'notif', label: 'Notify', onClick: () => window.dispatchEvent(new CustomEvent('open-notif-modal')) }
  ];

  return (
    <div className='fixed left-1/2 -translate-x-1/2 bottom-[20px] z-40'>
      <div className='relative'>
        <button onClick={() => setOpen(s => !s)} className='w-14 h-14 rounded-full bg-indigo-600 text-white shadow-xl flex items-center justify-center text-3xl' aria-label='Open FAB'>
          {open ? '×' : '+'}
        </button>

        <AnimatePresence>
          {open && (
            <motion.ul initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className='absolute bottom-20 left-1/2 -translate-x-1/2 w-48 flex flex-col gap-2 items-stretch'>
              {actions.map(a => (
                <motion.li key={a.id} whileTap={{ scale: 0.98 }}>
                  <button onClick={() => { a.onClick(); setOpen(false); }} className='w-full text-left px-4 py-2 rounded bg-white/6'>{a.label}</button>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
"@

Write-File "src/components/FAB.tsx" @"
import React from 'react';

export default function FAB() {
  return (
    <button className='fixed left-1/2 -translate-x-1/2 bottom-[40px] w-14 h-14 rounded-full bg-indigo-600 text-white text-3xl shadow-xl'>
      +
    </button>
  );
}
"@

Write-File "src/components/NotificationPanel.tsx" @"
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export default function NotificationPanel({ open, onClose }: any) {
  const { notifications, markRead, deleteNotification } = useNotifications();
  const { role } = useAuth();

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className='absolute right-4 top-16 w-80 bg-slate-800 border border-white/10 rounded-lg p-4 shadow-xl z-[200]'>
          <h3 className='font-semibold mb-3'>Notifications</h3>
          <div className='max-h-80 overflow-y-auto'>
            {notifications.length === 0 && <p className='opacity-50'>No notifications.</p>}
            {notifications.map(n => (
              <div key={n.id} className='p-3 mb-2 bg-white/10 rounded cursor-pointer' onClick={() => markRead(n)}>
                <p className='font-medium'>{n.title}</p>
                <p className='text-sm opacity-80'>{n.body}</p>
                {role?.role === 'admin' && <button className='text-xs text-red-400 mt-2' onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}>Delete</button>}
              </div>
            ))}
          </div>
          <div className='text-right mt-3'>
            <button className='text-sm opacity-70 hover:opacity-100' onClick={onClose}>Close</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
"@

# -------------------------
# Task components: TaskList, TaskCard, TaskModal, TaskFilters, Tasks page
# -------------------------
Write-File "src/components/TaskList.tsx" @"
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TaskCard from './TaskCard';

export default function TaskList({ tasks }: any) {
  return (
    <AnimatePresence>
      {tasks.map((task: any) => (
        <motion.div key={task.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
          <TaskCard task={task} />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
"@

Write-File "src/components/TaskCard.tsx" @"
import React, { useState } from 'react';
import { deleteTask } from '../services/taskService';
import TaskModal from './TaskModal';
import { useAuth } from '../context/AuthContext';

export default function TaskCard({ task }: any) {
  const { user, role } = useAuth();
  const [open, setOpen] = useState(false);

  const canEdit = role?.role === 'admin' || task.createdBy === user?.uid;
  const canDelete = role?.role === 'admin';

  const color = { low: 'bg-green-800', medium: 'bg-yellow-700', high: 'bg-orange-700', urgent: 'bg-red-700' }[task.priority];

  return (
    <>
      <div className='p-4 bg-slate-800 rounded-lg border border-white/10 mb-3'>
        <div className='flex justify-between'>
          <h3 className='font-semibold text-lg'>{task.title}</h3>
          <span className={`px-2 py-1 text-xs rounded ${color}`}>{task.priority}</span>
        </div>

        {task.description && <p className='opacity-80 mt-1'>{task.description}</p>}

        <div className='flex gap-3 mt-3 text-sm'>
          {canEdit && <button className='px-3 py-1 rounded bg-white/10' onClick={() => setOpen(true)}>Edit</button>}
          {canDelete && <button className='px-3 py-1 rounded bg-red-600' onClick={() => deleteTask(task.id)}>Delete</button>}
        </div>
      </div>

      <TaskModal open={open} edit={task} onClose={() => setOpen(false)} />
    </>
  );
}
"@

Write-File "src/components/TaskModal.tsx" @"
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createTask, updateTask } from '../services/taskService';
import { useAuth } from '../context/AuthContext';

export default function TaskModal({ open, onClose, edit }: any) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    if (edit) {
      setTitle(edit.title);
      setPriority(edit.priority || 'medium');
      setDesc(edit.description || '');
    } else {
      setTitle('');
      setPriority('medium');
      setDesc('');
    }
  }, [edit]);

  if (!open) return null;

  const save = async () => {
    const data: any = { title, priority, description: desc, status: 'pending', createdBy: user.uid, assignedTo: [] };
    if (edit) await updateTask(edit.id, data);
    else await createTask(data);
    onClose();
  };

  return (
    <div className='fixed inset-0 bg-black/40 backdrop-blur flex items-center justify-center z-[100]'>
      <motion.div initial={{ scale: .95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className='bg-slate-900 p-6 rounded-lg w-full max-w-md'>
        <h2 className='text-xl font-bold mb-4'>{edit ? 'Edit Task' : 'New Task'}</h2>

        <input className='w-full p-2 bg-white/20 rounded mb-3' placeholder='Task title' value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className='w-full p-2 bg-white/20 rounded mb-3' rows={3} placeholder='Description' value={desc} onChange={(e) => setDesc(e.target.value)} />
        <label className='block mb-2 font-semibold'>Priority</label>
        <select className='w-full p-2 bg-white/20 rounded mb-4' value={priority} onChange={(e) => setPriority(e.target.value)}><option>low</option><option>medium</option><option>high</option><option>urgent</option></select>

        <div className='flex justify-end gap-3'>
          <button className='px-4 py-2 bg-white/10 rounded' onClick={onClose}>Cancel</button>
          <button className='px-4 py-2 bg-indigo-600 rounded' onClick={save}>Save</button>
        </div>
      </motion.div>
    </div>
  );
}
"@

Write-File "src/components/TaskFilters.tsx" @"
import React from 'react';

export default function TaskFilters({ search, setSearch, priority, setPriority }: any) {
  return (
    <div className='flex flex-col md:flex-row gap-3 mb-4'>
      <input className='flex-1 p-2 bg-white/10 rounded' placeholder='Search tasks...' value={search} onChange={(e)=>setSearch(e.target.value)} />
      <select className='p-2 bg-white/10 rounded' value={priority} onChange={(e)=>setPriority(e.target.value)}>
        <option value=''>All</option>
        <option value='low'>Low</option>
        <option value='medium'>Medium</option>
        <option value='high'>High</option>
        <option value='urgent'>Urgent</option>
      </select>
    </div>
  );
}
"@

Write-File "src/routes/Tasks.tsx" @"
import React, { useEffect, useState } from 'react';
import { useTasks } from '../context/TaskContext';
import TaskList from '../components/TaskList';
import TaskModal from '../components/TaskModal';
import TaskFilters from '../components/TaskFilters';

export default function Tasks() {
  const { tasks, loading } = useTasks();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-task-modal', handler);
    return () => window.removeEventListener('open-task-modal', handler);
  }, []);

  let filtered = tasks;
  if (search) filtered = filtered.filter((t:any) => t.title.toLowerCase().includes(search.toLowerCase()));
  if (priority) filtered = filtered.filter((t:any) => t.priority === priority);

  return (
    <div>
      <h2 className='text-2xl font-bold mb-4'>Tasks</h2>

      <TaskFilters search={search} setSearch={setSearch} priority={priority} setPriority={setPriority} />

      {loading ? <p>Loading...</p> : <TaskList tasks={filtered} />}

      <TaskModal open={open} onClose={()=>setOpen(false)} edit={null} />

      <button className='fixed right-6 bottom-20 bg-indigo-600 px-4 py-2 rounded-full shadow-lg' onClick={()=>setOpen(true)}>+ New Task</button>
    </div>
  );
}
"@

# -------------------------
# pages: Home, Calendar, Events, Reports, Profile, Settings, RoleManager, CreateNotification, Login/Register/Forgot/Verify
# -------------------------
Write-File "src/routes/Home.tsx" @"
import React from 'react';

export default function Home() {
  return (
    <div>
      <h2 className='text-2xl font-bold mb-4'>Home</h2>
      <p>Welcome to the Thaiba Media Dashboard.</p>
    </div>
  );
}
"@

Write-File "src/routes/Calendar.tsx" @"
import React from 'react';
export default function Calendar(){ return <div><h2 className='text-2xl font-bold mb-4'>Calendar</h2><p>Your calendar here.</p></div> }
"@

Write-File "src/routes/Events.tsx" @"
import React from 'react';
export default function Events(){ return <div><h2 className='text-2xl font-bold mb-4'>Events</h2><p>Events list here.</p></div> }
"@

Write-File "src/routes/Reports.tsx" @"
import React from 'react';
export default function Reports(){ return <div><h2 className='text-2xl font-bold mb-4'>Reports</h2><p>Reports and analytics here.</p></div> }
"@

Write-File "src/routes/Profile.tsx" @"
import React from 'react';
export default function Profile(){ return <div><h2 className='text-2xl font-bold mb-4'>Profile</h2><p>User profile here.</p></div> }
"@

Write-File "src/routes/Settings.tsx" @"
import React from 'react';
export default function Settings(){ return <div><h2 className='text-2xl font-bold mb-4'>Settings</h2><p>System settings here.</p></div> }
"@

Write-File "src/routes/RoleManager.tsx" @"
import React, { useState } from 'react';
import { setUserRole } from '../../firebase/roles';
import { useAuth } from '../context/AuthContext';

export default function RoleManager() {
  const { role } = useAuth();
  if (role?.role !== 'admin') return <div className='p-6'>Access denied — admin only.</div>;

  const [uid, setUid] = useState('');
  const [primary, setPrimary] = useState('team');
  const [tags, setTags] = useState<string[]>([]);

  const toggleTag = (t: string) => setTags(old => old.includes(t) ? old.filter(x => x !== t) : [...old, t]);

  const update = async () => {
    await setUserRole(uid, { role: primary as any, tags });
    alert('Updated');
  };

  return (
    <div className='max-w-lg mx-auto p-6'>
      <h2 className='text-2xl font-bold mb-4'>Role Manager</h2>
      <input className='w-full p-2 bg-white/20 mb-3' placeholder='User UID' onChange={(e)=>setUid(e.target.value)} />
      <label className='block mb-2 font-semibold'>Primary Role</label>
      <select className='w-full p-2 mb-3 bg-white/20' onChange={(e)=>setPrimary(e.target.value)}>
        <option value='admin'>admin</option><option value='team'>team</option><option value='guest'>guest</option>
      </select>

      <label className='block mb-2 font-semibold'>Tags</label>
      <div className='flex flex-wrap gap-2 mb-3'>
        {['media','academics','it','principal','teacher','coordinator','volunteer','student'].map(t=>(
          <button key={t} onClick={()=>toggleTag(t)} className={'px-2 py-1 rounded ' + (tags.includes(t) ? 'bg-indigo-600' : 'bg-white/20')}>{t}</button>
        ))}
      </div>

      <button className='px-4 py-2 bg-green-600 rounded' onClick={update}>Update Role</button>
    </div>
  );
}
"@

Write-File "src/routes/CreateNotification.tsx" @"
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { pushNotification } from '../services/notificationService';

export default function CreateNotification(){
  const { role } = useAuth();
  if (role?.role !== 'admin') return <div className='p-6'>Admin only.</div>;
  const [title, setTitle] = useState(''); const [body, setBody] = useState('');
  const send = async () => { await pushNotification({ title, body, readBy: [] }); setTitle(''); setBody(''); alert('Sent'); };
  return (<div className='max-w-lg mx-auto p-6'><h2 className='text-2xl font-bold mb-4'>Send Notification</h2><input className='w-full p-2 bg-white/20 mb-3' placeholder='Title' value={title} onChange={e=>setTitle(e.target.value)} /><textarea className='w-full p-2 bg-white/20 mb-3' rows={3} value={body} onChange={e=>setBody(e.target.value)} /><button className='px-4 py-2 bg-indigo-600 rounded' onClick={send}>Send</button></div>);
}
"@

Write-File "src/routes/LoginPage.tsx" @"
import React, { useState } from 'react';
import { auth } from '../../firebase/auth';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Link } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [err, setErr] = useState('');
  const login = async () => { try { setErr(''); await signInWithEmailAndPassword(auth, email, password); } catch (e:any) { setErr(e.message); } };

  return (
    <div className='min-h-screen flex items-center justify-center p-6'>
      <div className='w-full max-w-sm bg-white/10 p-6 rounded shadow'>
        <h2 className='text-xl font-bold mb-4'>Login</h2>
        {err && <p className='text-red-400 mb-3'>{err}</p>}
        <input className='w-full mb-2 p-2 rounded bg-white/20' placeholder='Email' onChange={(e)=>setEmail(e.target.value)} />
        <input className='w-full mb-4 p-2 rounded bg-white/20' placeholder='Password' type='password' onChange={(e)=>setPassword(e.target.value)} />
        <button className='w-full py-2 bg-indigo-600 rounded' onClick={login}>Login</button>
        <div className='flex justify-between mt-3 text-sm opacity-80'>
          <Link to='/register'>Register</Link><Link to='/forgot'>Forgot Password?</Link>
        </div>
      </div>
    </div>
  );
}
"@

Write-File "src/routes/RegisterPage.tsx" @"
import React, { useState } from 'react';
import { auth } from '../../firebase/auth';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setUserRole } from '../../firebase/roles';

export default function RegisterPage() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const register = async () => { const u = await createUserWithEmailAndPassword(auth, email, password); await setUserRole(u.user.uid, { role: 'guest', tags: [] }); alert('Registered! Please verify your email.'); };
  return (
    <div className='min-h-screen flex items-center justify-center p-6'>
      <div className='w-full max-w-sm bg-white/10 p-6 rounded shadow'>
        <h2 className='text-xl font-bold mb-4'>Register</h2>
        <input className='w-full mb-2 p-2 rounded bg-white/20' placeholder='Email' onChange={(e)=>setEmail(e.target.value)} />
        <input className='w-full mb-4 p-2 rounded bg-white/20' placeholder='Password' type='password' onChange={(e)=>setPassword(e.target.value)} />
        <button className='w-full py-2 bg-indigo-600 rounded' onClick={register}>Register</button>
      </div>
    </div>
  );
}
"@

Write-File "src/routes/ForgotPassword.tsx" @"
import React, { useState } from 'react';
import { auth } from '../../firebase/auth';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function ForgotPassword(){ const [email, setEmail] = useState(''); const reset = async () => { await sendPasswordResetEmail(auth, email); alert('Reset email sent'); }; return (<div className='min-h-screen flex items-center justify-center p-6'><div className='w-full max-w-sm bg-white/10 p-6 rounded shadow'><h2 className='text-xl font-bold mb-4'>Reset Password</h2><input className='w-full mb-3 p-2 rounded bg-white/20' placeholder='Email' onChange={(e)=>setEmail(e.target.value)} /><button className='w-full py-2 bg-indigo-600 rounded' onClick={reset}>Send Reset Email</button></div></div>); }
"@

Write-File "src/routes/VerifyEmail.tsx" @"
import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
  const { requestVerification } = useAuth();
  return (
    <div className='p-6 text-center'>
      <h2 className='text-2xl font-bold mb-3'>Email not verified</h2>
      <p className='mb-4'>Please verify your email to continue.</p>
      <button onClick={requestVerification} className='px-6 py-2 bg-indigo-600 rounded text-white'>Send verification email</button>
    </div>
  );
}
"@

# -------------------------
# Protected route + AdminOnly
# -------------------------
Write-File "src/routes/Protected.tsx" @"
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Protected() {
  const { user, loading } = useAuth();
  if (loading) return <div className='p-6'>Loading...</div>;
  if (!user) return <Navigate to='/login' replace />;
  return <Outlet />;
}
"@

Write-File "src/routes/AdminOnly.tsx" @"
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminOnly({ children }: any) {
  const { role, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (role?.role !== 'admin') return <Navigate to='/' />;
  return children;
}
"@

# -------------------------
# Router with AnimatePresence & location key
# -------------------------
Write-File "src/routes/App.tsx" @"
import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import ForgotPassword from './ForgotPassword';
import VerifyEmail from './VerifyEmail';

import Home from './Home';
import Tasks from './Tasks';
import Events from './Events';
import Calendar from './Calendar';
import Reports from './Reports';
import Profile from './Profile';
import Settings from './Settings';
import RoleManager from './RoleManager';
import CreateNotification from './CreateNotification';

import Protected from './Protected';
import AdminOnly from './AdminOnly';

import { AnimatePresence } from 'framer-motion';

function RoutesWithAnimation() {
  const location = useLocation();
  return (
    <AnimatePresence mode='wait'>
      <Routes location={location} key={location.pathname}>
        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/forgot' element={<ForgotPassword />} />
        <Route path='/verify' element={<VerifyEmail />} />

        <Route element={<Protected />}>
          <Route element={<Layout />}>
            <Route path='/' element={<Home />} />
            <Route path='/tasks' element={<Tasks />} />
            <Route path='/events' element={<Events />} />
            <Route path='/calendar' element={<Calendar />} />
            <Route path='/reports' element={<Reports />} />
            <Route path='/profile' element={<Profile />} />
            <Route path='/settings' element={<Settings />} />
            <Route path='/admin/roles' element={<AdminOnly><RoleManager /></AdminOnly>} />
            <Route path='/create-notif' element={<AdminOnly><CreateNotification /></AdminOnly>} />
          </Route>
        </Route>

      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RoutesWithAnimation />
    </BrowserRouter>
  );
}
"@

# -------------------------
# tiny README
# -------------------------
Write-File "README.md" @"
# Thaiba UI Full PRO (Generated)

This folder contains a full React + Vite + Tailwind + Firebase starter built for Thaiba Garden Media Manager.

What's included:
- Vite + React
- Tailwind
- Firebase Auth & Firestore (mock config)
- Role system (primary role + tags)
- Tasks CRUD with real-time updates
- Notifications system with real-time updates
- Responsive layout (sidebar, drawer)
- FAB action menu
- Page transitions (AnimatePresence)
- LocalStorage persistence for theme and sidebar collapsed state

Next:
1. cd thaiba_ui_full_pro
2. npm install
3. Replace `firebase/firebaseConfig.ts` with your real Firebase config
4. npm run dev
"@

# -------------------------
# Install dependencies?
# -------------------------
Write-Host ""
Write-Host "Project files created in: $(Get-Location)\$proj"
Write-Host ""
Write-Host "Would you like the script to run 'npm install' now? (recommended)"
$yn = Read-Host "Run npm install now? (y/n)"
if ($yn -eq 'y' -or $yn -eq 'Y') {
    Write-Host "Installing npm packages (this may take a few minutes)..."
    npm install
    Write-Host "npm install finished. You can run 'npm run dev' to start the dev server."
} else {
    Write-Host "Skipping npm install. When ready, run 'npm install' inside the project folder and then 'npm run dev'."
}

Write-Host "Done. Replace firebase/firebaseConfig.ts with your Firebase config and run the app."
