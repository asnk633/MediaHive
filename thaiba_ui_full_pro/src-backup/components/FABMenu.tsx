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
          {open ? 'Ã—' : '+'}
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
