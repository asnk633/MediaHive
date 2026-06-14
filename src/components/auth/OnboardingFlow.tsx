'use client';
import { nativeNavigate } from '@/lib/utils';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Building2, ArrowRight, UserCheck, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/system/workspace/WorkspaceProvider';

interface OnboardingFlowProps {
    userName: string;
    workspaces: Array<{ id: string; name: string; role: string }>;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ userName, workspaces }) => {
    const [step, setStep] = useState(1);
    const router = useRouter();
    const { setWorkspace } = useWorkspace();

    const handleWorkspaceSelect = async (workspaceId: string) => {
        try {
            setWorkspace(workspaceId);
            setStep(3);
        } catch (error) {
            console.error('Failed to select workspace:', error);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
    };

    return (
        <div className="max-w-md w-full mx-auto">
            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div
                        key="step1"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="bg-foreground/[0.03] border border-foreground/5 rounded-[40px] p-10 text-center space-y-8"
                    >
                        <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto border border-blue-500/30">
                            <UserCheck className="text-blue-400" size={48} />
                        </div>
                        
                        <div className="space-y-3">
                            <h2 className="text-3xl font-black text-foreground tracking-tighter leading-tight">
                                Welcome, {userName.split(' ')[0]} 👋
                            </h2>
                            <p className="text-foreground/80 text-sm leading-relaxed">
                                You’ve been successfully onboarded. You are a member of {workspaces.length} workspace{workspaces.length > 1 ? 's' : ''}.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {workspaces.map(ws => (
                                <div key={ws.id} className="flex items-center gap-3 p-3 bg-foreground/[0.02] border border-foreground/5 rounded-2xl">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                        <Building2 size={16} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-xs font-bold text-foreground">{ws.name}</p>
                                        <p className="text-[9px] text-foreground/70 uppercase tracking-widest font-black">{ws.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={() => workspaces.length > 1 ? setStep(2) : handleWorkspaceSelect(workspaces[0].id)}
                            className="w-full py-5 bg-white text-black font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all hover:bg-foreground/90"
                        >
                            {workspaces.length > 1 ? 'Choose Workspace' : 'Go to Dashboard'}
                            <ArrowRight size={18} />
                        </button>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        key="step2"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="bg-foreground/[0.03] border border-foreground/5 rounded-[40px] p-10 space-y-8"
                    >
                        <div className="text-center space-y-3">
                            <h2 className="text-3xl font-black text-foreground tracking-tighter leading-tight">
                                Select Workspace
                            </h2>
                            <p className="text-foreground/80 text-sm">
                                Which one would you like to start with?
                            </p>
                        </div>

                        <div className="space-y-3">
                            {workspaces.map(ws => (
                                <button
                                    key={ws.id}
                                    onClick={() => handleWorkspaceSelect(ws.id)}
                                    className="w-full group flex items-center justify-between p-4 bg-foreground/[0.02] border border-foreground/5 rounded-2xl hover:bg-blue-500/10 hover:border-blue-500/30 transition-all text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-blue-500 group-hover:text-foreground transition-all">
                                            <Building2 size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground">{ws.name}</p>
                                            <p className="text-[10px] text-foreground/70 uppercase tracking-widest font-black group-hover:text-blue-400 transition-colors">{ws.role}</p>
                                        </div>
                                    </div>
                                    <ArrowRight size={18} className="text-foreground/70 group-hover:text-blue-400 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div
                        key="step3"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="bg-foreground/[0.03] border border-foreground/5 rounded-[40px] p-10 text-center space-y-8"
                    >
                        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                            <CheckCircle2 className="text-emerald-400" size={48} />
                        </div>
                        
                        <div className="space-y-3">
                            <h2 className="text-3xl font-black text-foreground tracking-tighter leading-tight">
                                You’re All Set! 🚀
                            </h2>
                            <p className="text-foreground/80 text-sm leading-relaxed">
                                Your account is ready. Welcome to the team.
                            </p>
                        </div>

                        <button 
                            onClick={() => nativeNavigate('/home', router, 'OnboardingFlow.tsx')}
                            className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-foreground font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                        >
                            Open Dashboard
                            <LayoutDashboard size={18} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
