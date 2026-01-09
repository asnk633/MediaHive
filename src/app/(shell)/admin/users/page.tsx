"use client";

import React, { useState, useEffect } from 'react';
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { UserService, User } from '@/services/userService';
import { StructureService } from '@/services/structureService';
import { Institution, Department } from '@/types/structure';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, User as UserIcon, Building, Users, ChevronLeft, AlertTriangle } from 'lucide-react';
import { UserDialog } from './UserDialog';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from 'next/link';
import { createInvite } from '@/services/inviteService';
import { useAuth } from '@/contexts/AuthContext';

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

    const { user: currentUser } = useAuth(); // Needed for invitedByUserId

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setDialogOpen(true);
    };

    const handleAdd = () => {
        setSelectedUser(null);
        setDialogOpen(true);
    };

    const handleSaveUser = async (data: Partial<User> & { email?: string }) => {
        try {
            if (selectedUser) {
                // Update Logic
                await UserService.updateUser(selectedUser.uid, data);
                toast.success("User updated successfully");
            } else {
                // Create logic (Invite)
                if (!currentUser?.uid) {
                    toast.error("You must be logged in to invite users");
                    return;
                }
                if (!data.email) {
                    toast.error("Email is required");
                    return;
                }

                // Using the updated createInvite signature (supporting Department)
                // Note: role cast is safe due to Dialog validation
                await createInvite(
                    data.email,
                    data.role as 'admin' | 'team' | 'guest',
                    currentUser.uid,
                    data.institutionId || null,
                    data.departmentId || null
                );

                toast.success(`Invitation sent to ${data.email}`);
            }
            fetchData();
        } catch (error: any) {
            console.error("User Action Failed:", error);
            toast.error(error.message || "Failed to save user");
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
        (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <PageLayout mode="plain">
            <div className="mb-2">
                <Link href="/settings" className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Settings
                </Link>
            </div>

            <PageHeader
                title={
                    <div className="flex items-center gap-3">
                        User Management
                        {process.env.NODE_ENV === 'development' && (
                            <div className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                DEV MOCK MODE
                            </div>
                        )}
                    </div>
                }
                description="Manage users, roles, and affiliations."
                actions={
                    <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-500 text-white gap-2">
                        <Users className="w-4 h-4" />
                        Add User
                    </Button>
                }
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
                ) : users.length === 0 ? (
                    // Empty State
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 border border-white/5 rounded-2xl border-dashed">
                        <div className="bg-slate-800/50 p-4 rounded-full mb-4">
                            <Users className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-medium text-white mb-2">No users found</h3>
                        <p className="text-slate-400 text-center max-w-md mb-6">
                            Get started by adding your first team member or administrator to the platform.
                        </p>
                        <Button onClick={handleAdd} variant="outline" className="border-white/10 text-white hover:bg-white/5">
                            Add User
                        </Button>
                    </div>
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
                                            <AvatarFallback className="bg-slate-800 text-slate-400">{(user.name || user.email || '?').charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h4 className="text-white font-medium">{user.name || 'Unnamed User'}</h4>
                                            <div className="text-sm text-slate-500">{user.email || 'No Email'}</div>
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
