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
