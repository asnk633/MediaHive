'use client';

import React from 'react';
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { NextProductionCard } from '@/features/dashboard/components/NextProductionCard';
import { motion } from 'framer-motion';
import { Video, Info } from 'lucide-react';

export default function ProductionCenterPage() {
    return (
        <PageLayout mode="plain">
            <div className="max-w-4xl mx-auto space-y-12 py-4">
                <PageHeader 
                    title="Production Center"
                    description="Operational focus and production lifecycle management."
                />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-[24px] bg-blue-500/5 border border-blue-500/10 flex gap-4 items-start"
                >
                    <Info size={20} className="text-blue-400 shrink-0 mt-1" />
                    <div className="space-y-1">
                        <h3 className="text-sm font-bold text-white">Laboratory Feature</h3>
                        <p className="text-xs text-white/50 leading-relaxed uppercase tracking-wider">
                            The Production Center provides high-fidelity tracking for your upcoming shoots. 
                            This feature is currently in the Laboratory for further refinement of the automated crew and equipment allocation engine.
                        </p>
                    </div>
                </motion.div>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <NextProductionCard />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-40 grayscale pointer-events-none select-none pt-4">
                    <div className="p-12 rounded-[40px] border border-dashed border-white/10 flex flex-col items-center justify-center text-center bg-white/[0.01]">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/20 mb-3">Upcoming</span>
                        <h4 className="text-sm font-bold text-white/40 uppercase tracking-tighter">Resource Allocation Engine</h4>
                    </div>
                    <div className="p-12 rounded-[40px] border border-dashed border-white/10 flex flex-col items-center justify-center text-center bg-white/[0.01]">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/20 mb-3">Upcoming</span>
                        <h4 className="text-sm font-bold text-white/40 uppercase tracking-tighter">Automated Crew Sync</h4>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
