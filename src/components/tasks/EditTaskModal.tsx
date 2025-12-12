import React, { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { TaskService } from '@/services/tasks';
import { Timestamp } from 'firebase/firestore';
import { useRole } from '@/app/(shell)/RoleContext';
import { X } from 'lucide-react';
import { format } from 'date-fns';

interface EditTaskModalProps {
    task: Task;
    isOpen: boolean;
    onClose: () => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, isOpen, onClose }) => {
    const { user } = useRole();
    const isAdmin = user?.role === 'admin';
    const isTeam = user?.role === 'team';

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'todo',
        priority: 'low',
        dueDate: '',
        department: '',
        assignedToIds: [] as string[]
    });

    // Mock members (should be fetched ideally, reusing mock for consistency with NewTaskPage)
    const mockMembers = [
        { id: 'u2', name: 'KMS Pallikkunnu' },
        { id: 'u3', name: 'Shukoor Rahman' },
        { id: 'u4', name: 'Sarah Designer' },
        { id: 'u_anu', name: 'Anu Anwar' },
        { id: 'u_sab', name: 'Sabith Amjadi' },
    ];

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                status: task.status || 'todo',
                priority: task.priority || 'low',
                dueDate: task.dueDate?.seconds ? format(new Date(task.dueDate.seconds * 1000), 'yyyy-MM-dd') : '',
                department: task.department || '',
                assignedToIds: Array.isArray(task.assignedTo) ? task.assignedTo.map(u => u.uid) : []
            });
        }
    }, [task]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let finalAssignees = [...(task.assignedTo || [])];

            // If Admin/Team changed assignees
            if (isAdmin || isTeam) { // Team can probably self-assign? keeping simple: Admin full control
                finalAssignees = formData.assignedToIds.map(id => {
                    const m = mockMembers.find(mm => mm.id === id);
                    if (m) return { uid: m.id, name: m.name };
                    // Retain existing if not in mock (legacy)
                    const existing = task.assignedTo?.find(u => u.uid === id);
                    return existing || null;
                }).filter(Boolean) as any[];
            }

            await TaskService.updateTask(task.id, {
                title: formData.title,
                description: formData.description,
                status: formData.status as any,
                priority: formData.priority as any,
                dueDate: formData.dueDate ? Timestamp.fromDate(new Date(formData.dueDate)) : task.dueDate,
                department: formData.department,
                assignedTo: finalAssignees
            });
            onClose();
        } catch (e) {
            console.error(e);
            alert("Failed to update task");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col border border-[var(--border-subtle)]">
                <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-card)]">
                    <h3 className="font-bold text-lg text-[var(--text-primary)]">Edit Task</h3>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--bg-panel)] rounded-full transition-colors text-[var(--text-primary)]"><X size={20} /></button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <form id="edit-task-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Title</label>
                            <input
                                className="w-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-[var(--text-primary)]"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Description</label>
                            <textarea
                                className="w-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-[var(--text-primary)]"
                                rows={3}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Status</label>
                                <select
                                    className="w-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-2 text-sm text-[var(--text-primary)]"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="todo">To Do</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="review">Review</option>
                                    <option value="done">Done</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Priority</label>
                                <select
                                    className="w-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-2 text-sm text-[var(--text-primary)]"
                                    value={formData.priority}
                                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Due Date</label>
                            <input
                                type="date"
                                className="w-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-2 text-sm text-[var(--text-primary)]"
                                value={formData.dueDate}
                                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                        </div>

                        {/* Assignee - Admin Only for now, roughly matching New Task */}
                        {isAdmin && (
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Assigned To</label>
                                <div className="space-y-2 max-h-32 overflow-y-auto border border-[var(--border-subtle)] p-2 rounded-lg bg-[var(--bg-panel)]">
                                    {mockMembers.map(m => (
                                        <label key={m.id} className="flex items-center gap-2 cursor-pointer hover:bg-[var(--bg-card)] p-1 rounded">
                                            <input
                                                type="checkbox"
                                                checked={formData.assignedToIds.includes(m.id)}
                                                onChange={e => {
                                                    if (e.target.checked) setFormData(prev => ({ ...prev, assignedToIds: [...prev.assignedToIds, m.id] }));
                                                    else setFormData(prev => ({ ...prev, assignedToIds: prev.assignedToIds.filter(id => id !== m.id) }));
                                                }}
                                                className="rounded text-blue-600 focus:ring-blue-500 bg-[var(--bg-card)] border-[var(--border-subtle)]"
                                            />
                                            <span className="text-sm text-[var(--text-primary)]">{m.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Cancel</button>
                    <button
                        form="edit-task-form"
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md transition-all disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};
