/**
 * Benchmark Analysis Utility
 * 
 * Calculates team performance benchmarks from snapshot data.
 * Uses deterministic percentile math for auditability.
 * 
 * Rules:
 * - Uses latest snapshot period only
 * - Requires minimum 5 team members
 * - Standard percentile calculations (P25, P50, P75)
 * - No weighting, no smoothing
 */

export interface BenchmarkResult {
    medianIps: number;
    p25Ips: number;
    p75Ips: number;
    teamSize: number;
}

export type RelativeStatus =
    | 'Top Quartile'
    | 'Above Team Median'
    | 'Below Team Median'
    | 'Bottom Quartile'
    | 'Insufficient Team Data';

export interface UserBenchmark {
    teamMedian: number;
    percentile: number;
    relativeStatus: RelativeStatus;
}

/**
 * Minimum team size required for meaningful benchmarks
 */
const MIN_TEAM_SIZE = 5;

/**
 * Calculate team performance benchmarks from IPS scores
 * 
 * @param ipsScores - Array of IPS scores (0-100 scale) from latest snapshot period
 * @returns Benchmark percentiles and team size
 * 
 * @example
 * calculateBenchmarks([50, 60, 70, 80, 90])
 * // => { medianIps: 70, p25Ips: 60, p75Ips: 80, teamSize: 5 }
 */
export function calculateBenchmarks(ipsScores: number[]): BenchmarkResult | null {
    // Require minimum team size
    if (ipsScores.length < MIN_TEAM_SIZE) {
        return null;
    }

    // Sort scores ascending for percentile calculation
    const sorted = [...ipsScores].sort((a, b) => a - b);

    // Calculate percentiles
    const p25Ips = calculatePercentile(sorted, 25);
    const medianIps = calculatePercentile(sorted, 50);
    const p75Ips = calculatePercentile(sorted, 75);

    return {
        medianIps,
        p25Ips,
        p75Ips,
        teamSize: ipsScores.length
    };
}

/**
 * Calculate a specific percentile from sorted data
 * 
 * Uses linear interpolation between ranks
 * 
 * @param sorted - Sorted array of values (ascending)
 * @param percentile - Percentile to calculate (0-100)
 * @returns Percentile value
 */
function calculatePercentile(sorted: number[], percentile: number): number {
    const n = sorted.length;

    // Calculate position (using standard percentile formula)
    const position = (percentile / 100) * (n - 1);

    // Get lower and upper indices
    const lower = Math.floor(position);
    const upper = Math.ceil(position);

    // If position is exact, return that value
    if (lower === upper) {
        return sorted[lower];
    }

    // Linear interpolation between lower and upper values
    const weight = position - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Calculate user's percentile rank within team
 * 
 * @param userIps - User's IPS score
 * @param allIps - All team IPS scores (including user)
 * @returns Percentile rank (0-100)
 * 
 * @example
 * getUserPercentile(75, [50, 60, 70, 75, 80, 90])
 * // => 60 (user is at 60th percentile)
 */
export function getUserPercentile(userIps: number, allIps: number[]): number {
    // Count how many scores are below user's score
    const belowCount = allIps.filter(ips => ips < userIps).length;

    // Calculate percentile (percentage of team below user)
    const percentile = (belowCount / allIps.length) * 100;

    return Math.round(percentile);
}

/**
 * Classify user's relative status based on benchmarks
 * 
 * @param userIps - User's IPS score
 * @param benchmarks - Team benchmark percentiles
 * @returns Relative status classification
 * 
 * @example
 * classifyRelativeStatus(85, { p25Ips: 60, medianIps: 70, p75Ips: 80 })
 * // => 'Top Quartile'
 */
export function classifyRelativeStatus(
    userIps: number,
    benchmarks: BenchmarkResult
): RelativeStatus {
    // Top quartile (≥ P75)
    if (userIps >= benchmarks.p75Ips) {
        return 'Top Quartile';
    }

    // Bottom quartile (< P25)
    if (userIps < benchmarks.p25Ips) {
        return 'Bottom Quartile';
    }

    // Above median (≥ P50)
    if (userIps >= benchmarks.medianIps) {
        return 'Above Team Median';
    }

    // Below median (< P50)
    return 'Below Team Median';
}

/**
 * Calculate complete user benchmark context
 * 
 * @param userIps - User's IPS score
 * @param allIps - All team IPS scores (including user)
 * @returns Complete benchmark context or null if insufficient data
 * 
 * @example
 * analyzeUserBenchmark(75, [50, 60, 70, 75, 80, 90])
 * // => {
 * //   teamMedian: 72.5,
 * //   percentile: 50,
 * //   relativeStatus: 'Above Team Median'
 * // }
 */
export function analyzeUserBenchmark(
    userIps: number,
    allIps: number[]
): UserBenchmark {
    // Calculate team benchmarks
    const benchmarks = calculateBenchmarks(allIps);

    // Handle insufficient team data
    if (!benchmarks) {
        return {
            teamMedian: 0,
            percentile: 0,
            relativeStatus: 'Insufficient Team Data'
        };
    }

    // Calculate user percentile
    const percentile = getUserPercentile(userIps, allIps);

    // Classify relative status
    const relativeStatus = classifyRelativeStatus(userIps, benchmarks);

    return {
        teamMedian: Math.round(benchmarks.medianIps),
        percentile,
        relativeStatus
    };
}
