/**
 * System Limits & Constraints
 * 
 * Single source of truth for all bounded behaviors in the application.
 * These limits are used across backend queries, metadata responses, and UI disclosure.
 * 
 * DO NOT use magic numbers elsewhere. Import from this file.
 */

// ============================================================================
// DATA FETCH LIMITS
// ============================================================================

/**
 * Maximum number of tasks fetched in a single request.
 * Used in: CanonicalDataService.getTasks(), backend /api/tasks
 * Reason: Performance safeguard to prevent O(N) reads on large datasets
 */
export const TASK_FETCH_LIMIT = 50;

/**
 * Maximum number of events fetched in a single request.
 * Used in: CanonicalDataService.getEvents(), backend /api/events
 * Reason: Performance safeguard to prevent O(N) reads on large datasets
 */
export const EVENT_FETCH_LIMIT = 50;

/**
 * Maximum number of campaigns fetched in a single request.
 * Used in: CampaignService.getUserCampaigns(), backend /api/campaigns
 * Reason: Performance safeguard to prevent O(N) reads on large datasets
 */
export const CAMPAIGN_FETCH_LIMIT = 100;

/**
 * Maximum number of users fetched in a single request.
 * Used in: UserService.getUsers(), backend /api/users
 * Reason: Performance safeguard to prevent O(N) reads on large datasets
 */
export const USER_FETCH_LIMIT = 100;

// ============================================================================
// API TIMEOUTS
// ============================================================================

/**
 * Maximum time (ms) to wait for an API request before aborting.
 * Used in: apiClient.ts
 * Reason: Prevent infinite hangs on slow networks or backend issues
 */
export const API_REQUEST_TIMEOUT = 60000; // 60 seconds

/**
 * Maximum time (ms) to wait for a file upload before aborting.
 * Used in: File upload services
 * Reason: Large files may take longer than standard API requests
 */
export const FILE_UPLOAD_TIMEOUT = 300000; // 5 minutes

// ============================================================================
// RETRY & BACKOFF
// ============================================================================

/**
 * Maximum number of retry attempts for failed API requests.
 * Used in: apiClient.ts retry logic
 * Reason: Balance between resilience and avoiding infinite loops
 */
export const MAX_API_RETRIES = 3;

/**
 * Base delay (ms) for exponential backoff between retries.
 * Used in: apiClient.ts retry logic
 * Reason: Prevent thundering herd on backend recovery
 */
export const RETRY_BASE_DELAY = 1000; // 1 second

// ============================================================================
// PAGINATION & UI
// ============================================================================

/**
 * Number of items to display per page in paginated lists.
 * Used in: Future pagination implementations
 * Reason: Balance between UX and performance
 */
export const ITEMS_PER_PAGE = 25;

/**
 * Maximum number of items to display in a widget before truncating.
 * Used in: Dashboard widgets (e.g., DueSoonWidget, ActivityFeed)
 * Reason: Prevent widget overflow and maintain dashboard performance
 */
export const WIDGET_ITEM_LIMIT = 10;

// ============================================================================
// CACHE & STALENESS
// ============================================================================

/**
 * Time (ms) before cached data is considered stale.
 * Used in: Data fetching services with cache
 * Reason: Balance between freshness and reducing API calls
 */
export const CACHE_STALENESS_THRESHOLD = 300000; // 5 minutes

/**
 * Number of days before completed tasks are considered "old" and filtered out.
 * Used in: CanonicalDataService.getTasks() virtual cleanup
 * Reason: Keep UI clean while preserving recent completion history
 */
export const COMPLETED_TASK_RETENTION_DAYS = 7;

// ============================================================================
// FILE & MEDIA
// ============================================================================

/**
 * Maximum file size (bytes) for uploads.
 * Used in: File upload validation
 * Reason: Prevent backend overload and storage abuse
 */
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

/**
 * Maximum number of files that can be uploaded at once.
 * Used in: Bulk upload features
 * Reason: Prevent UI/backend overload
 */
export const MAX_BULK_UPLOAD_COUNT = 10;

// ============================================================================
// POLLING & REFRESH
// ============================================================================

/**
 * Interval (ms) for polling data in web environment.
 * Used in: TasksPageClient, HomeClient polling logic
 * Reason: Keep data fresh without overwhelming backend
 */
export const WEB_POLLING_INTERVAL = 30000; // 30 seconds

/**
 * Interval (ms) for polling data in native environment.
 * Used in: Native app polling logic
 * Reason: Native apps should poll less frequently to save battery
 */
export const NATIVE_POLLING_INTERVAL = 60000; // 60 seconds

// ============================================================================
// VALIDATION & CONSTRAINTS
// ============================================================================

/**
 * Maximum length for task titles.
 * Used in: Task creation/edit validation
 * Reason: Prevent UI overflow and database constraints
 */
export const MAX_TASK_TITLE_LENGTH = 200;

/**
 * Maximum length for task descriptions.
 * Used in: Task creation/edit validation
 * Reason: Prevent database constraints and performance issues
 */
export const MAX_TASK_DESCRIPTION_LENGTH = 5000;

/**
 * Maximum number of assignees per task.
 * Used in: Task assignment validation
 * Reason: Prevent UI overflow and maintain clarity
 */
export const MAX_TASK_ASSIGNEES = 10;

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Consolidated system limits object for easy import.
 * Usage: import { SYSTEM_LIMITS } from '@/config/systemLimits';
 */
export const SYSTEM_LIMITS = {
    // Data Fetch
    TASK_FETCH_LIMIT,
    EVENT_FETCH_LIMIT,
    CAMPAIGN_FETCH_LIMIT,
    USER_FETCH_LIMIT,

    // API Timeouts
    API_REQUEST_TIMEOUT,
    FILE_UPLOAD_TIMEOUT,

    // Retry & Backoff
    MAX_API_RETRIES,
    RETRY_BASE_DELAY,

    // Pagination & UI
    ITEMS_PER_PAGE,
    WIDGET_ITEM_LIMIT,

    // Cache & Staleness
    CACHE_STALENESS_THRESHOLD,
    COMPLETED_TASK_RETENTION_DAYS,

    // File & Media
    MAX_FILE_SIZE,
    MAX_BULK_UPLOAD_COUNT,

    // Polling & Refresh
    WEB_POLLING_INTERVAL,
    NATIVE_POLLING_INTERVAL,

    // Validation & Constraints
    MAX_TASK_TITLE_LENGTH,
    MAX_TASK_DESCRIPTION_LENGTH,
    MAX_TASK_ASSIGNEES,
} as const;
