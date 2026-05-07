'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Shield, Check, Send, Loader2 } from 'lucide-react';
import { AdminService } from '@/services/adminService';
import { Institution } from '@/types/structure';
import { toast } from 'sonner';

interface InviteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [workspaces, setWorkspaces] = useState<Institution[]>([]);
    const [selectedWorkspaces, setSelectedWorkspaces] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [fetchingWorkspaces, setFetchingWorkspaces] = useState(false);
    const [inviteLink, setInviteLink] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchWorkspaces();
        }
    }, [isOpen]);

    const fetchWorkspaces = async () => {
        setFetchingWorkspaces(true);
        try {
            const data = await AdminService.getAllWorkspaces();
            setWorkspaces(data);
        } catch (error) {
            toast.error('Failed to load workspaces');
        } finally {
            setFetchingWorkspaces(false);
        }
    };

    const toggleWorkspace = (id: string) => {
        setSelectedWorkspaces(prev => {
            const next = { ...prev };
            if (next[id]) {
                delete next[id];
            } else {
                next[id] = 'member'; // default role
            }
            return next;
        });
    };

    const updateRole = (id: string, role: string) => {
        setSelectedWorkspaces(prev => ({
            ...prev,
            [id]: role
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return toast.error('Email is required');
        if (Object.keys(selectedWorkspaces).length === 0) return toast.error('Select at least one workspace');

        setLoading(true);
        try {
            const result = await AdminService.createInvitation(email, selectedWorkspaces);
            setInviteLink(result.link);
            toast.success('Invitation created!');
            // We don't close immediately so admin can copy the link if needed
        } catch (error) {
            toast.error('Failed to send invitation');
        } finally {
            setLoading(false);
        }
    };

    const copyLink = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink);
            toast.success('Link copied to clipboard');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-[#0B0E14]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">Invite New User</h2>
                        <p className="text-sm text-white/50">Grant access to multiple departments</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {inviteLink ? (
                    <div className="p-8 text-center space-y-6">
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                            <Check className="text-emerald-400" size={32} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Invitation Ready</h3>
                            <p className="text-sm text-white/50 mt-1">Copy this link and send it to {email}</p>
                        </div>
                        <div className="bg-black/40 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                            <code className="text-xs text-blue-400 truncate flex-1 text-left">{inviteLink}</code>
                            <button 
                                onClick={copyLink}
                                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-bold uppercase rounded-lg transition-colors"
                            >
                                Copy
                            </button>
                        </div>
                        <button 
                            onClick={() => { onSuccess(); onClose(); }}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors"
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Recipient Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="anas@thaiba.com"
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Department Access</label>
                            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {fetchingWorkspaces ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="animate-spin text-white/20" size={24} />
                                    </div>
                                ) : (
                                    workspaces.map(inst => (
                                        <div 
                                            key={inst.id}
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                                                selectedWorkspaces[inst.id] 
                                                    ? "bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20" 
                                                    : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                            )}
                                            onClick={() => toggleWorkspace(inst.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                                    selectedWorkspaces[inst.id] ? "bg-blue-500 border-blue-500" : "border-white/20"
                                                )}>
                                                    {selectedWorkspaces[inst.id] && <Check size={12} className="text-white" />}
                                                </div>
                                                <span className="text-sm font-medium text-white">{inst.name}</span>
                                            </div>

                                            {selectedWorkspaces[inst.id] && (
                                                <select 
                                                    value={selectedWorkspaces[inst.id]}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        updateRole(inst.id, e.target.value);
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="bg-[#0B0E14] border border-white/10 rounded-lg px-2 py-1 text-[10px] font-bold uppercase text-blue-400 outline-none"
                                                >
                                                    <option value="admin">Admin</option>
                                                    <option value="manager">Manager</option>
                                                    <option value="team">Team</option>
                                                    <option value="member">Member</option>
                                                </select>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || fetchingWorkspaces}
                            className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <Send size={18} />
                                    Send Invitation
                                </>
                            )}
                        </button>
                    </form>
                )}
            </motion.div>
        </div>
    );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
