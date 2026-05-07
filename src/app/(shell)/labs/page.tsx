'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
    Kanban, 
    Bot, 
    Terminal, 
    Activity, 
    Video,
    ArrowUpRight,
    Lock,
    Sparkles,
    Zap,
    Cpu,
    Target,
    Clapperboard
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextProvider';
import { useWorkspace } from '@/system/workspace/WorkspaceProvider';
import { canAccessFeature, UserRole } from '@/system/features/featureAccess';
import { FeatureKey } from '@/system/features/featureRegistry';
import { cn, nativeNavigate } from "@/lib/utils";
import { motion } from 'framer-motion';
import { PolicySimulationPanel } from '@/components/tasks/PolicySimulationPanel';
import { Box } from 'lucide-react';

interface LabFeature {
    id: string;
    key: FeatureKey;
    label: string;
    description: string;
    icon: any;
    path: string;
    color: string;
    status: 'stable' | 'beta' | 'alpha' | 'prototype';
}

const LAB_FEATURES: LabFeature[] = [
    {
        id: 'flowboard',
        key: 'flowboard',
        label: 'Flowboard',
        description: 'Creative visual planning and mood boards for your media projects.',
        icon: Kanban,
        path: '/labs/flowboard',
        color: 'from-blue-500 to-indigo-600',
        status: 'beta'
    },
    {
        id: 'ai-assistant',
        key: 'aiAssistant',
        label: 'AI Assistant',
        description: 'Context-aware intelligence that understands your workspace and tasks.',
        icon: Bot,
        path: '/labs/ai-assistant',
        color: 'from-purple-500 to-pink-600',
        status: 'alpha'
    },
    {
        id: 'automation',
        key: 'automationEngine',
        label: 'Automation',
        description: 'Build powerful workflows and triggers to automate repetitive media tasks.',
        icon: Terminal,
        path: '/labs/automation',
        color: 'from-orange-500 to-amber-600',
        status: 'alpha'
    },
    {
        id: 'intelligence',
        key: 'intelligenceDashboard',
        label: 'Intelligence',
        description: 'Deep-dive data analysis and predictive insights for your institution.',
        icon: Activity,
        path: '/labs/intelligence',
        color: 'from-emerald-500 to-teal-600',
        status: 'beta'
    },
    {
        id: 'production-center',
        key: 'productionCenter',
        label: 'Production Center',
        description: 'Comprehensive management suite for shoots, talent, and production schedules.',
        icon: Video,
        path: '/labs/production-center',
        color: 'from-red-500 to-rose-600',
        status: 'beta'
    },
    {
        id: 'policy-simulation',
        key: 'policySimulation',
        label: 'Policy Simulation',
        description: 'Safe sandbox to test and verify conflict resolution policies and logic.',
        icon: Box,
        path: '#simulation',
        color: 'from-blue-400 to-indigo-500',
        status: 'stable'
    }
];

export default function LabsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { currentWorkspace } = useWorkspace();
    const currentRole = user?.role as UserRole || 'guest';
    const [isSimulationOpen, setIsSimulationOpen] = React.useState(false);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="space-y-12">
            {/* Featured Section */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-purple-500/20 rounded-[32px] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative glass-dark rounded-[32px] border border-white/10 p-8 flex flex-col md:flex-row items-center gap-8 overflow-hidden">
                    <div className="flex-1 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-[0.2em]">
                            <Sparkles size={12} />
                            Featured Innovation
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight">The Future of Media Management</h2>
                        <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
                            MediaHive Labs is where we experiment with next-generation tools. These features are in various stages of development and may change frequently as we refine the experience.
                        </p>
                    </div>
                    <div className="relative w-full md:w-64 h-48 flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl blur-3xl animate-pulse"></div>
                        <Cpu size={120} className="text-indigo-400 drop-shadow-[0_0_30px_rgba(129,140,248,0.4)] animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                {LAB_FEATURES.map((feature) => {
                    const hasAccess = canAccessFeature(
                        feature.key,
                        currentRole,
                        currentWorkspace ? { id: currentWorkspace.institution_id, features: currentWorkspace.features } : undefined
                    );

                    return (
                        <motion.div
                            key={feature.id}
                            variants={item}
                            onClick={() => {
                                if (!hasAccess) return;
                                if (feature.path === '#simulation') {
                                    setIsSimulationOpen(true);
                                } else {
                                    nativeNavigate(feature.path, router, `Labs:${feature.label}`);
                                }
                            }}
                            className={cn(
                                "group relative overflow-hidden rounded-[28px] border p-6 transition-all duration-500 h-full flex flex-col",
                                hasAccess 
                                    ? "bg-white/[0.02] border-white/10 cursor-pointer hover:bg-white/[0.04] hover:border-white/20 hover:shadow-2xl hover:shadow-black/50" 
                                    : "bg-black/20 border-white/5 opacity-60 cursor-not-allowed grayscale"
                            )}
                        >
                            {/* Status Badge */}
                            <div className="flex justify-between items-start mb-6">
                                <div className={cn(
                                    "p-3 rounded-2xl bg-gradient-to-br transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg",
                                    feature.color,
                                    hasAccess ? "shadow-black/20" : "grayscale opacity-50 shadow-none"
                                )}>
                                    <feature.icon className="text-white" size={24} />
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    {!hasAccess ? (
                                        <div className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                            <Lock size={10} />
                                            Restricted
                                        </div>
                                    ) : (
                                        <div className={cn(
                                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                            feature.status === 'stable' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                                            feature.status === 'beta' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                                            "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                        )}>
                                            {feature.status}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 space-y-3">
                                <h3 className="text-xl font-bold text-white group-hover:text-premium-gradient transition-all">{feature.label}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed font-medium">
                                    {feature.description}
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-4 group-hover:border-white/10 transition-colors">
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] group-hover:text-white/40 transition-colors">
                                    {hasAccess ? "Access Module" : "Upgrade Required"}
                                </span>
                                {hasAccess && (
                                    <ArrowUpRight size={16} className="text-white/20 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                )}
                            </div>
                            
                            {/* Decorative Background Element */}
                            <div className={cn(
                                "absolute -bottom-12 -right-12 w-32 h-32 rounded-full blur-[64px] opacity-0 group-hover:opacity-20 transition-opacity duration-700 bg-gradient-to-br",
                                feature.color
                            )}></div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Quick Tips */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <Zap size={20} />
                    </div>
                    <h4 className="text-sm font-bold text-white">Rapid Prototyping</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        These tools are built for speed. We prioritize functionality over polish to gather early feedback.
                    </p>
                </div>
                <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <Target size={20} />
                    </div>
                    <h4 className="text-sm font-bold text-white">Continuous Feedback</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Your usage and feedback directly shape which features make it to the main dashboard.
                    </p>
                </div>
                <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <Clapperboard size={20} />
                    </div>
                    <h4 className="text-sm font-bold text-white">Project-First</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Every tool in Labs is designed to solve a specific bottleneck in the media production cycle.
                    </p>
                </div>
            </div>

            {/* Policy Simulation Panel */}
            <PolicySimulationPanel 
                isOpen={isSimulationOpen}
                onClose={() => setIsSimulationOpen(false)}
            />
        </div>
    );
}
