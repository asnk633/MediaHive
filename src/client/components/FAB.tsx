'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';

// Dynamic imports for icons to reduce bundle size
import dynamic from 'next/dynamic';

const Plus = dynamic(() => import('lucide-react').then(mod => mod.Plus), { ssr: false });
const ListTodo = dynamic(() => import('lucide-react').then(mod => mod.ListTodo), { ssr: false });
const CalendarPlus = dynamic(() => import('lucide-react').then(mod => mod.CalendarPlus), { ssr: false });
const X = dynamic(() => import('lucide-react').then(mod => mod.X), { ssr: false });
const BellPlus = dynamic(() => import('lucide-react').then(mod => mod.BellPlus), { ssr: false });

export function FAB() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { can, role } = usePermission();

  // Permission Checks
  const canCreateTask = can('create:tasks');
  const canCreateEvent = can('create:events');
  // Assuming 'create:notifications' or similar exists, or restricted to admin
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

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB Menu (centered over BottomNav) */}
      <div
        className="fixed left-1/2 transform -translate-x-1/2 z-50 fab-root"
        style={{ bottom: "calc(var(--bottom-nav-height, 22px) + 18px)" }}
      >
        <div
          className={cn(
            'flex flex-col-reverse gap-3 mb-3 transition-all duration-200 items-center',
            isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
          )}
        >
          {/* Create Task (Visible if permitted) */}
          {canCreateTask && (
            <Button
              onClick={handleCreateTask}
              className="h-12 w-auto px-6 gap-2 shadow-elevated rounded-full bg-surface text-text-primary hover:bg-surface/80 border border-white/10"
              data-testid="fab-new-task"
            >
              <ListTodo className="h-4 w-4 text-primary" />
              <span>New Task</span>
            </Button>
          )}

          {/* Create Event - Only for permitted roles */}
          {canCreateEvent && (
            <Button
              onClick={handleCreateEvent}
              className="h-12 w-auto px-6 gap-2 shadow-elevated rounded-full bg-surface text-text-primary hover:bg-surface/80 border border-white/10"
              data-testid="fab-new-event"
            >
              <CalendarPlus className="h-4 w-4 text-accent" />
              <span>New Event</span>
            </Button>
          )}

          {/* Notify - Only for Admin */}
          {canNotify && (
            <Button
              onClick={handleCreateNotification}
              className="h-12 w-auto px-6 gap-2 shadow-elevated rounded-full bg-surface text-text-primary hover:bg-surface/80 border border-white/10"
              data-testid="fab-notify"
            >
              <BellPlus className="h-4 w-4 text-yellow-500" />
              <span>Notify</span>
            </Button>
          )}
        </div>

        {/* Main FAB Button */}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'h-14 w-14 rounded-full shadow-glow transition-transform flex items-center justify-center',
            'bg-gradient-to-b from-primary to-primary/80 text-white border border-white/20',
            'focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30',
            isOpen && 'rotate-45 bg-surface border-white/10 text-text-muted'
          )}
          aria-label={isOpen ? "Close create menu" : "Open create menu"}
          data-testid="fab-open"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </Button>
      </div>
    </>
  );
}