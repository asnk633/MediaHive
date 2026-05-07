import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Tenants table for multi-tenant support
export const tenants = sqliteTable('tenants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  logo: text('logo'),
  domain: text('domain').notNull().unique(),
  settings: text('settings', { mode: 'json' }),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

// Institutions table
export const institutions = sqliteTable('institutions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  created_at: text('created_at').notNull(),
});

// Departments table
export const departments = sqliteTable('departments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  created_at: text('created_at').notNull(),
});

// Users table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  avatar_url: text('avatar_url'),
  role: text('role').notNull(), // 'admin', 'manager', 'team', 'member'
  institution_id: integer('institution_id').notNull().references(() => institutions.id),
  department_id: integer('department_id').references(() => departments.id),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

// Junction table for user-department many-to-many relationship
export const userDepartments = sqliteTable('user_departments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  department_id: integer('department_id').notNull().references(() => departments.id, { onDelete: 'cascade' }),
  created_at: text('created_at').notNull(),
});

// Junction table for user-institution many-to-many relationship
export const userInstitutions = sqliteTable('user_institutions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  institution_id: integer('institution_id').notNull().references(() => institutions.id, { onDelete: 'cascade' }),
  created_at: text('created_at').notNull(),
});

// Tasks table
export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull(), // 'todo', 'in_progress', 'review', 'done'
  priority: text('priority').notNull(), // 'low', 'medium', 'high', 'urgent'
  assignedToId: integer('assigned_to_id').references(() => users.id),
  createdById: integer('created_by_id').notNull().references(() => users.id),
  institution_id: integer('institution_id').notNull().references(() => institutions.id),
  department_id: integer('department_id').references(() => departments.id),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  due_date: text('due_date'),
  reviewStatus: text('reviewStatus'), // Add reviewStatus column for task review workflow
  lastUpdatedBy: integer('last_updated_by').references(() => users.id), // Track who last updated the task
  isArchived: integer('is_archived', { mode: 'boolean' }).default(false), // Archive flag
  version: integer('version').notNull().default(1), // Optimistic concurrency control
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

// Events table
export const events = sqliteTable('events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  approval_status: text('approval_status').notNull().default('pending'), // 'pending', 'approved', 'declined'
  createdById: integer('created_by_id').notNull().references(() => users.id),
  institution_id: integer('institution_id').notNull().references(() => institutions.id),
  department_id: integer('department_id').references(() => departments.id),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

// Notifications table
export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  read: integer('read', { mode: 'boolean' }).notNull().default(false), // Legacy column restored
  readAt: text('read_at'),
  channel: text('channel').default('ui'), // 'ui', 'email', 'realtime'
  category: text('category'), // Notification categories for smart bundling
  ttl: integer('ttl'), // Time to live in seconds
  readReceipt: integer('read_receipt', { mode: 'boolean' }).default(false), // Read receipt flag
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at'),
});

// Attendance table
export const attendance = sqliteTable('attendance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  checkIn: text('check_in').notNull(),
  checkOut: text('check_out'),
  institution_id: integer('institution_id').notNull().references(() => institutions.id),
  department_id: integer('department_id').references(() => departments.id),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  notes: text('notes'),
  status: text('status'), // 'present', 'late', 'half_day', 'excused'

  // Strict Accountability Fields (Spec 2.0)
  workedMinutes: integer('worked_minutes').default(0),
  lateArrival: integer('late_arrival', { mode: 'boolean' }).default(false),
  earlyExit: integer('early_exit', { mode: 'boolean' }).default(false),
  pendingTasksAtCheckout: integer('pending_tasks_at_checkout').default(0),
  completedTasksToday: integer('completed_tasks_today').default(0),
  approvedEarlyExit: integer('approved_early_exit', { mode: 'boolean' }).default(false),
  negativeDisciplineEvent: integer('negative_discipline_event', { mode: 'boolean' }).default(false),
  markedBy: integer('marked_by').references(() => users.id),

  created_at: text('created_at').notNull(),
});

