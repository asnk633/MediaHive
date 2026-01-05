// Feature flags configuration
export const FEATURE_FLAGS = {
  // Enable/disable event-to-task automation
  EVENT_TASK_AUTOMATION: process.env.EVENT_TASK_AUTOMATION_ENABLED === 'true' || true,
  
  // Enable/disable stale task alert automation
  STALE_TASK_ALERTS: process.env.STALE_TASK_ALERTS_ENABLED === 'true' || true,
  
  // Other feature flags can be added here
} as const;