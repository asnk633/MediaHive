"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Briefcase } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Department = {
    id: number;
    name: string;
    created_at: string;
};

export const DepartmentManagement = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<number | null>(null);

    // Inline Edit/Create State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');

    const [isCreating, setIsCreating] = useState(false);
    const [createName, setCreateName] = useState('');

    // Delete Confirmation State
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const data = await apiClient('/api/departments?limit=1000', { method: 'GET' });
            setDepartments(data);
        } catch (e) {
            console.error("Failed to fetch departments", e);
            toast.error("Failed to load departments");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createName.trim()) return;

        setSaving(-1);
        try {
            await apiClient('/api/departments', {
                method: 'POST',
                body: JSON.stringify({ name: createName })
            });
            toast.success("Office / Unit created");
            setCreateName('');
            setIsCreating(false);
            fetchDepartments();
        } catch (e) {
            toast.error("Failed to create office / unit");
        } finally {
            setSaving(null);
        }
    };

    const handleUpdate = async (id: number) => {
        if (!editName.trim()) return;

        setSaving(id);
        try {
            await apiClient(`/api/departments?id=${id}`, {
                method: 'PUT',
                body: JSON.stringify({ name: editName })
            });
            toast.success("Office / Unit updated");
            setEditingId(null);
            fetchDepartments();
        } catch (e) {
            toast.error("Failed to update office / unit");
        } finally {
            setSaving(null);
        }
    };

    const confirmDelete = async () => {
        if (!deleteConfirmId) return;

        const id = deleteConfirmId;
        setSaving(id);
        try {
            await apiClient(`/api/departments?id=${id}`, {
                method: 'DELETE'
            });
            toast.success("Office / Unit deleted");
            fetchDepartments();
        } catch (e) {
            console.error(e);
            toast.error("Failed to delete office / unit");
        } finally {
            setSaving(null);
            setDeleteConfirmId(null);
        }
    };

    const handleDeleteClick = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteConfirmId(id);
    };

    const startEdit = (dept: Department) => {
        setEditingId(dept.id);
        setEditName(dept.name);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-white">Offices / Units</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">Manage specific offices / units</p>
                </div>
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        <Plus size={18} />
                        Add Office / Unit
                    </button>
                )}
            </div>

            <div className="grid gap-3">
                {/* Creation Row */}
                {isCreating && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[var(--color-bg-surface)] border border-indigo-500/50 rounded-[20px] p-4 flex items-center gap-4 shadow-lg ring-1 ring-indigo-500/20"
                    >
                        <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <Plus size={20} />
                        </div>
                        <form onSubmit={handleCreate} className="flex-1 flex gap-3 items-center">
                            <input
                                autoFocus
                                value={createName}
                                onChange={(e) => setCreateName(e.target.value)}
                                placeholder="Enter office / unit name..."
                                className="flex-1 bg-transparent border-none text-white focus:outline-none focus:ring-0 placeholder-white/30 text-lg font-medium"
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-3 py-1.5 text-sm rounded-lg hover:bg-white/10 text-white/70 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving === -1}
                                    className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium disabled:opacity-50"
                                >
                                    {saving === -1 ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}

                {loading ? (
                    <div className="text-white text-center py-8">Loading offices / units...</div>
                ) : departments.length === 0 && !isCreating ? (
                    <div className="text-center py-12 text-[var(--color-text-secondary)] bg-[var(--color-bg-surface)] rounded-[20px] border border-[var(--color-border)]">
                        <Briefcase className="mx-auto mb-4" size={48} />
                        <p>No offices / units found.</p>
                        <p className="mt-2">Create your first office / unit to get started.</p>
                    </div>
                ) : (
                    departments.map((dept) => (
                        <motion.div
                            key={dept.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`bg-[var(--color-bg-surface)] border rounded-[20px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${editingId === dept.id ? 'border-blue-500/50 ring-1 ring-blue-500/20' : 'border-[var(--color-border)]'}`}
                        >
                            {editingId === dept.id ? (
                                /* Inline Editing Mode */
                                <div className="flex-1 flex items-center gap-4 w-full">
                                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                                        <Edit size={20} />
                                    </div>
                                    <div className="flex-1 flex flex-col md:flex-row gap-3 w-full">
                                        <input
                                            autoFocus
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="flex-1 bg-white/5 border border-[#ffffff1a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                            placeholder="Office / Unit Name"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleUpdate(dept.id);
                                                if (e.key === 'Escape') setEditingId(null);
                                            }}
                                        />
                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="px-3 py-2 text-sm rounded-lg hover:bg-white/10 text-white/70 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleUpdate(dept.id)}
                                                disabled={saving === dept.id}
                                                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50"
                                            >
                                                {saving === dept.id ? 'Saving...' : 'Save'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* View Mode */
                                <>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                                            <Briefcase size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-semibold text-lg">{dept.name}</h3>
                                            <p className="text-sm text-[var(--color-text-secondary)]">
                                                Created: {new Date(dept.created_at).toLocaleDateString('en-GB')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => startEdit(dept)}
                                            className="p-2 text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-bg-subtle)] rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteClick(dept.id, e)}
                                            disabled={saving === dept.id}
                                            className="p-2 text-[var(--color-text-secondary)] hover:text-red-400 hover:bg-[var(--color-bg-subtle)] rounded-lg transition-colors disabled:opacity-50"
                                            title="Delete"
                                        >
                                            {saving === dept.id ? (
                                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <Trash2 size={18} />
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    ))
                )}
            </div>

            <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                <AlertDialogContent className="bg-[#1e293b] border-[#ffffff1a] text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                            This action cannot be undone. This will permanently delete the office / unit
                            and remove it from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent text-white border-[#ffffff1a] hover:bg-white/5 hover:text-white">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white border-none">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
