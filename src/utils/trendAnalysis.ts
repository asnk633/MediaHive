/**
 * Trend Analysis Utility
 * 
 * Classifies performance trends based on historical IPS scores.
 * Uses deterministic, rule-based logic for auditability.
 * 
 * Rules:
 * - Requires minimum 3 data points
 * - Uses last 3 snapshots only
 * - Classifies based on consecutive deltas
 * - No ML, no averages, no smoothing
 */

export type TrendClassification =
    | 'Improving'
    | 'Declining'
    | 'Stable'
    | 'Volatile'
    | 'Insufficient Data';

export interface TrendResult {
    trend: TrendClassification;
    delta: number;
}

/**
 * Threshold for considering a delta as "near zero" (stable)
 * Deltas within ±5 points are considered stable
 */
const STABLE_THRESHOLD = 5;

/**
 * Classify performance trend based on IPS score history
 * 
 * @param history - Array of IPS scores (0-100 scale)
 * @returns Trend classification and delta
 * 
 * @example
 * // Improving trend
 * analyzeTrend([72, 85, 88]) 
 * // => { trend: 'Improving', delta: 16 }
 * 
 * @example
 * // Declining trend
 * analyzeTrend([88, 75, 70])
 * // => { trend: 'Declining', delta: -18 }
 * 
 * @example
 * // Insufficient data
 * analyzeTrend([88, 90])
 * // => { trend: 'Insufficient Data', delta: 0 }
 */
export function analyzeTrend(history: number[]): TrendResult {
    // Require minimum 3 data points
    if (history.length < 3) {
        return {
            trend: 'Insufficient Data',
            delta: 0
        };
    }

    // Extract last 3 scores
    const last3 = history.slice(-3);

    // Calculate deltas between consecutive scores
    const delta1 = last3[1] - last3[0]; // Second - First
    const delta2 = last3[2] - last3[1]; // Third - Second

    // Calculate total delta (latest - oldest of last 3)
    const totalDelta = last3[2] - last3[0];

    // Classify based on delta patterns
    const trend = classifyTrend(delta1, delta2);

    return {
        trend,
        delta: Math.round(totalDelta)
    };
}

/**
 * Classify trend based on two consecutive deltas
 * 
 * @param delta1 - First delta (second - first)
 * @param delta2 - Second delta (third - second)
 * @returns Trend classification
 */
function classifyTrend(delta1: number, delta2: number): TrendClassification {
    const isPositive1 = delta1 > STABLE_THRESHOLD;
    const isNegative1 = delta1 < -STABLE_THRESHOLD;
    const isPositive2 = delta2 > STABLE_THRESHOLD;
    const isNegative2 = delta2 < -STABLE_THRESHOLD;

    // Both deltas positive → Improving
    if (isPositive1 && isPositive2) {
        return 'Improving';
    }

    // Both deltas negative → Declining
    if (isNegative1 && isNegative2) {
        return 'Declining';
    }

    // Mixed signs → Volatile
    if ((isPositive1 && isNegative2) || (isNegative1 && isPositive2)) {
        return 'Volatile';
    }

    // Both near zero → Stable
    return 'Stable';
}

/**
 * Helper function to extract IPS scores from performance history
 * 
 * @param history - Array of performance history items with ipsScore field
 * @returns Array of IPS scores
 */
export function extractIpsScores<T extends { ipsScore: number }>(history: T[]): number[] {
    return history.map(item => item.ipsScore);
}
