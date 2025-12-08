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
          <span style={{ fontSize: 20 }}>ðŸ””</span>
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
