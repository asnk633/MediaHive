"use client";

import React, { useState, useEffect } from 'react';
import { StructureService } from '@/services/structureService';
import { Department } from '@/types/structure';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Archive, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export function DepartmentsTab() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);

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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-slate-200">Global Departments</h3>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                            <Plus className="w-4 h-4 mr-2" /> Add Department
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-white/10">
                        <DialogHeader>
                            <DialogTitle className="text-white">New Department</DialogTitle>
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
                        <div key={dept.id} className="p-4 rounded-xl bg-slate-900/50 border border-white/5 flex flex-col justify-between gap-4 hover:border-white/10 transition-colors">
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

                            <div className="flex justify-end pt-2 border-t border-white/5">
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
                        <div className="col-span-full text-center py-12 text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-white/5">
                            No departments found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
