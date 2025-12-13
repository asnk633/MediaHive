import React from 'react';
import { Task } from '@/types/task';
import { format } from 'date-fns';
import { MoreVertical } from 'lucide-react';
import { TaskService } from '@/services/tasks';
import { useRole } from '@/app/(shell)/RoleContext';

interface TaskListViewProps {
    tasks: Task[];
    onTaskClick?: (task: Task) => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({ tasks, onTaskClick }) => {
    const { user } = useRole();
    const isAdmin = user?.role === 'admin';
    const isTeam = user?.role === 'team' || isAdmin; // Team can edit too

    const priorityColors: Record<string, string> = {
        high: 'text-red-600 bg-red-50',
        medium: 'text-orange-600 bg-orange-50',
        low: 'text-blue-600 bg-blue-50',
    };

    const statusColors: Record<string, string> = {
        todo: 'bg-gray-100 text-gray-600',
        'in-progress': 'bg-blue-100 text-blue-600',
        review: 'bg-purple-100 text-purple-600',
        done: 'bg-green-100 text-green-600',
    };

    const handleStatusUpdate = (e: React.MouseEvent, task: Task, newStatus: Task['status']) => {
        e.stopPropagation();
        TaskService.updateTask(task.id, { status: newStatus });
    };

    const [assignOpenForTask, setAssignOpenForTask] = React.useState<string | null>(null);

    // Mock members as per request
    const mockMembers = [
        { id: 'u3', name: 'Shukoor Rahman' },
        { id: 'u_anu', name: 'Anu Anwar' },
        { id: 'u_sab', name: 'Sabith Amjadi' },
        { id: 'u2', name: 'KMS Pallikkunnu' }, // Keeping previous mock too just in case
    ];

    const handleToggleAssign = (e: React.MouseEvent, task: Task, member: { id: string, name: string }) => {
        e.stopPropagation(); // Stop click from closing dropdown if it relies on bubbling
        // Use atomic transaction in service
        TaskService.toggleTaskAssignee(task.id, { uid: member.id, name: member.name });
    };

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const close = (e: MouseEvent) => {
            // Only close if the click target is NOT inside a dropdown or valid button
            // But since we stopPropagation on the dropdown items, this global listener 
            // primarily catches clicks *outside*.
            setAssignOpenForTask(null);
        };

        if (assignOpenForTask) {
            // Use timeoute to avoid immediate close from the opening click if it bubbles up
            setTimeout(() => window.addEventListener('click', close), 0);
        }
        return () => window.removeEventListener('click', close);
    }, [assignOpenForTask]);

    const handlePriorityUpdate = (e: React.MouseEvent, task: Task, newPriority: Task['priority']) => {
        e.stopPropagation();
        TaskService.updateTask(task.id, { priority: newPriority });
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-500">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-medium">
                        <tr>
                            <th className="px-6 py-4">Title</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Priority</th>
                            <th className="px-6 py-4">Due Date</th>
                            <th className="px-6 py-4">Assigned To</th>
                            <th className="px-6 py-4 sr-only">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tasks.map((task) => (
                            <tr
                                key={task.id}
                                className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                onClick={() => onTaskClick?.(task)}
                            >
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    <div className="max-w-xs truncate" title={task.title}>{task.title}</div>
                                    <div className="text-xs text-gray-400 max-w-xs truncate">{task.department}</div>
                                </td>
                                <td className="px-6 py-4">
                                    {isTeam ? (
                                        <div className="group/status relative inline-block">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer hover:ring-2 hover:ring-gray-200 ${statusColors[task.status]}`}>
                                                {task.status.replace('-', ' ')}
                                            </span>
                                            {/* Dropdown on Hover/Focus (Simplified for now, ideal specific dropdown comp) */}
                                            <div className="absolute top-full left-0 mt-1 w-32 bg-white rounded-lg shadow-xl border border-gray-100 hidden group-hover/status:block z-20">
                                                {Object.keys(statusColors).map((s) => (
                                                    <div
                                                        key={s}
                                                        onClick={(e) => handleStatusUpdate(e, task, s as any)}
                                                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer capitalize text-xs"
                                                    >
                                                        {s.replace('-', ' ')}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[task.status]}`}>
                                            {task.status.replace('-', ' ')}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {isTeam ? (
                                        <div className="group/priority relative inline-block">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer hover:ring-2 hover:ring-gray-200 ${priorityColors[task.priority]}`}>
                                                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                            </span>
                                            <div className="absolute top-full left-0 mt-1 w-24 bg-white rounded-lg shadow-xl border border-gray-100 hidden group-hover/priority:block z-20">
                                                {['low', 'medium', 'high'].map((p) => (
                                                    <div
                                                        key={p}
                                                        onClick={(e) => handlePriorityUpdate(e, task, p as any)}
                                                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer capitalize text-xs"
                                                    >
                                                        {p}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
                                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {task.dueDate?.seconds ? format(new Date(task.dueDate.seconds * 1000), 'MMM d, yyyy') : '-'}
                                </td>
                                <td className="px-6 py-4">
                                    {Array.isArray(task.assignedTo) && task.assignedTo.length > 0 ? (
                                        <div className="flex items-center gap-2 relative group/assign">
                                            <div className="flex -space-x-2 overflow-hidden">
                                                {task.assignedTo.map((assignee, i) => (
                                                    <div
                                                        key={i}
                                                        className="inline-block w-8 h-8 rounded-full ring-2 ring-white bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold"
                                                        title={assignee.name}
                                                    >
                                                        {assignee.name.charAt(0)}
                                                    </div>
                                                ))}
                                            </div>
                                            {isAdmin && <button onClick={(e) => { e.stopPropagation(); setAssignOpenForTask(task.id === assignOpenForTask ? null : task.id); }} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 ring-2 ring-white text-xs z-10">+</button>}

                                            {/* Assignment Dropdown */}
                                            {assignOpenForTask === task.id && (
                                                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-2">
                                                    <div className="text-xs font-semibold text-gray-400 px-2 py-1 mb-1">ASSIGN TO</div>
                                                    {mockMembers.map(m => {
                                                        const isAssigned = Array.isArray(task.assignedTo) && task.assignedTo.some(current => current.uid === m.id);
                                                        return (
                                                            <div
                                                                key={m.id}
                                                                onClick={(e) => handleToggleAssign(e, task, m)}
                                                                className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer text-sm ${isAssigned ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-700'}`}
                                                            >
                                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${isAssigned ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                                                                    {isAssigned && <span className="text-white text-[10px]">✓</span>}
                                                                </div>
                                                                {m.name}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        isAdmin ? (
                                            <div className="relative">
                                                <span
                                                    onClick={(e) => { e.stopPropagation(); setAssignOpenForTask(task.id === assignOpenForTask ? null : task.id); }}
                                                    className="text-blue-500 text-xs font-medium cursor-pointer hover:underline"
                                                >
                                                    Assign
                                                </span>
                                                {assignOpenForTask === task.id && (
                                                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-2">
                                                        <div className="text-xs font-semibold text-gray-400 px-2 py-1 mb-1">ASSIGN TO</div>
                                                        {mockMembers.map(m => {
                                                            const isAssigned = Array.isArray(task.assignedTo) && task.assignedTo.some(current => current.uid === m.id);
                                                            return (
                                                                <div
                                                                    key={m.id}
                                                                    onClick={(e) => handleToggleAssign(e, task, m)}
                                                                    className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer text-sm ${isAssigned ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-700'}`}
                                                                >
                                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isAssigned ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                                                                        {isAssigned && <span className="text-white text-[10px]">✓</span>}
                                                                    </div>
                                                                    {m.name}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        ) : <span className="text-gray-300 italic">Unassigned</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreVertical size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {tasks.length === 0 && (
                    <div className="p-8 text-center text-gray-400 italic">No tasks found</div>
                )}
            </div>
        </div>
    );
};
