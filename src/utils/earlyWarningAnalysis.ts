/**
 * Early Warning Analysis Utility
 * 
 * Detects early warning signals for potential underperformance.
 * Uses deterministic rules based on trend, benchmark, and IPS thresholds.
 * 
 * Rules:
 * - Uses exactly last 3 snapshots
 * - Rule A: Declining trend → +1 risk
 * - Rule B: Dropped below team median → +1 risk
 * - Rule C: IPS in 60-70 range → +1 risk
 * - Risk Level: 0 triggers = Low, 1 = Medium, 2+ = High
 */

import type { TrendClassification } from './trendAnalysis';
import type { UserBenchmark } from './benchmarkAnalysis';

export interface EarlyWarningResult {
    riskLevel: 'Low' | 'Medium' | 'High';
    reasons: string[];
}

/**
 * IPS threshold range that indicates approaching underperformance
 */
const IPS_THRESHOLD_MIN = 60;
const IPS_THRESHOLD_MAX = 70;

/**
 * Minimum snapshots required for early warning analysis
 */
const MIN_SNAPSHOTS = 3;

/**
 * Analyze early warning signals for potential underperformance
 * 
 * @param history - Performance history items with IPS scores
 * @param benchmark - User's benchmark context (team median, percentile, status)
 * @param trend - User's trend classification
 * @returns Early warning result or null if insufficient data
 * 
 * @example
 * analyzeEarlyWarning(history, benchmark, 'Declining')
 * // => { riskLevel: 'High', reasons: ['Consistent decline...', 'Dropped below...'] }
 */
export function analyzeEarlyWarning<T extends { ipsScore: number }>(
    history: T[],
    benchmark: UserBenchmark | null,
    trend: TrendClassification
): EarlyWarningResult | null {
    // Require minimum snapshots
    if (history.length < MIN_SNAPSHOTS) {
        return null;
    }

    // Get last 3 snapshots
    const last3 = history.slice(-3);
    const currentIps = last3[last3.length - 1].ipsScore;

    // Initialize risk tracking
    let riskPoints = 0;
    const reasons: string[] = [];

    // Rule A: Trend Risk
    if (trend === 'Declining') {
        riskPoints++;
        reasons.push('Consistent decline over last 3 periods');
    }

    // Rule B: Benchmark Drop (only if benchmark data available)
    if (benchmark && benchmark.relativeStatus !== 'Insufficient Team Data') {
        // Check if user is below team median
        if (benchmark.relativeStatus === 'Below Team Median' ||
            benchmark.relativeStatus === 'Bottom Quartile') {
            // Additional check: verify they weren't always below median
            // (we want to detect a DROP, not just being below)
            // For now, we'll trigger if they're below median
            // A more sophisticated version would track historical status
            if (benchmark.relativeStatus === 'Below Team Median' ||
                benchmark.relativeStatus === 'Bottom Quartile') {
                riskPoints++;
                reasons.push('Dropped below team median');
            }
        }
    }

    // Rule C: IPS Threshold Pressure
    // Only trigger if NOT already underperforming (< 60)
    if (currentIps >= IPS_THRESHOLD_MIN && currentIps <= IPS_THRESHOLD_MAX) {
        riskPoints++;
        reasons.push('IPS approaching underperformance threshold');
    }

    // Map risk points to risk level
    const riskLevel = mapRiskLevel(riskPoints);

    return {
        riskLevel,
        reasons
    };
}

/**
 * Map risk points to risk level
 * 
 * @param riskPoints - Number of triggered rules (0-3)
 * @returns Risk level classification
 */
function mapRiskLevel(riskPoints: number): 'Low' | 'Medium' | 'High' {
    if (riskPoints === 0) {
        return 'Low';
    } else if (riskPoints === 1) {
        return 'Medium';
    } else {
        return 'High';
    }
}

/**
 * Check if user has dropped below team median
 * 
 * This is a simplified version. A more sophisticated implementation
 * would track historical benchmark status to detect actual drops.
 * 
 * @param currentStatus - Current relative status
 * @param previousStatuses - Historical relative statuses (if available)
 * @returns True if user dropped below median
 */
export function hasDroppedBelowMedian(
    currentStatus: string,
    previousStatuses?: string[]
): boolean {
    // Current implementation: simple check if below median
    // Future enhancement: compare with previous status to detect actual drop
    const isBelowMedian =
        currentStatus === 'Below Team Median' ||
        currentStatus === 'Bottom Quartile';

    if (!previousStatuses || previousStatuses.length === 0) {
        return isBelowMedian;
    }

    // Check if any previous status was above median
    const wasAboveMedian = previousStatuses.some(status =>
        status === 'Above Team Median' || status === 'Top Quartile'
    );

    // Only trigger if they WERE above median and now are below
    return isBelowMedian && wasAboveMedian;
}
