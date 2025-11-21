'use client';

import React, { useState, useCallback } from 'react';
import { Plus, ListTodo, CalendarPlus, X, BellPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function FAB() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { hasRole, user } = useAuth();

  // Role check based on the patch logic
  const canSeeEvent = hasRole(['admin', 'team']);
  const canSeeNotify = hasRole(['admin']);

  const handleCreateTask = useCallback(() => {
    setIsOpen(false);
    router.push('/tasks/new');
  }, [router]);

  const handleCreateEvent = useCallback(() => {
    setIsOpen(false);
    // Original component routed to '/calendar/new'
    router.push('/calendar/new'); 
  }, [router]);

  const handleCreateNotification = useCallback(() => {
    setIsOpen(false);
    router.push('/notifications/new');
  }, [router]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB Menu (centered over BottomNav) */}
      <div
        className="fixed left-1/2 transform -translate-x-1/2 z-50"
        style={{ bottom: "calc(var(--bottom-nav-height, 22px) + 2rem)" }}
      >
        <div
          className={cn(
            'flex flex-col-reverse gap-3 mb-3 transition-all duration-200',
            // Added pointer-events-auto when open to ensure buttons are clickable
            isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
          )}
        >
          {/* Create Task (Visible to all) */}
          <Button
            onClick={handleCreateTask}
            className="h-12 gap-2 shadow-lg"
            size="lg"
            data-testid="fab-new-task"
          >
            <ListTodo className="h-4 w-4" />
            <span>New Task</span>
          </Button>

          {/* Create Event - Only for Admin/Team */}
          {canSeeEvent && (
            <Button
              onClick={handleCreateEvent}
              className="h-12 gap-2 shadow-lg"
              size="lg"
              variant="secondary"
              data-testid="fab-new-event"
            >
              <CalendarPlus className="h-4 w-4" />
              <span>New Event</span>
            </Button>
          )}

          {/* Notify - Only for Admin (New Feature) */}
          {canSeeNotify && (
            <Button
              onClick={handleCreateNotification}
              className="h-12 gap-2 shadow-lg"
              size="lg"
              variant="secondary"
              data-testid="fab-notify"
            >
              <BellPlus className="h-4 w-4" />
              <span>Notify</span>
            </Button>
          )}
        </div>

        {/* Main FAB Button (visual: purple circular CTA) */}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          // remove size prop so className controls actual size
          className={cn(
            'h-14 w-14 rounded-full shadow-2xl transition-transform flex items-center justify-center',
            'bg-gradient-to-b from-purple-600 to-purple-500 text-white',
            'focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-300',
            isOpen && 'rotate-45'
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