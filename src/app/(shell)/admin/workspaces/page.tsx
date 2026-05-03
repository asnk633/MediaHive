"use client";

import React, { useState, useEffect } from 'react';
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { AdminService } from '@/services/adminService';
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
    Layout
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';

const MODULES = [
    { key: 'tasks', label: 'Task Management', desc: 'To-do lists, assignments, and kanban.' },
    { key: 'events', label: 'Events & Calendar', desc: 'Scheduling, crew booking, and location tracking.' },
    { key: 'inventory', label: 'Equipment Inventory', desc: 'Resource tracking and rental management.' },
    { key: 'files', label: 'Digital Assets', desc: 'File storage and drive integration.' },
];

export default function WorkspacesPage() {
    const [workspaces, setWorkspaces] = useState<Institution[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const selectedWorkspace = workspaces.find(w => w.id === selectedId);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await AdminService.getAllWorkspaces();
            setWorkspaces(data);
            if (data.length > 0 && !selectedId) {
                setSelectedId(data[0].id);
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

    const filteredWorkspaces = workspaces.filter(w =>
        w.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleToggleFeature = async (featureKey: string) => {
        if (!selectedWorkspace || saving) return;
        
        const currentFeatures = selectedWorkspace.features || {};
        const newFeatures = {
            ...currentFeatures,
            [featureKey]: !currentFeatures[featureKey]
        };

        setSaving(true);
        try {
            await AdminService.updateWorkspaceFeatures(selectedWorkspace.id, newFeatures);
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

    return (
        <PageLayout mode="plain">
            <PageHeader
                title="Workspace Management"
                description="Manage organizational entities and their enabled features."
                actions={
                    <button className="h-10 px-4 rounded-xl bg-indigo-500 text-white text-sm font-bold flex items-center gap-2 hover:bg-indigo-400 transition-colors">
                        <Plus size={16} /> New Institution
                    </button>
                }
            />

            <div className="flex gap-8 h-[calc(100vh-16rem)] min-h-[500px]">
                {/* Left Panel: Workspace List */}
                <div className="w-[380px] flex flex-col gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                        <input
                            placeholder="Search institutions..."
                            className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/5 rounded-2xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 transition-colors"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-2 no-scrollbar">
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
                                    <h4 className={cn("text-sm font-bold truncate", selectedId === workspace.id ? "text-white" : "text-white/60")}>
                                        {workspace.name}
                                    </h4>
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
                <div className="flex-1 flex flex-col rounded-[40px] glass-liquid border-white/5 overflow-hidden">
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
                                                <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                                                    Status: {selectedWorkspace.status}
                                                </div>
                                                <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black text-white/40 uppercase tracking-widest">
                                                    ID: {selectedWorkspace.id}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="h-12 px-6 rounded-2xl bg-white/5 border border-white/5 text-sm font-bold text-white hover:bg-white/10 transition-colors">
                                        Edit Details
                                    </button>
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
                                <h3 className="text-xl font-black text-white/20 uppercase tracking-tighter">Select an Institution</h3>
                                <p className="text-sm text-white/10 mt-2 max-w-xs">Manage institutional settings and feature availability.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </PageLayout>
    );
}
