'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ListTodo, CalendarPlus, BellPlus } from 'lucide-react';

export function FAB() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { can, role } = usePermission();

  // Permission Checks
  const canCreateTask = can('create:tasks');
  const canCreateEvent = can('create:events');
  const canNotify = role === 'admin';

  const handleCreateTask = useCallback(() => {
    setIsOpen(false);
    router.push('/tasks/new');
  }, [router]);

  const handleCreateEvent = useCallback(() => {
    setIsOpen(false);
    router.push('/calendar?modal=new-event');
  }, [router]);

  const handleCreateNotification = useCallback(() => {
    setIsOpen(false);
    router.push('/notifications/new');
  }, [router]);

  // If user can't create anything, don't show FAB
  if (!canCreateTask && !canCreateEvent && !canNotify) return null;

  const menuItems = [
    {
      label: 'New Task',
      icon: ListTodo,
      onClick: handleCreateTask,
      visible: canCreateTask,
      color: 'text-blue-400',
      delay: 0.1
    },
    {
      label: 'New Event',
      icon: CalendarPlus,
      onClick: handleCreateEvent,
      visible: canCreateEvent,
      color: 'text-indigo-400',
      delay: 0.05
    },
    {
      label: 'Notify',
      icon: BellPlus,
      onClick: handleCreateNotification,
      visible: canNotify,
      color: 'text-amber-400',
      delay: 0
    }
  ].filter(item => item.visible);

  return (
    <>
      {/* overlay: only present and clickable when open */}
      <div
        className={`fixed inset-0 z-40 ${isOpen ? 'block' : 'hidden'}`}
        onClick={() => setIsOpen(false)}
        aria-hidden={!isOpen}
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      />
      
      {/* Fixed inset-0 pointer-events-none z-[60] flex items-end justify-center */}
      <div className="fixed inset-0 pointer-events-none z-[60] flex items-end justify-center pb-6">
        <div className="relative pointer-events-none">
          {/* menu items - still pointer-events-auto so they are clickable */}
          <AnimatePresence>
            {isOpen && (
              <div className="absolute -top-28 w-max flex flex-col items-center gap-3 pointer-events-auto">
                {menuItems.map((item, index) => (
                  <motion.a
                    key={item.label}
                    role="button"
                    tabIndex={0}
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                    transition={{ duration: 0.2, delay: item.delay }}
                    href={item.label === 'New Task' ? '/tasks/new' : item.label === 'New Event' ? '/calendar?modal=new-event' : '/notifications/new'}
                    className="fab-item"
                    onClick={(e) => {
                      e.preventDefault();
                      item.onClick();
                    }}
                    aria-label={item.label}
                  >
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <span>{item.label}</span>
                  </motion.a>
                ))}
              </div>
            )}
          </AnimatePresence>

          <button
            aria-expanded={isOpen}
            aria-controls="fab-menu"
            className="pointer-events-auto rounded-full w-20 h-20 grid place-items-center bg-purple-600 shadow-fab focus:outline-none focus:ring-4"
            onClick={() => setIsOpen(v => !v)}
          >
            <span className="sr-only">Open quick actions</span>
            <motion.div
              animate={{ rotate: isOpen ? 45 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <Plus size={28} color="white" />
            </motion.div>
          </button>
        </div>
      </div>
    </>
  );
}