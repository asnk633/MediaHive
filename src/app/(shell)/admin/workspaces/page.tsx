"use client";

import React, { useState, useEffect } from 'react';
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { AdminService } from '@/services/adminService';
import { StructureService } from '@/services/structureService';
import { Institution } from '@/types/structure';
import { 
    Search, 
    Loader2, 
    Building2, 
    Users, 
    Plus, 
    Settings2,
    CheckCircle2,
    XCircle,
    ChevronRight,
    Zap,
    Layout,
    Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const MODULES = [
    { key: 'tasks', label: 'Task Management', desc: 'To-do lists, assignments, and kanban.' },
    { key: 'events', label: 'Events & Calendar', desc: 'Scheduling, crew booking, and location tracking.' },
    { key: 'inventory', label: 'Equipment Inventory', desc: 'Resource tracking and rental management.' },
    { key: 'files', label: 'Digital Assets', desc: 'File storage and drive integration.' },
];

export default function WorkspacesPage() {
    const [workspaces, setWorkspaces] = useState<(Institution & { type: 'institution' | 'department' })[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    
    // Create State
    const [createOpen, setCreateOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);

    // Edit State
    const [editOpen, setEditOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editStatus, setEditStatus] = useState<'active' | 'archived'>('active');
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    
    // Delete Confirmation State
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const selectedWorkspace = workspaces.find(w => w.id === selectedId);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await AdminService.getAllWorkspaces();
            setWorkspaces(data);
            
            // Smarter selection: 
            // 1. If we have a selectedId, keep it if it's still in the data
            // 2. Otherwise, select the first VISIBLE workspace
            const stillExists = data.some(w => w.id === selectedId);
            if (!stillExists || !selectedId) {
                const visible = data.filter(w => showArchived || w.status !== 'archived');
                if (visible.length > 0) {
                    setSelectedId(visible[0].id);
                } else {
                    setSelectedId(null);
                }
            }
        } catch (error) {
            toast.error("Failed to load workspaces");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredWorkspaces = workspaces.filter(w => {
        const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase());
        const isVisible = showArchived || w.status !== 'archived';
        return matchesSearch && isVisible;
    });

    const handleToggleFeature = async (featureKey: string) => {
        if (!selectedWorkspace || saving) return;
        
        const currentFeatures = selectedWorkspace.features || {};
        const newFeatures = {
            ...currentFeatures,
            [featureKey]: !currentFeatures[featureKey]
        };

        setSaving(true);
        try {
            await AdminService.updateWorkspaceFeatures(selectedWorkspace.id, newFeatures, selectedWorkspace.type);
            // Optimistic update
            setWorkspaces(prev => prev.map(w => 
                w.id === selectedWorkspace.id ? { ...w, features: newFeatures } : w
            ));
            toast.success(`${featureKey} updated`);
        } catch (error) {
            toast.error("Failed to update features");
        } finally {
            setSaving(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || creating) return;

        setCreating(true);
        try {
            // Default to Institution unless name contains "Department" or user chooses?
            // For now, let's just make it a toggle in the UI later, but for this call:
            await StructureService.createInstitution(newName);
            toast.success("Department / Institution created");
            setNewName('');
            setCreateOpen(false);
            await fetchData();
        } catch (error: any) {
            console.error("Create error details:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                full: error
            });
            toast.error(error.message || "Failed to create Department / Institution");
        } finally {
            setCreating(false);
        }
    };

    const handleEdit = () => {
        if (!selectedWorkspace) return;
        setEditName(selectedWorkspace.name);
        setEditStatus(selectedWorkspace.status as 'active' | 'archived');
        setEditOpen(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedWorkspace || !editName.trim() || updating) return;

        setUpdating(true);
        try {
            const updateFn = selectedWorkspace.type === 'department' 
                ? StructureService.updateDepartment 
                : StructureService.updateInstitution;

            await (updateFn as any)(selectedWorkspace.id, {
                name: editName.trim(),
                status: editStatus
            });
            toast.success("Department / Institution updated");
            setEditOpen(false);
            await fetchData();
        } catch (error) {
            toast.error("Failed to update");
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedId || deleting) return;

        setDeleting(true);
        try {
            // Suffix name to allow reuse of the original name
            const timestamp = new Date().toLocaleDateString();
            const archivedName = `${selectedWorkspace?.name} (Archived ${timestamp})`;

            const updateFn = selectedWorkspace.type === 'department' 
                ? StructureService.updateDepartment 
                : StructureService.updateInstitution;

            await (updateFn as any)(selectedId, {
                name: archivedName,
                status: 'archived'
            });
            toast.success("Department / Institution archived successfully");
            setDeleteConfirmOpen(false);
            setEditOpen(false);
            setSelectedId(null);
            await fetchData();
        } catch (error) {
            toast.error("Failed to archive Department / Institution");
        } finally {
            setDeleting(false);
        }
    };

    const handlePermanentDelete = async () => {
        if (!selectedId || deleting) return;
        
        if (!window.confirm(`CRITICAL: Are you sure you want to PERMANENTLY DELETE ${selectedWorkspace?.name}? This action cannot be undone and may fail if there is linked data.`)) {
            return;
        }

        setDeleting(true);
        try {
            const deleteFn = selectedWorkspace.type === 'department' 
                ? StructureService.deleteDepartment 
                : StructureService.deleteInstitution;

            await (deleteFn as any)(selectedId);
            toast.success("Department / Institution permanently deleted");
            setDeleteConfirmOpen(false);
            setEditOpen(false);
            setSelectedId(null);
            await fetchData();
        } catch (error: any) {
            console.error("Delete error:", error);
            toast.error(error.message || "Failed to delete. Entity may have linked data (tasks, events, etc.)");
        } finally {
            setDeleting(false);
        }
    };

    const handleRestore = async () => {
        if (!selectedWorkspace || updating) return;

        setUpdating(true);
        try {
            // Attempt to remove the (Archived ...) suffix
            const restoredName = selectedWorkspace.name.replace(/\s\(Archived\s.*\)$/, '');

            const updateFn = selectedWorkspace.type === 'department' 
                ? StructureService.updateDepartment 
                : StructureService.updateInstitution;

            await (updateFn as any)(selectedWorkspace.id, {
                name: restoredName,
                status: 'active'
            });
            toast.success("Department / Institution restored successfully");
            await fetchData();
        } catch (error: any) {
            console.error("Restore error:", error);
            if (error.code === '23505') {
                toast.error("Original name is now taken. Rename it first.");
            } else {
                toast.error("Failed to restore");
            }
        } finally {
            setUpdating(false);
        }
    };

    return (
        <PageLayout mode="plain">
            <PageHeader
                title="Department / Institution Management"
                description="Manage organizational departments and their enabled features."
                actions={
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <button className="h-10 px-4 rounded-xl bg-indigo-500 text-white text-sm font-bold flex items-center gap-2 hover:bg-indigo-400 transition-colors">
                                <Plus size={16} /> New Department / Institution
                            </button>
                        </DialogTrigger>
                        <DialogContent className="bg-surface backdrop-blur-xl border-soft max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-foreground text-xl font-bold tracking-tight">New Department / Institution</DialogTitle>
                                <DialogDescription className="text-muted">
                                    Create a new workspace entity to isolate resources and manage team members.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-6 pt-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-white/40">Display Name</Label>
                                    <Input
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        placeholder="e.g. Media & IT Department"
                                        className="h-12 bg-white/5 border-white/10 text-white rounded-xl"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        onClick={() => setCreateOpen(false)} 
                                        disabled={creating}
                                        className="h-12 px-6 rounded-xl text-white/60 hover:text-white hover:bg-white/5"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={creating || !newName.trim()} 
                                        className="h-12 px-8 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold transition-all shadow-lg shadow-indigo-500/20"
                                    >
                                        {creating ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Creating...
                                            </div>
                                        ) : "Create Department / Institution"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                }
            />

            <div className="flex flex-col lg:flex-row gap-8 h-auto lg:h-[calc(100vh-16rem)] min-h-[500px]">
                {/* Left Panel: Workspace List */}
                <div className="w-full lg:w-[320px] flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                            <input
                                placeholder="Search departments & institutions..."
                                className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/5 rounded-2xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={() => setShowArchived(!showArchived)}
                            className={cn(
                                "ml-3 h-11 px-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest",
                                showArchived 
                                    ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400" 
                                    : "bg-white/5 border-white/5 text-white/40 hover:text-white/60"
                            )}
                        >
                            {showArchived ? "Hide Archived" : "Show Archived"}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-2 no-scrollbar max-h-[400px] lg:max-h-none">
                        {loading ? (
                            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-white/20" /></div>
                        ) : filteredWorkspaces.map(workspace => (
                            <button
                                key={workspace.id}
                                onClick={() => setSelectedId(workspace.id)}
                                className={cn(
                                    "w-full p-5 rounded-[28px] flex items-center gap-4 border transition-all text-left group",
                                    selectedId === workspace.id 
                                        ? "bg-white/10 border-white/10 shadow-lg" 
                                        : "bg-transparent border-transparent hover:bg-white/5"
                                )}
                            >
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                    <Building2 size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className={cn("text-sm font-bold truncate", selectedId === workspace.id ? "text-white" : "text-white/60")}>
                                            {workspace.name}
                                        </h4>
                                        <div className="flex gap-1">
                                            <span className={cn(
                                                "px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest",
                                                workspace.type === 'department' ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                            )}>
                                                {workspace.type}
                                            </span>
                                            {workspace.status === 'archived' && (
                                                <span className="px-1.5 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-[8px] font-black text-red-400 uppercase tracking-widest">
                                                    Archived
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-white/30 font-medium uppercase tracking-widest mt-0.5">
                                        <Users size={10} /> {workspace.userCount || 0} Members
                                    </div>
                                </div>
                                <ChevronRight size={14} className={cn("transition-transform", selectedId === workspace.id ? "text-indigo-400 translate-x-0" : "text-white/10 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0")} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Feature Toggles */}
                <div className="flex-1 flex flex-col rounded-[40px] glass-liquid border-white/5 overflow-hidden min-h-[600px] lg:min-h-0">
                    <AnimatePresence mode="wait">
                        {selectedId && selectedWorkspace ? (
                            <motion.div 
                                key={selectedId}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex-1 flex flex-col p-10 overflow-y-auto no-scrollbar"
                            >
                                <div className="flex items-start justify-between mb-10">
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 rounded-[28px] bg-indigo-500/10 flex items-center justify-center text-indigo-400 shadow-2xl">
                                            <Building2 size={40} />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black text-white tracking-tighter mb-1">{selectedWorkspace.name}</h2>
                                            <div className="flex gap-3">
                                                <div className={cn(
                                                    "px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest",
                                                    selectedWorkspace.type === 'department' ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                                )}>
                                                    Type: {selectedWorkspace.type}
                                                </div>
                                                <div className={cn(
                                                    "px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest",
                                                    selectedWorkspace.status === 'active' 
                                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                        : "bg-red-500/10 border-red-500/20 text-red-400"
                                                )}>
                                                    Status: {selectedWorkspace.status}
                                                </div>
                                                <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black text-white/40 uppercase tracking-widest">
                                                    ID: {selectedWorkspace.id}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {selectedWorkspace.status === 'archived' && (
                                            <button 
                                                onClick={handleRestore}
                                                disabled={updating}
                                                className="h-12 px-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-sm font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-2"
                                            >
                                                <CheckCircle2 size={16} />
                                                Restore Entity
                                            </button>
                                        )}
                                        <button 
                                            onClick={handleEdit}
                                            className="h-12 px-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-sm font-bold text-indigo-400 hover:bg-indigo-500/20 transition-all flex items-center gap-2"
                                        >
                                            <Settings2 size={16} />
                                            Edit Details
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="flex items-center justify-between px-2">
                                        <h3 className="text-sm font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                                            <Zap size={14} /> Feature Control Center
                                        </h3>
                                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Changes take effect immediately</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {MODULES.map((module) => {
                                            const isEnabled = selectedWorkspace.features?.[module.key] ?? true;
                                            return (
                                                <button
                                                    key={module.key}
                                                    onClick={() => handleToggleFeature(module.key)}
                                                    disabled={saving}
                                                    className={cn(
                                                        "p-6 rounded-[32px] border transition-all text-left flex items-start gap-5 group",
                                                        isEnabled 
                                                            ? "bg-white/[0.04] border-indigo-500/20" 
                                                            : "bg-transparent border-white/5 opacity-50 grayscale"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                                                        isEnabled ? "bg-indigo-500 text-white" : "bg-white/5 text-white/20"
                                                    )}>
                                                        <Settings2 size={24} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h4 className="text-sm font-bold text-white uppercase tracking-wider">{module.label}</h4>
                                                            {isEnabled ? <CheckCircle2 size={16} className="text-emerald-400" /> : <XCircle size={16} className="text-white/20" />}
                                                        </div>
                                                        <p className="text-xs text-white/40 font-medium leading-relaxed">{module.desc}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-8 p-6 rounded-[32px] bg-amber-500/5 border border-amber-500/10 flex items-center gap-5">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                            <Layout size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-amber-500/80 uppercase tracking-wider">Preview for Members</h4>
                                            <p className="text-xs text-amber-500/40 font-medium">Disabled modules will be hidden from the sidebar for all members of this institution.</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                                <Building2 size={64} className="text-white/5 mb-6" />
                                <h3 className="text-xl font-black text-white/20 uppercase tracking-tighter">Select a Department / Institution</h3>
                                <p className="text-sm text-white/10 mt-2 max-w-xs">Manage institutional settings and feature availability.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="bg-surface backdrop-blur-xl border-soft max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-foreground text-xl font-bold tracking-tight">Edit Details</DialogTitle>
                        <DialogDescription className="text-muted">
                            Update the name or status of this entity.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-6 pt-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-white/40">Display Name</Label>
                            <Input
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                className="h-12 bg-white/5 border-white/10 text-white rounded-xl"
                            />
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-6">
                            <button 
                                type="button"
                                onClick={() => setDeleteConfirmOpen(true)}
                                disabled={deleting}
                                className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-bold transition-colors group"
                            >
                                <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                                {deleting ? "Archiving..." : "Archive Entity"}
                            </button>

                            <div className="flex gap-3">
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    onClick={() => setEditOpen(false)} 
                                    disabled={updating}
                                    className="h-12 px-6 rounded-xl text-white/60 hover:text-white hover:bg-white/5"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={updating || !editName.trim()} 
                                    className="h-12 px-8 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold transition-all shadow-lg shadow-indigo-500/20"
                                >
                                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent className="bg-surface backdrop-blur-xl border-soft max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-foreground text-xl font-bold tracking-tight">Archive Department / Institution?</DialogTitle>
                        <DialogDescription className="text-muted">
                            Are you sure you want to archive <strong>{selectedWorkspace?.name}</strong>? 
                            This will hide it from active lists but preserve its data.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 pt-6">
                        <Button 
                            onClick={handleDelete}
                            disabled={deleting}
                            variant="secondary"
                            className="h-12 w-full rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all"
                        >
                            {deleting ? "Processing..." : "Archive Entity (Safe)"}
                        </Button>
                        
                        <Button 
                            onClick={handlePermanentDelete}
                            disabled={deleting}
                            className="h-12 w-full rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold transition-all shadow-lg shadow-red-500/20"
                        >
                            {deleting ? "Deleting..." : "Permanently Delete"}
                        </Button>

                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => setDeleteConfirmOpen(false)} 
                            disabled={deleting}
                            className="h-12 w-full rounded-xl text-white/40 hover:text-white hover:bg-white/5"
                        >
                            Cancel
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </PageLayout>
    );
}
