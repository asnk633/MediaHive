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
