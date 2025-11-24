import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

// Tenants table for multi-tenant support
export const tenants = sqliteTable('tenants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  logo: text('logo'),
  domain: text('domain').notNull().unique(),
  settings: text('settings', { mode: 'json' }),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Institutions table
export const institutions = sqliteTable('institutions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  createdAt: text('created_at').notNull(),
});

// Users table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  avatarUrl: text('avatar_url'),
  role: text('role').notNull(), // 'admin', 'team', 'guest'
  institutionId: integer('institution_id').notNull().references(() => institutions.id),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
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
  institutionId: integer('institution_id').notNull().references(() => institutions.id),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  dueDate: text('due_date'),
  reviewStatus: text('reviewStatus'), // Add reviewStatus column for task review workflow
  lastUpdatedBy: integer('last_updated_by').references(() => users.id), // Track who last updated the task
  isArchived: integer('is_archived', { mode: 'boolean' }).default(false), // Archive flag
  version: integer('version').notNull().default(1), // Optimistic concurrency control
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Events table
export const events = sqliteTable('events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  approvalStatus: text('approval_status').notNull().default('pending'), // 'pending', 'approved', 'declined'
  createdById: integer('created_by_id').notNull().references(() => users.id),
  institutionId: integer('institution_id').notNull().references(() => institutions.id),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Notifications table
export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  readAt: text('read_at'),
  channel: text('channel').default('ui'), // 'ui', 'email', 'realtime'
  category: text('category'), // Notification categories for smart bundling
  ttl: integer('ttl'), // Time to live in seconds
  readReceipt: integer('read_receipt', { mode: 'boolean' }).default(false), // Read receipt flag
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at'),
});

// Attendance table
export const attendance = sqliteTable('attendance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  checkIn: text('check_in').notNull(),
  checkOut: text('check_out'),
  institutionId: integer('institution_id').notNull().references(() => institutions.id),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  createdAt: text('created_at').notNull(),
});

// Task comments table
export const taskComments = sqliteTable('task_comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id),
  comment: text('comment').notNull(),
  createdAt: text('created_at').notNull(),
});

// Attachments table (for tasks)
export const attachments = sqliteTable('attachments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size').notNull(),
  uploadedById: integer('uploaded_by_id').notNull().references(() => users.id),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  createdAt: text('created_at').notNull(),
});

// Files table (general file hub)
export const files = sqliteTable('files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size').notNull(),
  folder: text('folder'),
  visibility: text('visibility').notNull(), // 'all', 'team', 'guest'
  uploadedById: integer('uploaded_by_id').notNull().references(() => users.id),
  institutionId: integer('institution_id').notNull().references(() => institutions.id),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  createdAt: text('created_at').notNull(),
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
  acquiredAt: text('acquired_at').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
});

// Task activity table for timeline
export const taskActivity = sqliteTable('task_activity', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id').notNull().references(() => tasks.id),
  userId: integer('user_id').notNull().references(() => users.id),
  action: text('action').notNull(), // 'created', 'status_changed', 'review_changed', 'assigned', 'moved', 'commented'
  oldValue: text('old_value'),
  newValue: text('new_value'),
  metadata: text('metadata', { mode: 'json' }),
  createdAt: text('created_at').notNull(),
});

// Automation rules table for no-code workflow builder
export const automationRules = sqliteTable('automation_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  triggerType: text('trigger_type').notNull(), // 'task_created', 'task_deadline', 'event_created', etc.
  triggerConfig: text('trigger_config', { mode: 'json' }), // Configuration for the trigger
  conditions: text('conditions', { mode: 'json' }), // Array of conditions
  actions: text('actions', { mode: 'json' }), // Array of actions to perform
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Audit log table for compliance
export const auditLog = sqliteTable('audit_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  action: text('action').notNull(), // 'create', 'update', 'delete', 'login', etc.
  resourceType: text('resource_type').notNull(), // 'task', 'event', 'user', etc.
  resourceId: integer('resource_id'),
  details: text('details', { mode: 'json' }), // Additional details about the action
  ipAddress: text('ip_address'), // Masked IP address
  userAgent: text('user_agent'),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  timestamp: text('timestamp').notNull(),
});

// Media reports table for AI Media Quality Analyzer
export const mediaReports = sqliteTable('media_reports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  filename: text('filename'),
  uploaderId: integer('uploader_id').references(() => users.id),
  type: text('type'), // 'image', 'video', 'audio'
  score: integer('score'), // Quality score from 0-100
  reportJson: text('report_json', { mode: 'json' }), // Full JSON report with detailed metrics
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// VIP embeddings table for face recognition
export const vipEmbeddings = sqliteTable('vip_embeddings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  label: text('label').notNull(), // VIP name/label
  userId: integer('user_id').references(() => users.id), // Optional association with user
  embedding: text('embedding', { mode: 'json' }).notNull(), // JSON array of embedding vector (encrypted)
  createdBy: integer('created_by').references(() => users.id), // Admin who created the embedding
  createdAt: text('created_at').notNull(),
});
