'use client';

import React, { useState } from 'react';
import { PageLayout } from '@/components/ui/layout/PageLayout';
import { PageHeader } from '@/components/ui/layout/PageHeader';
import { RoleAuthorityMap } from './RoleAuthorityMap';
import { ActivePoliciesList } from './ActivePoliciesList';
import { GovernanceActivityLog } from './GovernanceActivityLog';
import { PolicySimulationPanel } from '@/components/tasks/PolicySimulationPanel';
import { ShieldCheck, Info, Box } from 'lucide-react';

export const GovernanceDashboard: React.FC = () => {
    const [isSimulationOpen, setIsSimulationOpen] = useState(false);

    return (
        <PageLayout>
            <PageHeader
                title="Institutional Governance"
                description="Transparency into system rules, role-based power, and conflict resolution policies."
                actions={
                    <button
                        onClick={() => setIsSimulationOpen(true)}
                        className="h-11 px-6 bg-blue-600 hover:bg-blue-500 text-foreground rounded-[20px] font-bold text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 group"
                    >
                        <Box size={18} className="group-hover:scale-110 transition-transform" />
                        Open Simulation Sandbox
                    </button>
                }
            />

            <div className="space-y-16 py-8">
                {/* 1. Authority Map */}
                <section>
                    <RoleAuthorityMap />
                </section>

                <div className="h-px bg-foreground/5" />

                {/* 2. Active Policies */}
                <section>
                    <ActivePoliciesList />
                </section>

                <div className="h-px bg-foreground/5" />

                {/* 3. Education / Rules Summary */}
                <section className="bg-blue-500/5 border border-blue-500/10 rounded-[48px] p-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                            <Info size={40} className="text-blue-400" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-foreground tracking-tight">Understanding Conflict Resolution</h3>
                            <p className="text-foreground/80 leading-relaxed max-w-2xl">
                                MediaHive uses a <b>deterministic governance model</b>. This means whenever two users attempt to edit the same task field simultaneously, the system evaluates the context (Roles, Field Type, Safety Rules) to provide a "Suggested" resolution. This ensures that organizational intent is maintained while allowing human finality through manual review.
                            </p>
                            <div className="flex gap-4">
                                <div className="px-4 py-2 bg-foreground/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-foreground/70 border border-foreground/10">
                                    No Silent Overwrites
                                </div>
                                <div className="px-4 py-2 bg-foreground/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-foreground/70 border border-foreground/10">
                                    Explicit Accountability
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="h-px bg-foreground/5" />

                {/* 4. Governance Log */}
                <section>
                    <GovernanceActivityLog />
                </section>
            </div>

            <PolicySimulationPanel
                isOpen={isSimulationOpen}
                onClose={() => setIsSimulationOpen(false)}
            />
        </PageLayout>
    );
};
