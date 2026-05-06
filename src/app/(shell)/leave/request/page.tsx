'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LeaveRequestForm } from '@/components/leave/LeaveRequestForm';
import { ChevronLeft, Umbrella, Info } from 'lucide-react';
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { useAuth } from '@/contexts/AuthContextProvider';
import { useWorkspace } from '@/system/workspace/WorkspaceProvider';
import { motion } from 'framer-motion';

export default function RequestLeavePage() {
    const router = useRouter();
    const { user } = useAuth();
    const { currentWorkspace } = useWorkspace();

    // Restriction check for Media & IT
    const isMediaOrIT = currentWorkspace?.name?.toLowerCase().includes('media') || 
                       currentWorkspace?.name?.toLowerCase().includes('it') ||
                       user?.role === 'admin';

    if (!isMediaOrIT && user) {
        return (
            <PageLayout mode="plain">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="max-w-md w-full glass-liquid p-8 rounded-[32px] border-white/5 text-center space-y-6">
                        <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 mx-auto">
                            <Info size={32} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white mb-2">Service Restricted</h1>
                            <p className="text-sm text-white/40 leading-relaxed">
                                Leave management via this portal is currently reserved for the Media & IT departments. 
                                Please contact HR for other department leave requests.
                            </p>
                        </div>
                        <button 
                            onClick={() => router.push('/home')}
                            className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold text-white transition-all border border-white/5"
                        >
                            Return to Home
                        </button>
                    </div>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout mode="plain" className="pt-8 pb-20">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header Section */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => router.back()}
                            className="p-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-2xl transition-all active:scale-95 border border-white/5"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-1.5 bg-blue-500/20 rounded-lg">
                                    <Umbrella size={16} className="text-blue-400" />
                                </div>
                                <h1 className="text-3xl font-bold text-white tracking-tight">
                                    Request Leave
                                </h1>
                            </div>
                            <p className="text-white/40 text-sm font-medium">
                                Media & IT Department • Official Portal
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Form Section */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="glass-liquid border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                    <div className="relative z-10">
                        <LeaveRequestForm
                            onSuccess={() => router.push('/leave/my-requests')}
                            onCancel={() => router.back()}
                        />
                    </div>
                </motion.div>

                {/* Info Footer */}
                <div className="flex items-start gap-4 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                    <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-white/70">Important Notice</p>
                        <p className="text-xs text-white/30 leading-relaxed">
                            Please ensure your leave request is submitted at least 3 days in advance for casual leave and 30 days for planned leave. 
                            Your supervisor will be notified automatically upon submission.
                        </p>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
