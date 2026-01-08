"use client";

import React, { useState, useEffect } from 'react';
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { UserService, User } from '@/services/userService';
import { StructureService } from '@/services/structureService';
import { Institution, Department } from '@/types/structure';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, User as UserIcon, Building, Users } from 'lucide-react';
import { UserDialog } from './UserDialog';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersData, instData, deptData] = await Promise.all([
                UserService.getAllUsers(),
                StructureService.getInstitutions(), // Active only by default
                StructureService.getDepartments()   // Active only by default
            ]);
            setUsers(usersData);
            setInstitutions(instData.institutions || []);
            setDepartments(deptData.departments || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setDialogOpen(true);
    };

    const handleSaveUser = async (data: Partial<User>) => {
        if (!selectedUser) return; // Create not fully supported in this simplified flow yet?
        // Actually, let's support update only first as per requirement to clean up existing users.
        try {
            await UserService.updateUser(selectedUser.uid, data);
            toast.success("User updated successfully");
            fetchData();
        } catch (error) {
            toast.error("Failed to update user");
            throw error;
        }
    };

    // Helper to get affiliation name
    const getAffiliation = (user: User) => {
        if (user.institutionId) {
            const inst = institutions.find(i => i.id === user.institutionId);
            return { type: 'Institution', name: inst ? inst.name : 'Unknown Institution', icon: Building };
        }
        if (user.departmentId) {
            const dept = departments.find(d => d.id === user.departmentId);
            return { type: 'Department', name: dept ? dept.name : 'Unknown Department', icon: Users };
        }
        return { type: 'None', name: 'No Affiliation', icon: UserIcon };
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <PageLayout mode="plain">
            <PageHeader
                title="User Management"
                description="Manage users, roles, and affiliations."
            />

            <div className="mt-6 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <Input
                            placeholder="Search users..."
                            className="pl-10 bg-slate-900/50 border-[#ffffff1a] text-white"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
                ) : (
                    <div className="grid gap-4">
                        {filteredUsers.map(user => {
                            const affiliation = getAffiliation(user);
                            const Icon = affiliation.icon;

                            return (
                                <div key={user.uid} className="p-4 rounded-xl bg-slate-900/50 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-10 w-10 border border-white/10">
                                            <AvatarImage src={user.avatarUrl || user.photoURL} />
                                            <AvatarFallback className="bg-slate-800 text-slate-400">{user.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h4 className="text-white font-medium">{user.name}</h4>
                                            <div className="text-sm text-slate-500">{user.email}</div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
                                        <div className="flex items-center gap-2 text-sm text-slate-300 min-w-[200px]">
                                            <Icon className="w-4 h-4 text-slate-500" />
                                            <span className="truncate">{affiliation.name}</span>
                                            <span className="text-xs text-slate-600 ml-1">({affiliation.type})</span>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium 
                                                ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400' :
                                                    user.role === 'team' ? 'bg-blue-500/10 text-blue-400' :
                                                        'bg-slate-500/10 text-slate-400'}`}>
                                                {user.role}
                                            </span>

                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                                                Edit
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <UserDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                user={selectedUser}
                onSave={handleSaveUser}
                institutions={institutions}
                departments={departments}
            />
        </PageLayout>
    );
}
