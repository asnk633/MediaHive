"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Briefcase, PackageSearch } from 'lucide-react';
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
import { StructureService } from '@/services/structureService';
import { Department } from '@/types/structure';

export const DepartmentManagement = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    // Inline Edit/Create State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const [isCreating, setIsCreating] = useState(false);
    const [createName, setCreateName] = useState('');

    // Delete Confirmation State
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const { departments } = await StructureService.getDepartments(true);
            setDepartments(departments);
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

        setSaving('creating');
        try {
            await StructureService.createDepartment(createName);
            toast.success("Department created");
            setCreateName('');
            setIsCreating(false);
            fetchDepartments();
        } catch (e) {
            toast.error("Failed to create department");
        } finally {
            setSaving(null);
        }
    };

    const handleUpdate = async (id: string) => {
        if (!editName.trim()) return;

        setSaving(id);
        try {
            await StructureService.updateDepartment(id, { name: editName });
            toast.success("Department updated");
            setEditingId(null);
            fetchDepartments();
        } catch (e) {
            toast.error("Failed to update department");
        } finally {
            setSaving(null);
        }
    };

    const confirmDelete = async () => {
        if (!deleteConfirmId) return;

        const id = deleteConfirmId;
        setSaving(id);
        try {
            // Soft delete by archiving
            await StructureService.updateDepartment(id, { status: 'archived' });
            toast.success("Department archived");
            fetchDepartments();
        } catch (e) {
            console.error(e);
            toast.error("Failed to archive department");
        } finally {
            setSaving(null);
            setDeleteConfirmId(null);
        }
    };

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
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
                    <h2 className="text-xl font-semibold text-foreground">Departments</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">Manage specific departments</p>
                </div>
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-foreground px-4 py-2 rounded-lg transition-colors"
                    >
                        <Plus size={18} />
                        Add Department
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
                                placeholder="Enter department name..."
                                className="flex-1 bg-transparent border-none text-foreground focus:outline-none focus:ring-0 placeholder-white/30 text-lg font-medium"
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-3 py-1.5 text-sm rounded-lg hover:bg-foreground/10 text-foreground/70 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving === 'creating'}
                                    className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-foreground rounded-lg font-medium disabled:opacity-50"
                                >
                                    {saving === 'creating' ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}

                {loading ? (
                    <div className="text-foreground text-center py-8">Loading departments / institutions...</div>
                ) : departments.length === 0 ? (
                    <div className="text-foreground text-center py-8 bg-surface border border-soft rounded-2xl">
                        <PackageSearch className="w-12 h-12 text-foreground/80 mx-auto mb-3" />
                        <p>No departments / institutions found.</p>
                        <p className="mt-2">Create your first department / institution to get started.</p>
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
                                            className="flex-1 bg-foreground/5 border border-[#ffffff1a] rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-blue-500 transition-colors"
                                            placeholder="Department Name"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleUpdate(dept.id);
                                                if (e.key === 'Escape') setEditingId(null);
                                            }}
                                        />
                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="px-3 py-2 text-sm rounded-lg hover:bg-foreground/10 text-foreground/70 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleUpdate(dept.id)}
                                                disabled={saving === dept.id}
                                                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-foreground rounded-lg font-medium disabled:opacity-50"
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
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-foreground font-bold shrink-0">
                                            <Briefcase size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-foreground font-semibold text-lg">{dept.name}</h3>
                                            <p className="text-sm text-[var(--color-text-secondary)]">
                                                Created: {dept.created_at ? new Date(dept.created_at).toLocaleDateString('en-GB') : 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => startEdit(dept)}
                                            className="p-2 text-[var(--color-text-secondary)] hover:text-foreground hover:bg-[var(--color-bg-subtle)] rounded-lg transition-colors"
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
                <AlertDialogContent className="bg-[#1e293b] border-[#ffffff1a] text-foreground">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-foreground/60">
                            This action cannot be undone. This will permanently delete the department / institution
                            and all associated data. from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent text-foreground border-[#ffffff1a] hover:bg-foreground/5 hover:text-foreground">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-foreground border-none">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
