import React from 'react';
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task } from '@/types/task';
import { TaskCard } from './TaskCard';
import { TaskService } from '@/services/tasks';

interface KanbanBoardProps {
    tasks: Task[];
    onTaskClick?: (task: Task) => void;
}

const COLUMNS: { id: Task['status']; label: string }[] = [
    { id: 'todo', label: 'To Do' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'review', label: 'Review' },
    { id: 'done', label: 'Done' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onTaskClick }) => {
    const [activeId, setActiveId] = React.useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const onDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id as string;
        // The over.id could be a container ID (status) OR a task ID
        const overId = over.id as string;

        const activeTask = tasks.find(t => t.id === activeId);
        if (!activeTask) return;

        // Determine new status
        let newStatus: Task['status'] | undefined;

        // Check if dropped on a column container directly
        if (COLUMNS.some(c => c.id === overId)) {
            newStatus = overId as Task['status'];
        } else {
            // Dropped on another task, find that task's status
            const overTask = tasks.find(t => t.id === overId);
            if (overTask) {
                newStatus = overTask.status;
            }
        }

        if (newStatus && newStatus !== activeTask.status) {
            TaskService.updateTask(activeId, { status: newStatus });
        }
    };

    return (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <div className="flex overflow-x-auto pb-4 gap-6 h-full min-h-[calc(100vh-200px)]">
                {COLUMNS.map((col) => {
                    const colTasks = tasks.filter((t) => t.status === col.id);
                    return (
                        <Column
                            key={col.id}
                            col={col}
                            tasks={colTasks}
                            onTaskClick={onTaskClick}
                        />
                    );
                })}
            </div>
            <DragOverlay>
                {activeId ? (
                    <div className="opacity-80 rotate-2 cursor-grabbing">
                        {/* We pass a dummy 'drag' prop or similar, or just render Card. 
                             Ideally TaskCard handles its own look. 
                             We need to find the task data to render it. */}
                        <TaskCard task={tasks.find(t => t.id === activeId)!} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

// Sub-component for Column to use Droppable/Sortable
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const Column = ({ col, tasks, onTaskClick }: { col: typeof COLUMNS[0], tasks: Task[], onTaskClick?: (t: Task) => void }) => {
    const { setNodeRef } = useDroppable({
        id: col.id,
    });

    return (
        <div ref={setNodeRef} className="min-w-[280px] w-full max-w-xs flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="font-semibold text-[var(--text-secondary)] flex items-center gap-2">
                    {col.label}
                    <span className="bg-[var(--bg-panel)] text-[var(--text-secondary)] text-[10px] px-2 py-0.5 rounded-full border border-[var(--border-subtle)]">
                        {tasks.length}
                    </span>
                </h3>
            </div>

            <div className="flex-1 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl p-2 flex flex-col gap-3 border border-dashed border-[var(--border-subtle)] min-h-[150px]">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick?.(task)} />
                    ))}
                </SortableContext>
                {tasks.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-[var(--text-muted)] text-sm italic">
                        Empty
                    </div>
                )}
            </div>
        </div>
    );
};

const SortableTaskCard = ({ task, onClick }: { task: Task, onClick?: () => void }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskCard task={task} onClick={onClick} />
        </div>
    );
};
