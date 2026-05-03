'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { NormalizedTask, NormalizedEvent } from "@/lib/normalization";
import { DashboardMetrics } from '@/lib/dashboardMetrics';

interface DashboardContextType {
    tasks: NormalizedTask[];
    events: NormalizedEvent[];
    metrics: DashboardMetrics | null;
    loading: boolean;
    error: string | null;
    mutate: (...args: any[]) => void | Promise<void>; // Aligned with useOptimisticTasks mutate
    refresh: (signal?: AbortSignal) => Promise<void>;
    user: any; // Add user for role-based widget filtering within components if needed
}

export const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

interface DashboardProviderProps {
    children: ReactNode;
    value: DashboardContextType;
}

/**
 * DashboardProvider provides a unified data stream to all registered widgets.
 * This prevents prop drilling and allows widgets to be rendered dynamically 
 * from the Registry while still remaining reactive to dashboard-level data updates.
 */
export function DashboardProvider({ children, value }: DashboardProviderProps) {
    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
}

/**
 * Hook for widgets to access dashboard data.
 */
export function useDashboard() {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
}
