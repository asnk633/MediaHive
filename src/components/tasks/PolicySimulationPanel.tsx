'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Info, AlertTriangle, ShieldCheck, DownloadCloud, Box, Users, Search } from 'lucide-react';
import { evaluatePolicies, PolicyResult } from '@/domain/conflicts/conflictPolicies';
import { DropdownSelector } from '@/components/ui/selectors/DropdownSelector';
import { TaskConflict } from '@/domain/conflicts/types';

interface PolicySimulationPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const ROLES = ['admin', 'manager', 'team', 'member'];
const FIELDS = ['status', 'priority', 'assigned_to', 'deleted', 'title'];

export const PolicySimulationPanel: React.FC<PolicySimulationPanelProps> = ({
    isOpen,
    onClose
}) => {
    // Simulation Inputs
    const [localRole, setLocalRole] = useState('team');
    const [remoteRole, setRemoteRole] = useState('admin');
    const [field, setField] = useState('status');
    const [localValue, setLocalValue] = useState('done');
    const [serverValue, setServerValue] = useState('in_progress');
    const [remoteActor, setRemoteActor] = useState('Remote Admin');

    // Simulation Output
    const [result, setResult] = useState<PolicyResult | null>(null);

    const runSimulation = () => {
        const mockConflict: TaskConflict = {
            taskId: 'sim-task-123',
            field: field,
            category: 'content', // Adding required category property
            localValue: localValue,
            serverValue: serverValue,
            remoteActor: remoteActor,
            remoteActorRole: remoteRole,
            timestamp: Date.now()
        };

        const localUser = { role: localRole, uid: 'local-user-id' };
        const evaluation = evaluatePolicies(mockConflict, localUser);
        setResult(evaluation);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-[#0B0E14]/90 backdrop-blur-md z-[110]"
                    />

                    <motion.div
                        key="panel"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        className="fixed inset-x-0 bottom-0 top-20 bg-[#0B0E14] border-t border-foreground/10 shadow-2xl z-[111] flex flex-col md:max-w-4xl md:mx-auto md:rounded-t-3xl"
                    >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-foreground/10 shrink-0 bg-blue-500/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Box className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Policy Simulation Sandbox</h2>
                            <p className="text-sm text-blue-400/60 font-medium">Safe environment to test conflict logic</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 text-foreground/80 hover:text-foreground rounded-xl hover:bg-foreground/5 transition-all">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 grid md:grid-cols-2 gap-10">
                    {/* Left: Inputs */}
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/70 mb-4">Conflict Scenario</h3>
                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-0.5">
                                        <DropdownSelector 
                                            label="Your Role"
                                            value={localRole}
                                            onChange={(val) => setLocalRole(val)}
                                            options={ROLES.map(r => ({ id: r, label: r, icon: <Users size={14} /> }))}
                                        />
                                    </div>
                                    <div className="space-y-0.5">
                                        <DropdownSelector 
                                            label="Remote Role"
                                            value={remoteRole}
                                            onChange={(val) => setRemoteRole(val)}
                                            options={ROLES.map(r => ({ id: r, label: r, icon: <Users size={14} /> }))}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-0.5">
                                    <DropdownSelector 
                                        label="Conflicted Field"
                                        value={field}
                                        onChange={(val) => setField(val)}
                                        options={FIELDS.map(f => ({ id: f, label: f, icon: <Search size={14} /> }))}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-foreground/80 ml-1">Your Value</label>
                                        <input
                                            type="text"
                                            value={localValue}
                                            onChange={(e) => setLocalValue(e.target.value)}
                                            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/80 focus:border-blue-500/50 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-foreground/80 ml-1">Server Value</label>
                                        <input
                                            type="text"
                                            value={serverValue}
                                            onChange={(e) => setServerValue(e.target.value)}
                                            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/80 focus:border-blue-500/50 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={runSimulation}
                            className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-500 text-foreground rounded-2xl font-bold shadow-lg shadow-blue-900/40 transition-all active:scale-95"
                        >
                            <Play size={20} fill="currentColor" />
                            Evaluate Policy logic
                        </button>
                    </div>

                    {/* Right: Results */}
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/70 mb-4">Evaluation Result</h3>
                            {!result ? (
                                <div className="h-64 rounded-3xl border-2 border-dashed border-foreground/5 flex flex-col items-center justify-center text-foreground/80 gap-4">
                                    <Box size={40} className="opacity-20" />
                                    <p className="text-sm">Configure a scenario and run simulation</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className={`p-6 rounded-3xl border ${result.suggestedAction === 'local' ? 'bg-blue-500/10 border-blue-500/30' :
                                            result.suggestedAction === 'server' ? 'bg-amber-500/10 border-amber-500/30' :
                                                'bg-foreground/5 border-foreground/10'
                                        }`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[10px] uppercase font-black tracking-widest opacity-50">Suggestion</span>
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${result.suggestedAction === 'local' ? 'bg-blue-500 text-foreground' :
                                                    result.suggestedAction === 'server' ? 'bg-amber-500 text-black' :
                                                        'bg-foreground/20 text-foreground/80'
                                                }`}>
                                                {result.suggestedAction === 'none' ? 'Manual Review' : result.suggestedAction === 'local' ? 'Keep Mine' : 'Use Theirs'}
                                            </div>
                                        </div>
                                        <div className="text-lg font-bold text-foreground mb-2 leading-tight">
                                            {result.reason}
                                        </div>
                                        {result.blockOverride && (
                                            <div className="flex items-center gap-2 text-xs font-bold text-red-400 mt-4 bg-red-400/10 p-2.5 rounded-xl border border-red-400/20">
                                                <AlertTriangle size={14} />
                                                Policy Blocks Override for non-Admins
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-foreground/5 rounded-3xl p-6 border border-foreground/10">
                                        <div className="flex items-center gap-2 text-foreground/80 mb-4">
                                            <Info size={16} />
                                            <span className="text-xs font-bold uppercase tracking-widest">Sandbox Safety Note</span>
                                        </div>
                                        <p className="text-sm text-foreground/80 leading-relaxed">
                                            This simulation is strictly isolated. No mutations will be fired to the server, and no entries will be added to the Activity History. This is for logic verification only.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