// Performance Snapshots (Derived, Cached) - Spec 2.0
export const performanceSnapshots = sqliteTable('performance_snapshots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  period: text('period').notNull(), // 'YYYY-MM'

  assignedTasks: integer('assigned_tasks').default(0),
  completedTasks: integer('completed_tasks').default(0),
  onTimeCompletedTasks: integer('on_time_completed_tasks').default(0),
  overdueTasks: integer('overdue_tasks').default(0),

  taskCompletionRate: real('task_completion_rate').default(0), // stored as integer 0-100 or float? Spec says 0.85. Storing as Real/Float is better for precision, or integer 85. Let's use Real.
  onTimeRate: real('on_time_rate').default(0), // Using integer 0-100 for simplicity in this ({} as any) or Real? SQLite integer vs real. Let's use REAL for scores.
  overdueLoadRatio: real('overdue_load_ratio').default(0),
  avgDelayHours: real('avg_delay_hours').default(0),

  avgDailyHours: real('avg_daily_hours').default(0),
  attendanceDisciplineScore: real('attendance_discipline_score').default(0),

  individualPerformanceScore: real('individual_performance_score').default(0),
  performanceStatus: text('performance_status').notNull(), // 'performing', 'at_risk', 'underperforming'

  negativeDisciplineDays: integer('negative_discipline_days').default(0),

  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  generatedAt: text('generated_at').notNull(),
});

// Department Snapshot - Spec 2.0
export const departmentHealthSnapshots = sqliteTable('department_health_snapshots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  period: text('period').notNull(), // 'YYYY-MM'

  totalTasks: integer('total_tasks').default(0),
  completedTasks: integer('completed_tasks').default(0),
  overdueTasks: integer('overdue_tasks').default(0),

  avgCompletionRate: real('avg_completion_rate').default(0),
  avgOnTimeRate: real('avg_on_time_rate').default(0),
  avgAttendanceScore: real('avg_attendance_score').default(0),

  departmentHealthScore: real('department_health_score').default(0),
  healthStatus: text('health_status').notNull(), // 'healthy', 'strained', 'poor'

  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  generatedAt: text('generated_at').notNull(),
});


// Task comments table
export const taskComments = sqliteTable('task_comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  comment: text('comment').notNull(),
  created_at: text('created_at').notNull(),
});

// Attachments table (for tasks)
export const attachments = sqliteTable('attachments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  file_name: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size').notNull(),
  uploadedById: integer('uploaded_by_id').notNull().references(() => users.id),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  created_at: text('created_at').notNull(),
});

// Files table (general file hub)
export const files = sqliteTable('files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size').notNull(),
  folder: text('folder'),
  visibility: text('visibility').notNull(), // 'all', 'team', 'member'
  uploadedById: integer('uploaded_by_id').notNull().references(() => users.id),
  institution_id: integer('institution_id').notNull().references(() => institutions.id),
  department_id: integer('department_id').references(() => departments.id),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  created_at: text('created_at').notNull(),
});

// Presence table for tracking user online status
export const presence = sqliteTable('presence', {
  userId: integer('user_id').primaryKey().references(() => users.id),
  lastSeenAt: text('last_seen_at').notNull(),
  online: integer('online', { mode: 'boolean' }).notNull().default(false),
});

// Edit locks table for document locking
export const editLocks = sqliteTable('edit_locks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id').notNull().references(() => tasks.id),
  userId: integer('user_id').notNull().references(() => users.id),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  acquiredAt: text('acquired_at').notNull(),
  expiresAt: text('expires_at').notNull(),
  created_at: text('created_at').notNull(),
});

// Task activity table for timeline
export const taskActivity = sqliteTable('task_activity', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id').notNull().references(() => tasks.id),
  userId: integer('user_id').notNull().references(() => users.id),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  action: text('action').notNull(), // 'created', 'status_changed', 'review_changed', 'assigned', 'moved', 'commented'
  oldValue: text('old_value'),
  newValue: text('new_value'),
  metadata: text('metadata', { mode: 'json' }),
  created_at: text('created_at').notNull(),
});


// Subtasks table for breaking down tasks into smaller steps
export const subtasks = sqliteTable('subtasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  parentTaskId: integer('parent_task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  title: text('title').notNull(),
  completed: integer('completed', { mode: 'boolean' }).default(false),
  createdById: integer('created_by_id').notNull().references(() => users.id),
  created_at: text('created_at').notNull(),
  completed_at: text('completed_at'),
});


