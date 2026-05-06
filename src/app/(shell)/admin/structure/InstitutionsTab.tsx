"use client";

import React, { useState, useEffect } from 'react';
import { StructureService } from '@/services/structureService';
import { Institution } from '@/types/structure';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Archive, Edit2, Loader2, Building, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export function InstitutionsTab() {
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);

    // Edit State
    const [editOpen, setEditOpen] = useState(false);
    const [editingInst, setEditingInst] = useState<Institution | null>(null);
    const [editName, setEditName] = useState('');
    const [saving, setSaving] = useState(false);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingInst || !editName.trim()) return;

        setSaving(true);
        try {
            await StructureService.updateInstitution(editingInst.id, { name: editName });
            toast.success("Department / Institution name updated");
            setEditOpen(false);
            fetchInstitutions();
        } catch (error) {
            toast.error("Failed to update Department / Institution");
        } finally {
            setSaving(false);
        }
    };

    const fetchInstitutions = async () => {
        setLoading(true);
        try {
            const data = await StructureService.getInstitutions(true);
            setInstitutions(data.institutions || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load Departments / Institutions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInstitutions();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        setCreating(true);
        try {
            await StructureService.createInstitution(newName);
            toast.success("Department / Institution created");
            setNewName('');
            setCreateOpen(false);
            fetchInstitutions();
        } catch (error) {
            toast.error("Failed to create Department / Institution");
        } finally {
            setCreating(false);
        }
    };

    const handleStatusToggle = async (id: string, currentStatus: 'active' | 'archived') => {
        const newStatus = currentStatus === 'active' ? 'archived' : 'active';
        try {
            await StructureService.updateInstitution(id, { status: newStatus });
            toast.success(`Department / Institution ${newStatus === 'active' ? 'activated' : 'archived'}`);
            fetchInstitutions();
        } catch (error) {
            toast.error("Status update failed");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-slate-200">All Departments / Institutions</h3>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                            <Plus className="w-4 h-4 mr-2" /> Add Department / Institution
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-surface backdrop-blur-xl border-soft">
                        <DialogHeader>
                            <DialogTitle className="text-foreground">New Department / Institution</DialogTitle>
                            <DialogDescription className="text-muted">
                                Create a new department or institution to isolate resources.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label className="text-muted">Name</Label>
                                <Input
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="e.g. Media & IT Department"
                                    className="bg-background border-soft text-foreground"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} disabled={creating}>Cancel</Button>
                                <Button type="submit" disabled={creating} className="bg-primary text-primary-foreground hover:bg-primary/90">
                                    {creating ? "Creating..." : "Create"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {institutions.map(inst => (
                        <div key={inst.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-between gap-4 hover:border-white/10 transition-colors">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                        <Building className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-medium">{inst.name}</h4>
                                        <div className={`text-xs mt-1 inline-flex items-center px-2 py-0.5 rounded-full ${inst.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {inst.status}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2 border-t border-white/5 gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setEditingInst(inst);
                                        setEditName(inst.name);
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
                                    onClick={() => handleStatusToggle(inst.id, inst.status)}
                                    className={inst.status === 'active' ? "text-red-400 hover:text-red-300 hover:bg-red-500/10" : "text-green-400 hover:text-green-300 hover:bg-green-500/10"}
                                >
                                    {inst.status === 'active' ? <Archive className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                    {inst.status === 'active' ? 'Archive' : 'Activate'}
                                </Button>
                            </div>
                        </div>
                    ))}
                    {institutions.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
                            <Building className="w-12 h-12 text-slate-600 mb-4" />
                            <h3 className="text-lg font-medium text-slate-400">No entities found</h3>
                            <p className="text-sm text-slate-500 max-w-sm mt-2">
                                Create a department or institution to start organizing your hierarchy.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="bg-slate-950/90 backdrop-blur-xl border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-white">Edit Department / Institution</DialogTitle>
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
                                placeholder="e.g. Media & IT Department"
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
