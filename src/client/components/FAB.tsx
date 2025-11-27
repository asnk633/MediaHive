'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ListTodo, CalendarPlus, BellPlus } from 'lucide-react';
import { addFocusVisibleClass, setButtonAriaAttributes, setMenuAriaAttributes, setMenuItemAriaAttributes } from '@/utils/a11y';

export function FAB() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { can, role } = usePermission();
  const fabRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Permission Checks
  const canCreateTask = can('create:tasks');
  const canCreateEvent = can('create:events');
  const canNotify = role === 'admin';

  // Set up focus visible class for keyboard navigation detection
  useEffect(() => {
    if (fabRef.current) {
      addFocusVisibleClass(fabRef.current);
      setButtonAriaAttributes(fabRef.current, {
        expanded: isOpen,
        controls: 'fab-menu',
        label: 'Open quick actions'
      });
    }

    if (menuRef.current) {
      setMenuAriaAttributes(menuRef.current, {
        labelledBy: 'fab-button',
        orientation: 'vertical'
      });
    }
  }, [isOpen]);

  const handleCreateTask = useCallback(() => {
    setIsOpen(false);
    router.push('/tasks/new');
  }, [router]);

  const handleCreateEvent = useCallback(() => {
    setIsOpen(false);
    router.push('/events/new');
  }, [router]);

  const handleCreateNotification = useCallback(() => {
    setIsOpen(false);
    router.push('/notifications/new');
  }, [router]);

  // If user can't create anything, don't show FAB
  if (!canCreateTask && !canCreateEvent && !canNotify) return null;

  const menuItems = [
    {
      label: 'Notify',
      icon: BellPlus,
      onClick: handleCreateNotification,
      visible: canNotify,
      color: 'text-amber-400',
      delay: 0
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
      label: 'New Task',
      icon: ListTodo,
      onClick: handleCreateTask,
      visible: canCreateTask,
      color: 'text-blue-400',
      delay: 0.1
    }
  ].filter(item => item.visible);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }

    // Handle arrow keys for menu navigation
    if (isOpen && menuRef.current) {
      const menuItems = menuRef.current.querySelectorAll('[role="menuitem"]');
      if (menuItems.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const currentIndex = Array.from(menuItems).findIndex(item => item === document.activeElement);
          const nextIndex = (currentIndex + 1) % menuItems.length;
          (menuItems[nextIndex] as HTMLElement).focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const currentIndex = Array.from(menuItems).findIndex(item => item === document.activeElement);
          const prevIndex = (currentIndex - 1 + menuItems.length) % menuItems.length;
          (menuItems[prevIndex] as HTMLElement).focus();
        }
      }
    }
  };

  return (
    <>
      {/* overlay: only present and clickable when open */}
      <div
        className={`fixed inset-0 z-40 ${isOpen ? 'block' : 'hidden'}`}
        onClick={() => setIsOpen(false)}
        aria-hidden={!isOpen}
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      />

      {/* FAB wrapper - centered and positioned above BottomNav */}
      <div className="fab-wrap">
        <div className="relative">
          {/* menu items - still pointer-events-auto so they are clickable */}
          <AnimatePresence>
            {isOpen && (
              <div
                ref={menuRef}
                id="fab-menu"
                className="absolute -top-28 w-max flex flex-col items-center gap-3"
                role="menu"
                aria-label="Quick actions menu"
              >
                {menuItems.map((item, index) => (
                  <motion.a
                    key={item.label}
                    role="menuitem"
                    tabIndex={0}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.26, delay: item.delay }}
                    href={item.label === 'New Task' ? '/tasks/new' : item.label === 'New Event' ? '/calendar?modal=new-event' : '/notifications/new'}
                    className="fab-item"
                    onClick={(e) => {
                      e.preventDefault();
                      item.onClick();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        item.onClick();
                      } else if (e.key === 'Escape') {
                        setIsOpen(false);
                        // Return focus to FAB button
                        if (fabRef.current) {
                          fabRef.current.focus();
                        }
                      }
                    }}
                    aria-label={item.label}
                    ref={(el) => {
                      if (el) {
                        setMenuItemAriaAttributes(el);
                      }
                    }}
                  >
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <span>{item.label}</span>
                  </motion.a>
                ))}
              </div>
            )}
          </AnimatePresence>

          <button
            ref={fabRef}
            id="fab-button"
            aria-haspopup="menu"
            aria-expanded={isOpen}
            aria-controls="fab-menu"
            className="fab focus:outline-none"
            onClick={() => {
              console.log('FAB clicked, toggling open state', !isOpen);
              setIsOpen(v => !v);
            }}
            onKeyDown={handleKeyDown}
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