// Automation rules table for no-code workflow builder
export const automationRules = sqliteTable('automation_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  ruleKey: text('rule_key'), // Added ruleKey
  triggerType: text('trigger_type').notNull(), // 'task_created', 'task_deadline', 'event_created', etc.
  triggerConfig: text('trigger_config', { mode: 'json' }), // Configuration for the trigger
  conditions: text('conditions', { mode: 'json' }), // Array of conditions
  actions: text('actions', { mode: 'json' }), // Array of actions to perform
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  isSystem: integer('is_system', { mode: 'boolean' }).default(false), // Added isSystem
  version: integer('version').default(1), // Added version
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  created_by: integer('created_by').notNull().references(() => users.id),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

// Audit log table for compliance
export const auditLog = sqliteTable('audit_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull(), // Store as string to match MOCK_KEY UID format
  action: text('action').notNull(), // 'create', 'update', 'delete', 'login', etc.
  resourceType: text('resource_type').notNull(), // 'task', 'event', 'user', etc.
  resourceId: text('resource_id'),
  details: text('details', { mode: 'json' }) // Additional details about the action
    .default('{}'),
  ipAddress: text('ip_address'), // Masked IP address
  userAgent: text('user_agent'),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  createdAt: text('created_at').notNull(),
});

// Media reports table for AI Media Quality Analyzer
export const mediaReports = sqliteTable('media_reports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  filename: text('filename'),
  uploaderId: integer('uploader_id').references(() => users.id),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  type: text('type'), // 'image', 'video', 'audio'
  score: integer('score'), // Quality score from 0-100
  reportJson: text('report_json', { mode: 'json' }), // Full JSON report with detailed metrics
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

// VIP embeddings table for face recognition - HMR Touch
export const vipEmbeddings = sqliteTable('vip_embeddings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  label: text('label').notNull(), // VIP name/label
  userId: integer('user_id').references(() => users.id), // Optional association with user
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  embedding: text('embedding', { mode: 'json' }).notNull(), // JSON array of embedding vector (encrypted)
  created_by: integer('created_by').references(() => users.id), // Admin who created the embedding
  created_at: text('created_at').notNull(),
});

// Admin intervention notes table - Spec 4.1
export const adminInterventionNotes = sqliteTable('admin_intervention_notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(), // FK temporarily removed for safe migration
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  period: text('period').notNull(), // 'YYYY-MM'
  riskLevelAtTime: text('risk_level_at_time').notNull(), // 'Low' | 'Medium' | 'High'
  note: text('note').notNull(),
  actionType: text('action_type').notNull(), // 'Observation' | 'Counselled' | 'Warning Issued' | 'Support Planned' | 'No Action Needed'
  created_by: integer('created_by').notNull(), // FK temporarily removed for safe migration
  created_at: text('created_at').notNull(),
});

// Equipment Bookings table - Spec 3.2
export const equipmentBookings = sqliteTable('equipment_bookings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  equipment_id: text('equipment_id').notNull(),
  task_id: integer('task_id').references(() => tasks.id),
  booked_by: text('booked_by').notNull(),
  start_time: text('start_time').notNull(),
  end_time: text('end_time').notNull(),
  units_requested: integer('units_requested').default(1),
  tenant_id: integer('tenant_id').notNull().references(() => tenants.id),
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Inventory table
export const inventory = sqliteTable('inventory', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  category: text('category').notNull(),
  quantity: integer('quantity').notNull().default(1),
  unit: text('unit').notNull().default('unit'),
  status: text('status').notNull().default('available'),
  isRentable: integer('is_rentable', { mode: 'boolean' }).default(false),
  rentalRatePerDay: real('rental_rate_per_day').default(0),
  serialNumber: text('serial_number'),
  purchaseDate: text('purchase_date'),
  purchasePrice: real('purchase_price'),
  condition: text('condition'),
  locationStr: text('location_str'),
  notes: text('notes'),
  remarks: text('remarks'),
  imageUrl: text('image_url'),
  driveFileId: text('drive_file_id'),
  images: text('images', { mode: 'json' }),
  brand: text('brand'),
  model: text('model'),
  assetStatus: text('asset_status'),
  threshold: integer('threshold').default(0),
  createdBy: integer('created_by').references(() => users.id),
  institution_id: integer('institution_id').references(() => institutions.id),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
