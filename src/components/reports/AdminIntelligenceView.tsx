import React from 'react';
import { HealthScoreWidget } from './widgets/HealthScoreWidget';
import { ExecutiveBriefingWidget } from './widgets/ExecutiveBriefingWidget';
import { RiskDistributionWidget } from './widgets/RiskDistributionWidget';

interface OverviewData {
    totalInventory: number;
    lowStock: number;
    outOfStock: number;
    totalTasks: number;
    // ... other fields from API
}

interface AdminIntelligenceViewProps {
    overview: OverviewData | null;
    loading: boolean;
}

export const AdminIntelligenceView: React.FC<AdminIntelligenceViewProps> = ({ overview, loading }) => {

    // Client-side Intelligence Derivation (Simulation based on real counters)
    // In a real scenario, this would potentially come from a specialized API.
    // Here we derive "Health" from inventory status to demonstrate the UI structure safely.

    const lowStock = overview?.lowStock || 0;
    const outOfStock = overview?.outOfStock || 0;

    // Penalty Algorithm: -5 for Out, -2 for Low
    const penalty = (outOfStock * 5) + (lowStock * 2);
    const healthScore = Math.max(0, 100 - penalty);

    // Briefing Generation (Narrative UI)
    const briefingPoints = [];
    if (healthScore === 100) {
        briefingPoints.push("System health is optimal. No critical interventions required.");
    } else if (healthScore > 80) {
        briefingPoints.push("Minor supply chain warnings detected. Review low stock items.");
    } else {
        briefingPoints.push("Critical supply chain issues affecting operational readiness.");
    }

    if (outOfStock > 0) {
        briefingPoints.push(`${outOfStock} items are completely out of stock and may block production.`);
    }

    briefingPoints.push("Performance metrics remain stable compared to the last period."); // Placeholder for Task stats

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Row: Health & Briefing */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Health Score (Hero) */}
                <div className="lg:col-span-1">
                    <HealthScoreWidget score={healthScore} className="h-full" />
                </div>

                {/* Executive Briefing */}
                <div className="lg:col-span-2">
                    <ExecutiveBriefingWidget points={briefingPoints} loading={loading} />
                </div>
            </div>

            {/* Second Row: Risk & Context */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Risk Distribution (Mocked for UI Concept using Inventory Data proxy) */}
                <div className="lg:col-span-1">
                    <RiskDistributionWidget
                        riskCount={overview?.outOfStock || 0}
                        safeCount={overview?.totalInventory || 0}
                    />
                </div>

                {/* Placeholders for future modules (Financials, etc.) */}
                <div className="lg:col-span-2 bg-slate-900/20 border border-white/5 rounded-xl p-6 flex items-center justify-center text-slate-500 border-dashed">
                    <span className="text-sm">Additional Metrics (Financials, Task Aging) coming in Phase 4</span>
                </div>
            </div>
        </div>
    );
};
