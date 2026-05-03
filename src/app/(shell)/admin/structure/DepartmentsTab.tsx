"use client";

import React, { useState, useEffect } from 'react';
import { StructureService } from '@/services/structureService';
import { Department } from '@/types/structure';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Archive, Loader2, Users, Edit2 } from 'lucide-react';
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
            toast.success("Office / Unit name updated");
            setEditOpen(false);
            fetchDepartments();
        } catch (error) {
            toast.error("Failed to update office / unit");
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
            toast.success("Office / Unit created");
            setNewName('');
            setCreateOpen(false);
            fetchDepartments();
        } catch (error) {
            toast.error("Failed to create office / unit");
        } finally {
            setCreating(false);
        }
    };

    const handleStatusToggle = async (id: string | number, currentStatus: 'active' | 'archived') => {
        const newStatus = currentStatus === 'active' ? 'archived' : 'active';
        try {
            await StructureService.updateDepartment(Number(id), { status: newStatus });
            toast.success(`Office / Unit ${newStatus === 'active' ? 'activated' : 'archived'}`);
            fetchDepartments();
        } catch (error) {
            toast.error("Status update failed");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-slate-200">Offices / Units</h3>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                            <Plus className="w-4 h-4 mr-2" /> Add Office / Unit
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-950/90 backdrop-blur-xl border-white/10">
                        <DialogHeader>
                            <DialogTitle className="text-white">New Office / Unit</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Create a new global office / unit for user assignment.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Name</Label>
                                <Input
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="e.g. Media Team"
                                    className="bg-slate-800 border-white/10 text-white"
                                />
                            </div>
                            <Button type="submit" disabled={creating} className="w-full bg-blue-600 hover:bg-blue-500">
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {departments.map(dept => (
                        <div key={dept.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-between gap-4 hover:border-white/10 transition-colors">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-medium">{dept.name}</h4>
                                        <div className={`text-xs mt-1 inline-flex items-center px-2 py-0.5 rounded-full ${dept.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {dept.status}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2 border-t border-white/5 gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setEditingDept(dept);
                                        setEditName(dept.name);
                                        setEditOpen(true);
                                    }}
                                    className="text-slate-400 hover:text-white hover:bg-white/5"
                                >
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleStatusToggle(dept.id, dept.status)}
                                    className={dept.status === 'active' ? "text-red-400 hover:text-red-300 hover:bg-red-500/10" : "text-green-400 hover:text-green-300 hover:bg-green-500/10"}
                                >
                                    {dept.status === 'active' ? <Archive className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                    {dept.status === 'active' ? 'Archive' : 'Activate'}
                                </Button>
                            </div>
                        </div>
                    ))}
                    {departments.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
                            <Users className="w-12 h-12 text-slate-600 mb-4" />
                            <h3 className="text-lg font-medium text-slate-400">No offices / units found</h3>
                            <p className="text-sm text-slate-500 max-w-sm mt-2">
                                Create global offices / units to assign users to.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="bg-slate-950/90 backdrop-blur-xl border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-white">Edit Office / Unit</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Update the display name. Changes will propagate globally.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Display Name</Label>
                            <Input
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                placeholder="e.g. Media Team"
                                className="bg-slate-800 border-white/10 text-white"
                            />
                        </div>
                        <Button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-500">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
