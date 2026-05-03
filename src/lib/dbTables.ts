export const TABLES = {
  // Core
  USERS: "profiles", // Maps to profiles table in public schema
  EVENTS: "events",
  TASKS: "tasks",
  TASK_ASSIGNMENTS: "task_assignments",
  CAMPAIGNS: "campaigns",
  AUDIT_LOG: "audit_log",
  NOTIFICATIONS: "notifications",
  
  // Organization
  INSTITUTIONS: "institutions",
  DEPARTMENTS: "departments",
  UNITS: "units",
  TENANTS: "tenants",
  
  // Resources
  INVENTORY: "inventory",
  EQUIPMENT_BOOKINGS: "equipment_bookings",
  INVENTORY_REQUESTS: "inventory_requests",
  INVENTORY_ISSUES: "inventory_issues",
  DEVICE_REQUESTS: "device_requests",
  
  // Media & Files
  MEDIA: "files", // Corrected mapping for media -> files
  FILES: "files",
  DRIVE_QUEUE: "drive_queue",
  
  // Event Specific
  EVENT_CREW: "event_crew",
  EVENT_EQUIPMENT: "event_equipment",
  SYSTEM_EVENTS: "system_events",
} as const;

export type TableName = typeof TABLES[keyof typeof TABLES];
