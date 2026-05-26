"use client";

import React, { useState, useEffect } from 'react';
import { StructureService } from '@/services/structureService';
import { Department } from '@/types/structure';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Archive, Loader2, Users, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export function DepartmentsTab() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);

    // Edit State
    const [editOpen, setEditOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [editName, setEditName] = useState('');
    const [saving, setSaving] = useState(false);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDept || !editName.trim()) return;

        setSaving(true);
        try {
            await StructureService.updateDepartment(editingDept.id, { name: editName });
            toast.success("Department name updated");
            setEditOpen(false);
            fetchDepartments();
        } catch (error) {
            toast.error("Failed to update department");
        } finally {
            setSaving(false);
        }
    };

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const data = await StructureService.getDepartments(true);
            setDepartments(data.departments || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load departments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        setCreating(true);
        try {
            await StructureService.createDepartment(newName);
            toast.success("Department created");
            setNewName('');
            setCreateOpen(false);
            fetchDepartments();
        } catch (error) {
            toast.error("Failed to create department");
        } finally {
            setCreating(false);
        }
    };

    const handleStatusToggle = async (id: string, currentStatus: 'active' | 'archived') => {
        const newStatus = currentStatus === 'active' ? 'archived' : 'active';
        try {
            await StructureService.updateDepartment(id, { status: newStatus });
            toast.success(`Department ${newStatus === 'active' ? 'activated' : 'archived'}`);
            fetchDepartments();
        } catch (error) {
            toast.error("Status update failed");
        }
    };

    const handlePermanentDelete = async (id: string, name: string) => {
        if (!window.confirm(`CRITICAL: Are you sure you want to PERMANENTLY DELETE the department "${name}"? This will fail if users or entities are still assigned to it.`)) {
            return;
        }

        try {
            await StructureService.deleteDepartment(id);
            toast.success("Department permanently deleted");
            fetchDepartments();
        } catch (error: any) {
            console.error("Delete error:", error);
            toast.error(error.message || "Failed to delete department. Check for linked data.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-foreground">Departments</h3>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <button className="h-10 px-6 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-all duration-200 active:scale-95 shadow-lg shadow-primary/20">
                            <Plus className="w-4 h-4" /> Add Department
                        </button>
                    </DialogTrigger>
                    <DialogContent className="glass-liquid border border-foreground/10 p-6 rounded-[32px] shadow-2xl backdrop-blur-xl max-w-md w-full">
                        <DialogHeader>
                            <DialogTitle className="text-foreground text-xl font-bold">New Department</DialogTitle>
                            <DialogDescription className="text-slate-400 text-sm font-medium mt-1 leading-relaxed">
                                Create a new global department for user assignment.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-5 pt-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300 text-xs font-bold uppercase tracking-wider">Name</Label>
                                <Input
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="e.g. Media Team"
                                    className="w-full h-11 pl-4 pr-4 bg-foreground/[0.03] border border-foreground/10 rounded-full text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-all"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} disabled={creating} className="rounded-full px-5 py-2 text-xs font-bold text-foreground/70 hover:bg-foreground/5 transition-all duration-200">Cancel</Button>
                                <Button type="submit" disabled={creating} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 py-2 transition-all duration-200 active:scale-95 shadow-lg shadow-primary/20 text-xs font-bold">
                                    {creating ? "Creating..." : "Create"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {departments.map(dept => (
                        <div key={dept.id} className="glass-liquid border border-foreground/10 p-5 rounded-[24px] flex flex-col justify-between gap-6 shadow-lg backdrop-blur-md hover:bg-foreground/[0.03] hover:shadow-primary/5 hover:border-foreground/20 transition-all duration-300">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-inner shrink-0">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-foreground font-bold text-base leading-snug">{dept.name}</h4>
                                        <div className={`text-[10px] font-black uppercase tracking-wider mt-1.5 inline-flex items-center px-3 py-1 rounded-full ${dept.status === 'active' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                                            {dept.status}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-3 border-t border-foreground/5 gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setEditingDept(dept);
                                        setEditName(dept.name);
                                        setEditOpen(true);
                                    }}
                                    className="text-foreground/60 hover:text-foreground hover:bg-foreground/5 rounded-full px-4 py-1.5 transition-all text-xs font-bold"
                                >
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleStatusToggle(dept.id, dept.status)}
                                    className={dept.status === 'active' ? "text-foreground/60 hover:text-foreground hover:bg-foreground/5 rounded-full px-4 py-1.5 transition-all text-xs font-bold" : "text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-full px-4 py-1.5 transition-all text-xs font-bold"}
                                >
                                    <Archive className="w-4 h-4 mr-2" />
                                    {dept.status === 'active' ? 'Archive' : 'Activate'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePermanentDelete(dept.id, dept.name)}
                                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-full px-4 py-1.5 transition-all text-xs font-bold"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))}
                    {departments.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-16 text-center border border-dashed border-foreground/10 rounded-[28px] bg-foreground/[0.01] glass-liquid backdrop-blur-md">
                            <Users className="w-12 h-12 text-foreground/20 mb-4" />
                            <h3 className="text-lg font-bold text-foreground/80">No departments found</h3>
                            <p className="text-sm text-slate-500 max-w-sm mt-2 font-medium">
                                Create global departments to assign users to.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="glass-liquid border border-foreground/10 p-6 rounded-[32px] shadow-2xl backdrop-blur-xl max-w-md w-full">
                    <DialogHeader>
                        <DialogTitle className="text-foreground text-xl font-bold">Edit Department</DialogTitle>
                        <DialogDescription className="text-slate-400 text-sm font-medium mt-1 leading-relaxed">
                            Update the display name. Changes will propagate globally.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-5 pt-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300 text-xs font-bold uppercase tracking-wider">Display Name</Label>
                            <Input
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                placeholder="e.g. Media Team"
                                className="w-full h-11 pl-4 pr-4 bg-foreground/[0.03] border border-foreground/10 rounded-full text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-all"
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setEditOpen(false)} disabled={saving} className="flex-1 rounded-full text-xs font-bold text-foreground/70 hover:bg-foreground/5 transition-all">Cancel</Button>
                            <Button type="submit" disabled={saving} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full transition-all duration-200 active:scale-95 shadow-lg shadow-primary/20 text-xs font-bold">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
