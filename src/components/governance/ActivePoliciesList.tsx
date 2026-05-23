'use client';

import React from 'react';
import { defaultPolicies } from '@/domain/conflicts/conflictPolicies';
import { ShieldAlert, Info, Zap, ChevronRight, Box } from 'lucide-react';

export const ActivePoliciesList: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold text-foreground">Active System Policies</h3>
                <p className="text-sm text-foreground/80 font-medium tracking-tight leading-relaxed">
                    Deterministic rules governing conflict resolution and data integrity.
                </p>
            </div>

            <div className="space-y-4">
                {defaultPolicies.map((policy) => (
                    <div
                        key={policy.id}
                        className="group bg-foreground/5 border border-foreground/10 rounded-[32px] p-6 hover:bg-foreground/[0.08] hover:border-foreground/20 transition-all duration-300 relative overflow-hidden"
                    >
                        {/* Status chip */}
                        <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-blue-500 text-foreground text-[9px] font-black uppercase tracking-wider shadow-lg">
                            Active
                        </div>

                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                    <ShieldAlert size={24} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-lg font-bold text-foreground">{policy.name}</span>
                                    <span className="text-xs font-medium text-foreground/70 tracking-tight">{policy.description}</span>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6 pt-6 border-t border-foreground/5">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground/80">
                                        <Zap size={12} className="text-amber-400" />
                                        Trigger
                                    </div>
                                    <p className="text-sm text-foreground/80 font-medium leading-relaxed">{policy.metadata.trigger}</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground/80">
                                        <Info size={12} className="text-blue-400" />
                                        Suggested Outcome
                                    </div>
                                    <p className="text-sm text-foreground/80 font-medium leading-relaxed">{policy.metadata.suggestedOutcome}</p>
                                </div>
                                <div className="flex items-end justify-end">
                                    <button
                                        className="flex items-center gap-2 py-2 px-4 bg-foreground/5 hover:bg-blue-500 text-foreground rounded-xl text-xs font-bold transition-all group/btn"
                                        onClick={() => {
                                            // We'll wire this to jump to simulation later
                                            window.location.hash = 'simulation';
                                        }}
                                    >
                                        <Box size={14} className="group-hover/btn:scale-110 transition-transform" />
                                        Test in Sandbox
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
