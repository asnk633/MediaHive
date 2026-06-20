'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Calendar, 
    CheckSquare, 
    Briefcase, 
    Plus, 
    Zap,
    RefreshCcw,
    LayoutDashboard,
    GripVertical
} from 'lucide-react';
import { cn, nativeNavigate } from '@/lib/utils';
import { CanonicalDataService, OperationalSummary } from '@/services/canonicalDataService';
import { synergySyncManager } from '@/system/realtimeSync';
import { TodayEventsCard } from './TodayEventsCard';
import { TodayTasksCard } from './TodayTasksCard';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContextProvider';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Widget {
  id: string;
  type: 'events' | 'tasks';
}

const DEFAULT_LAYOUT: Widget[] = [
  { id: 'widget-events', type: 'events' },
  { id: 'widget-tasks', type: 'tasks' }
];

function SortableWidget({ widget, data, isLoading, router }: { widget: Widget; data: any; isLoading: boolean; router: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn("relative h-full min-h-[400px]", isDragging && "opacity-50")}>
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute top-4 right-4 z-20 cursor-grab active:cursor-grabbing p-1 bg-surface/80 rounded-md hover:bg-surface text-muted-foreground"
      >
        <GripVertical size={16} />
      </div>
      {widget.type === 'events' ? (
        <TodayEventsCard 
            events={data.events} 
            tasks={data.tasks}
            isLoading={isLoading} 
            onViewEvent={(id) => nativeNavigate(`/calendar?id=${id}`, router, 'ProductionDashboard (View Event)')}
        />
      ) : (
        <TodayTasksCard 
            tasks={data.tasks} 
            isLoading={isLoading} 
            onViewTask={(id) => nativeNavigate(`/tasks?id=${id}`, router, 'ProductionDashboard (View Task)')}
        />
      )}
    </div>
  );
}

export const ProductionDashboard: React.FC = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [data, setData] = useState<OperationalSummary>({
        events: [],
        tasks: [],
        crew: [],
        equipment: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_LAYOUT);

    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 5,
        },
      }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    );

    const loadLayout = useCallback(async () => {
      try {
        const res = await fetch('/api/dashboard/layout');
        if (res.ok) {
          const { layout } = await res.json();
          if (layout && Array.isArray(layout) && layout.length > 0) {
            setWidgets(layout);
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard layout", err);
      }
    }, []);

    const saveLayout = async (newLayout: Widget[]) => {
      try {
        await fetch('/api/dashboard/layout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ layout: newLayout }),
        });
      } catch (err) {
        console.error("Failed to save dashboard layout", err);
        toast.error("Failed to save layout");
      }
    };

    const fetchOperationalData = useCallback(async () => {
        setIsSyncing(true);
        try {
            const summary = await CanonicalDataService.getTodayOperationalSummary();
            setData(summary);
        } catch (error) {
            console.error('[ProductionDashboard] Fetch error:', error);
            toast.error('Failed to sync operational data');
        } finally {
            setIsLoading(false);
            setIsSyncing(false);
        }
    }, []);

    useEffect(() => {
        fetchOperationalData();
        loadLayout();

        // Real-time synchronization
        if (!user?.institution_id) return;

        const subscriptionId = `production-dashboard-${user.institution_id}`;
        
        const setupRealtime = async () => {
            await synergySyncManager.subscribe(
                subscriptionId,
                { table: '*', filter: `tenant_id=eq.${user.tenant_id}` }, // Broad sync for today's view
                () => {
                    console.log('[ProductionDashboard] Real-time update detected');
                    fetchOperationalData();
                }
            );
        };

        setupRealtime();

        return () => {
            synergySyncManager.unsubscribe(subscriptionId);
        };
    }, [user?.institution_id, user?.tenant_id, fetchOperationalData, loadLayout]);

    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        setWidgets((items) => {
          const oldIndex = items.findIndex((w) => w.id === active.id);
          const newIndex = items.findIndex((w) => w.id === over.id);

          const newLayout = arrayMove(items, oldIndex, newIndex);
          saveLayout(newLayout);
          return newLayout;
        });
      }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={widgets.map(w => w.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {widgets.map((widget) => (
                      <SortableWidget 
                        key={widget.id}
                        widget={widget}
                        data={data}
                        isLoading={isLoading}
                        router={router}
                      />
                    ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Footer Summary */}
            <div className="p-4 rounded-[18px] bg-foreground/[0.02] border border-foreground/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Zap size={14} className="text-amber-400" />
                    <span className="text-[11px] font-bold text-foreground/80 uppercase tracking-widest">
                        Live monitoring active for {user?.name || user?.fullName || 'Production'}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-foreground/80 uppercase tracking-widest">Connected</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
