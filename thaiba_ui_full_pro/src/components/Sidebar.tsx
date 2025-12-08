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
          {collapsed ? 'Â»' : 'Â«'}
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
        {!collapsed && <div className='text-xs opacity-70'>Version 1.0 â€¢ Thaiba Garden</div>}
      </div>
    </motion.aside>
  );
}
