/**
 * Department Health Calculations Utility
 * Extracted from /api/admin/intelligence for reuse in snapshot generation
 */

import { PerformanceMetrics } from './performanceCalculations';

export interface DepartmentHealthMetrics {
    avgTCR: number; // Average Task Completion Rate (0-1)
    avgOTR: number; // Average On-Time Rate (0-1)
    avgOLR: number; // Average Overdue Load Ratio (0-1)
    avgADS: number; // Average Attendance Discipline Score (0-1)
    dhs: number; // Department Health Score (0-1)
    dhsScore: number; // DHS as percentage (0-100)
    status: 'Healthy' | 'Strained' | 'Poor Performance';

    // Aggregate counts
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    activeTasks: number;
    teamMemberCount: number;
}

/**
 * Calculate Department Health Score (DHS) from individual performance metrics
 * Formula: (TCR*0.4) + (OTR*0.3) + ((1-OLR)*0.2) + (ADS*0.1)
 */
export function calculateDepartmentHealth(
    performanceMetrics: PerformanceMetrics[]
): DepartmentHealthMetrics {
    const teamSize = performanceMetrics.length || 1;

    // Calculate averages across all team members
    const avgTCR = performanceMetrics.reduce((sum, m) => sum + m.tcr, 0) / teamSize;
    const avgOTR = performanceMetrics.reduce((sum, m) => sum + m.otr, 0) / teamSize;
    const avgOLR = performanceMetrics.reduce((sum, m) => sum + m.olr, 0) / teamSize;
    const avgADS = performanceMetrics.reduce((sum, m) => sum + m.ads, 0) / teamSize;

    // Calculate Department Health Score
    const dhs = (avgTCR * 0.4) + (avgOTR * 0.3) + ((1 - avgOLR) * 0.2) + (avgADS * 0.1);
    const dhsScore = Math.round(dhs * 100);

    // Determine health status
    let status: 'Healthy' | 'Strained' | 'Poor Performance' = 'Healthy';
    if (dhsScore < 60) status = 'Poor Performance';
    else if (dhsScore < 80) status = 'Strained';

    // Aggregate task counts
    const totalTasks = performanceMetrics.reduce((sum, m) => sum + m.assignedTasks, 0);
    const completedTasks = performanceMetrics.reduce((sum, m) => sum + m.completedTasks, 0);
    const overdueTasks = performanceMetrics.reduce((sum, m) => sum + m.overdueTasks, 0);
    const activeTasks = performanceMetrics.reduce((sum, m) => sum + m.activeTasks, 0);

    return {
        avgTCR,
        avgOTR,
        avgOLR,
        avgADS,
        dhs,
        dhsScore,
        status,
        totalTasks,
        completedTasks,
        overdueTasks,
        activeTasks,
        teamMemberCount: performanceMetrics.length
    };
}

/**
 * Get health status color for UI
 */
export function getHealthStatusColor(status: 'Healthy' | 'Strained' | 'Poor Performance'): {
    text: string;
    bg: string;
    border: string;
} {
    switch (status) {
        case 'Healthy':
            return {
                text: 'text-green-400',
                bg: 'bg-green-500/10',
                border: 'border-green-500/20'
            };
        case 'Strained':
            return {
                text: 'text-yellow-400',
                bg: 'bg-yellow-500/10',
                border: 'border-yellow-500/20'
            };
        case 'Poor Performance':
            return {
                text: 'text-red-500',
                bg: 'bg-red-500/10',
                border: 'border-red-500/20'
            };
    }
}
