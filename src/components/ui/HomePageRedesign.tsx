// src/components/ui/HomePageRedesign.tsx
"use client";

import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { PageSection } from "@/components/ui/layout/PageSection";
import FAB from "@/client/components/FAB";
import BottomNav from "@/components/ui/BottomNav";

export default function HomePageRedesign() {
  return (
    <>
      <PageLayout mode="standard">
        {/* Added top spacing for arrival pause - Increased breathing room */}
        <div className="pt-6 pb-2">
          <PageHeader
            title="System Overview"
            description="Operational status and active items."
            size="large"
          />
        </div>

        <PageSection title="Priority Items">
          <div className="grid gap-4">
            {/* Card 1: Observational, not urgent */}
            <div className="p-6 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.05] flex justify-between items-center group hover:bg-foreground/[0.05] transition-colors">
              <div>
                <div className="bg-blue-500/10 text-blue-400 text-xs font-medium px-2 py-1 rounded w-fit mb-2">Review Required</div>
                <div className="text-slate-300 font-normal">Monthly Performance Report</div>
              </div>
              <div className="text-sm text-slate-500 group-hover:text-slate-400 transition-colors">Due Today</div>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.05] flex justify-between items-center group hover:bg-foreground/[0.05] transition-colors">
              <div>
                <div className="bg-emerald-500/10 text-emerald-400 text-xs font-medium px-2 py-1 rounded w-fit mb-2">Scheduled</div>
                <div className="text-slate-300 font-normal">Inventory Audit</div>
              </div>
              <div className="text-sm text-slate-500 group-hover:text-slate-400 transition-colors">Tomorrow</div>
            </div>
          </div>
        </PageSection>

        {/* Empty State / Calm Anchor - Refined baseline */}
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 opacity-40">
          <div className="h-0.5 w-8 bg-slate-700/50 rounded-full"></div>
          <p className="text-xs text-slate-500 tracking-wide">All systems nominal</p>
        </div>

      </PageLayout>

      {/* Visual-only FAB */}
      <FAB />
      <BottomNav />
    </>
  );
}
