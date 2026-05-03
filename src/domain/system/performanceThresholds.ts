/**
 * Performance Thresholds
 * 
 * Defines what "slow" means for this application.
 * These are not aspirational targets — they are reality checks.
 * 
 * When actual performance exceeds these thresholds, we log warnings.
 * This tells us the system is degraded, not that we need to optimize yet.
 */

// ============================================================================
// API LATENCY THRESHOLDS
// ============================================================================

/**
 * API_WARN_MS: Warning threshold for API requests
 * 
 * When an API call takes longer than this, log a warning.
 * This indicates the backend is slow but still functional.
 * 
 * Justification:
 * - Most API calls should complete in < 500ms on good networks
 * - 1200ms is slow enough to feel sluggish but not broken
 * - Users will notice but won't abandon the action yet
 */
export const API_WARN_MS = 1200;

/**
 * API_FAIL_MS: Failure threshold for API requests
 * 
 * When an API call takes longer than this, consider it failed.
 * This indicates the backend is severely degraded or unreachable.
 * 
 * Justification:
 * - 3000ms (3 seconds) is the psychological threshold for "broken"
 * - Beyond this, users assume the app is down
 * - Should trigger timeout/retry logic
 */
export const API_FAIL_MS = 3000;

// ============================================================================
// PAGE SETTLE THRESHOLDS
// ============================================================================

/**
 * PAGE_SETTLE_MS: Time for page to become interactive
 * 
 * From navigation start to when the page is fully settled:
 * - Data loaded
 * - Skeletons replaced with content
 * - No more layout shifts
 * - User can interact
 * 
 * Justification:
 * - 1800ms (1.8s) is the threshold where users perceive "slowness"
 * - Includes network latency + render time + hydration
 * - Faster than this = feels instant
 * - Slower than this = feels sluggish
 */
export const PAGE_SETTLE_MS = 1800;

// ============================================================================
// USER-VISIBLE STALL THRESHOLDS
// ============================================================================

/**
 * USER_STALL_MS: Maximum acceptable UI freeze/stall
 * 
 * How long the UI can be unresponsive before users notice.
 * This includes:
 * - JavaScript blocking the main thread
 * - Heavy rendering operations
 * - Synchronous data processing
 * 
 * Justification:
 * - 100ms is the threshold for "instant" feedback
 * - Beyond this, users perceive lag
 * - 200ms is the absolute maximum before it feels broken
 * - This is based on human perception research (Jakob Nielsen)
 */
export const USER_STALL_MS = 200;

// ============================================================================
// CONSOLIDATED EXPORT
// ============================================================================

/**
 * Performance thresholds object for easy import.
 * Usage: import { PERFORMANCE_THRESHOLDS } from '@/config/performanceThresholds';
 */
export const PERFORMANCE_THRESHOLDS = {
    API_WARN_MS,
    API_FAIL_MS,
    PAGE_SETTLE_MS,
    USER_STALL_MS,
} as const;

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example: API latency monitoring
 * 
 * const start = Date.now();
 * const response = await apiClient('/api/tasks');
 * const duration = Date.now() - start;
 * 
 * if (duration > API_FAIL_MS) {
 *   console.error(`[PERF] API timeout: ${duration}ms (threshold: ${API_FAIL_MS}ms)`);
 * } else if (duration > API_WARN_MS) {
 *   console.warn(`[PERF] API slow: ${duration}ms (threshold: ${API_WARN_MS}ms)`);
 * }
 */

/**
 * Example: Page settle monitoring
 * 
 * const navigationStart = performance.timing.navigationStart;
 * const settled = Date.now();
 * const duration = settled - navigationStart;
 * 
 * if (duration > PAGE_SETTLE_MS) {
 *   console.warn(`[PERF] Page slow to settle: ${duration}ms (threshold: ${PAGE_SETTLE_MS}ms)`);
 * }
 */

/**
 * Example: UI stall detection
 * 
 * const start = performance.now();
 * // Heavy operation
 * processLargeDataset();
 * const duration = performance.now() - start;
 * 
 * if (duration > USER_STALL_MS) {
 *   console.warn(`[PERF] UI stall detected: ${duration}ms (threshold: ${USER_STALL_MS}ms)`);
 * }
 */
