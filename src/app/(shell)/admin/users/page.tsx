"use client";

import React, { useState, useEffect } from 'react';
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { UserService, User } from '@/services/userService';
import { AdminService } from '@/services/adminService';
import { StructureService } from '@/services/structureService';
import { Institution } from '@/types/structure';
import { 
    Search, 
    Loader2, 
    Users, 
    Shield, 
    Building2, 
    Mail, 
    Plus, 
    Trash2,
    ShieldCheck,
    UserCircle,
    ChevronRight,
    MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { InviteUserModal } from '@/components/admin/users/InviteUserModal';

export default function AdminUsersPage() {
    const [viewMode, setViewMode] = useState<'users' | 'invites'>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [invites, setInvites] = useState<any[]>([]);
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedInviteId, setSelectedInviteId] = useState<string | null>(null);
    const [workspaceAccess, setWorkspaceAccess] = useState<any[]>([]);
    const [loadingAccess, setLoadingAccess] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    const selectedUser = users.find(u => u.uid === selectedUserId);
    const selectedInvite = invites.find(i => i.id === selectedInviteId);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersData, instData, inviteData] = await Promise.all([
                UserService.getAllUsers(),
                StructureService.getInstitutions(),
                AdminService.getInvitations()
            ]);
            setUsers(usersData);
            setInstitutions(instData.institutions || []);
            setInvites(inviteData);
            
            if (viewMode === 'users' && usersData.length > 0 && !selectedUserId) {
                setSelectedUserId(usersData[0].uid);
            } else if (viewMode === 'invites' && inviteData.length > 0 && !selectedInviteId) {
                setSelectedInviteId(inviteData[0].id);
            }
        } catch (error) {
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const fetchAccess = async (uid: string) => {
        setLoadingAccess(true);
        try {
            const access = await AdminService.getUserWorkspaceAccess(uid);
            setWorkspaceAccess(access);
        } catch (error) {
            toast.error("Failed to load access details");
        } finally {
            setLoadingAccess(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [viewMode]);

    useEffect(() => {
        if (selectedUserId && viewMode === 'users') {
            fetchAccess(selectedUserId);
        }
    }, [selectedUserId, viewMode]);

    const filteredUsers = users.filter(u =>
        (u.name?.toLowerCase().includes(search.toLowerCase())) ||
        (u.email?.toLowerCase().includes(search.toLowerCase()))
    );

    const handleUpdateRole = async (instId: string, newRole: string) => {
        if (!selectedUserId) return;
        try {
            await AdminService.setUserWorkspaceRole(selectedUserId, instId, newRole);
            toast.success("Workspace role updated");
            fetchAccess(selectedUserId);
        } catch (error) {
            toast.error("Update failed");
        }
    };

    const handleRemoveAccess = async (instId: string) => {
        if (!selectedUserId) return;
        try {
            await AdminService.removeUserWorkspaceAccess(selectedUserId, instId);
            toast.success("Access revoked");
            fetchAccess(selectedUserId);
        } catch (error) {
            toast.error("Action failed");
        }
    };

    const handleAddAccess = async () => {
        // Simple prompt for MVP, better UI would use a dropdown
        const instName = prompt("Enter Institution ID to add access to:");
        if (!instName || !selectedUserId) return;
        
        try {
            await AdminService.setUserWorkspaceRole(selectedUserId, instName, 'member');
            toast.success("Access granted");
            fetchAccess(selectedUserId);
        } catch (error) {
            toast.error("Failed to add access");
        }
    };

    const filteredInvites = invites.filter(i =>
        i.email?.toLowerCase().includes(search.toLowerCase())
    );

    const handleCancelInvite = async (id: string) => {
        if (!confirm("Are you sure you want to cancel this invitation?")) return;
        try {
            await AdminService.cancelInvitation(id);
            toast.success("Invitation cancelled");
            fetchData();
        } catch (error) {
            toast.error("Failed to cancel invitation");
        }
    };

    return (
        <PageLayout mode="plain">
            <PageHeader
                title="User Management"
                description="Control global access and institutional permissions."
                actions={
                    <button 
                        onClick={() => setIsInviteModalOpen(true)}
                        className="h-10 px-4 rounded-xl bg-indigo-500 text-white text-sm font-bold flex items-center gap-2 hover:bg-indigo-400 transition-colors"
                    >
                        <Plus size={16} /> Invite User
                    </button>
                }
            />

            <div className="flex flex-col lg:flex-row gap-8 h-auto lg:h-[calc(100vh-16rem)] min-h-[500px]">
                {/* Left Panel: User List / Invite List */}
                <div className="w-full lg:w-[380px] flex flex-col gap-4">
                    <div className="flex bg-white/5 p-1 rounded-2xl">
                        <button 
                            onClick={() => setViewMode('users')}
                            className={cn(
                                "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                                viewMode === 'users' ? "bg-white/10 text-white shadow-lg" : "text-white/30 hover:text-white/50"
                            )}
                        >
                            Active Users
                        </button>
                        <button 
                            onClick={() => setViewMode('invites')}
                            className={cn(
                                "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all relative",
                                viewMode === 'invites' ? "bg-white/10 text-white shadow-lg" : "text-white/30 hover:text-white/50"
                            )}
                        >
                            Invitations
                            {invites.filter(i => i.status === 'pending').length > 0 && (
                                <span className="absolute top-2 right-4 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                            )}
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                        <input
                            placeholder={viewMode === 'users' ? "Search users..." : "Search invites..."}
                            className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/5 rounded-2xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 transition-colors"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-2 no-scrollbar max-h-[400px] lg:max-h-none">
                        {loading ? (
                            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-white/20" /></div>
                        ) : viewMode === 'users' ? (
                            filteredUsers.map(user => (
                                <button
                                    key={user.uid}
                                    onClick={() => setSelectedUserId(user.uid)}
                                    className={cn(
                                        "w-full p-4 rounded-3xl flex items-center gap-4 border transition-all text-left group",
                                        selectedUserId === user.uid 
                                            ? "bg-white/10 border-white/10 shadow-lg" 
                                            : "bg-transparent border-transparent hover:bg-white/5"
                                    )}
                                >
                                    <Avatar className="h-10 w-10 border border-white/10">
                                        <AvatarImage src={user.avatar_url || user.photoURL} />
                                        <AvatarFallback className="bg-indigo-500/10 text-indigo-400 font-bold">
                                            {user.name?.[0] || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={cn("text-sm font-bold truncate", selectedUserId === user.uid ? "text-white" : "text-white/60")}>
                                            {user.name || 'Anonymous'}
                                        </h4>
                                        <p className="text-[10px] text-white/30 font-medium truncate uppercase tracking-widest">
                                            {user.role} • {user.email}
                                        </p>
                                    </div>
                                    <ChevronRight size={14} className={cn("transition-transform", selectedUserId === user.uid ? "text-indigo-400 translate-x-0" : "text-white/10 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0")} />
                                </button>
                            ))
                        ) : (
                            filteredInvites.map(invite => (
                                <button
                                    key={invite.id}
                                    onClick={() => setSelectedInviteId(invite.id)}
                                    className={cn(
                                        "w-full p-4 rounded-3xl flex items-center gap-4 border transition-all text-left group",
                                        selectedInviteId === invite.id 
                                            ? "bg-white/10 border-white/10 shadow-lg" 
                                            : "bg-transparent border-transparent hover:bg-white/5"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
                                        invite.status === 'accepted' ? "bg-emerald-500/10 text-emerald-400" :
                                        invite.status === 'expired' ? "bg-rose-500/10 text-rose-400" :
                                        "bg-blue-500/10 text-blue-400"
                                    )}>
                                        <Mail size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={cn("text-sm font-bold truncate", selectedInviteId === invite.id ? "text-white" : "text-white/60")}>
                                            {invite.email}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                                                invite.status === 'accepted' ? "bg-emerald-500/20 text-emerald-400" :
                                                invite.status === 'expired' ? "bg-rose-500/20 text-rose-400" :
                                                "bg-blue-500/20 text-blue-400"
                                            )}>
                                                {invite.status}
                                            </span>
                                            <p className="text-[9px] text-white/20 font-medium truncate uppercase tracking-widest">
                                                {new Date(invite.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight size={14} className={cn("transition-transform", selectedInviteId === invite.id ? "text-indigo-400 translate-x-0" : "text-white/10 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0")} />
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Panel: Detail View */}
                <div className="flex-1 flex flex-col rounded-[40px] glass-liquid border-white/5 overflow-hidden min-h-[600px] lg:min-h-0">
                    <AnimatePresence mode="wait">
                        {viewMode === 'users' && selectedUserId && selectedUser ? (
                            <motion.div 
                                key={`user-${selectedUserId}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex-1 flex flex-col p-8 overflow-y-auto no-scrollbar"
                            >
                                {/* Header Info */}
                                <div className="flex items-start justify-between mb-8">
                                    <div className="flex items-center gap-6">
                                        <div className="relative">
                                            <Avatar className="h-24 w-24 border-2 border-white/10 shadow-2xl">
                                                <AvatarImage src={selectedUser.avatar_url || selectedUser.photoURL} />
                                                <AvatarFallback className="text-3xl font-black bg-indigo-500/10 text-indigo-400">
                                                    {selectedUser.name?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg border-4 border-[#09090b]">
                                                <ShieldCheck size={16} />
                                            </div>
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-white tracking-tight mb-1">{selectedUser.name}</h2>
                                            <div className="flex flex-wrap gap-3">
                                                <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                                                    <Mail size={12} /> {selectedUser.email}
                                                </div>
                                                <div className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                                    <Shield size={12} /> Global {selectedUser.role}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="h-10 px-4 rounded-xl border border-white/10 text-xs font-bold text-white/60 hover:bg-white/5 transition-colors">
                                            Deactivate
                                        </button>
                                        <button className="h-10 w-10 rounded-xl border border-rose-500/20 text-rose-400 flex items-center justify-center hover:bg-rose-500/10 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Workspace Access Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                                            <Building2 size={14} /> Workspace Access Control
                                        </h3>
                                        <button 
                                            onClick={handleAddAccess}
                                            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest flex items-center gap-1"
                                        >
                                            <Plus size={12} /> Add Workspace
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {loadingAccess ? (
                                            <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-white/10" /></div>
                                        ) : workspaceAccess.length === 0 ? (
                                            <div className="p-12 rounded-[32px] border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-center">
                                                <MapPin className="text-white/10 mb-4" size={40} />
                                                <p className="text-sm font-bold text-white/40">No institutional access granted</p>
                                                <p className="text-xs text-white/20 mt-1">This user can only access global resources.</p>
                                            </div>
                                        ) : workspaceAccess.map(access => (
                                            <div key={access.id} className="p-5 rounded-[28px] bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-white/[0.07] transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                                        <Building2 size={18} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-white">{access.institutions?.name}</h4>
                                                        <p className="text-[10px] text-white/30 font-medium uppercase tracking-widest">Institution ID: {access.institution_id}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="flex bg-black/20 p-1 rounded-xl">
                                                        {['member', 'manager', 'admin'].map(r => (
                                                            <button
                                                                key={r}
                                                                onClick={() => handleUpdateRole(access.institution_id, r)}
                                                                className={cn(
                                                                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                                                    access.role === r 
                                                                        ? "bg-indigo-500 text-white shadow-lg" 
                                                                        : "text-white/20 hover:text-white/40"
                                                                )}
                                                            >
                                                                {r}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <button 
                                                        onClick={() => handleRemoveAccess(access.institution_id)}
                                                        className="w-8 h-8 rounded-lg text-white/10 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-all"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ) : viewMode === 'invites' && selectedInviteId && selectedInvite ? (
                            <motion.div 
                                key={`invite-${selectedInviteId}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex-1 flex flex-col p-8 overflow-y-auto no-scrollbar"
                            >
                                <div className="flex items-start justify-between mb-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                            <Mail size={40} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-white tracking-tight mb-1">{selectedInvite.email}</h2>
                                            <div className="flex flex-wrap gap-3">
                                                <div className={cn(
                                                    "px-3 py-1 rounded-lg border flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
                                                    selectedInvite.status === 'accepted' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                                                    selectedInvite.status === 'expired' ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                                                    "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                                )}>
                                                    {selectedInvite.status}
                                                </div>
                                                <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                                                    Expires: {new Date(selectedInvite.expires_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {selectedInvite.status !== 'accepted' && (
                                            <button 
                                                onClick={() => handleCancelInvite(selectedInvite.id)}
                                                className="h-10 px-4 rounded-xl border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-colors text-xs font-bold"
                                            >
                                                Cancel Invite
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-sm font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                                        <Building2 size={14} /> Invited Workspace Access
                                    </h3>
                                    
                                    <div className="space-y-3">
                                        {Object.entries(selectedInvite.metadata?.invited_workspaces || {}).map(([id, role]: [any, any]) => {
                                            const inst = institutions.find(i => i.id === id);
                                            return (
                                                <div key={id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
                                                            <Building2 size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-white">{inst?.name || 'Unknown Workspace'}</p>
                                                            <p className="text-[9px] text-white/30 uppercase tracking-widest font-black">{id}</p>
                                                        </div>
                                                    </div>
                                                    <div className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                                                        {role}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="p-6 rounded-[32px] bg-indigo-500/5 border border-indigo-500/10 space-y-4">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Invitation Link</p>
                                        <div className="flex gap-2">
                                            <input 
                                                readOnly
                                                value={`${window.location.origin}/accept-invite?token=${selectedInvite.token}`}
                                                className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-xs text-white/60 focus:outline-none"
                                            />
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`${window.location.origin}/accept-invite?token=${selectedInvite.token}`);
                                                    toast.success("Link copied to clipboard");
                                                }}
                                                className="px-4 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-bold transition-colors"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                                <UserCircle size={64} className="text-white/5 mb-6" />
                                <h3 className="text-xl font-black text-white/20 uppercase tracking-tighter">
                                    {viewMode === 'users' ? 'Select a user to manage' : 'Select an invitation to track'}
                                </h3>
                                <p className="text-sm text-white/10 mt-2 max-w-xs">
                                    {viewMode === 'users' 
                                        ? 'Adjust global roles or assign specific institutional permissions.'
                                        : 'View pending access requests and copy secure invitation links.'}
                                </p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <InviteUserModal 
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                onSuccess={fetchData}
            />
        </PageLayout>
    );
}
