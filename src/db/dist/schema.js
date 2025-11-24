"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vipEmbeddings = exports.mediaReports = exports.auditLog = exports.automationRules = exports.taskActivity = exports.editLocks = exports.presence = exports.files = exports.attachments = exports.taskComments = exports.attendance = exports.notifications = exports.events = exports.tasks = exports.users = exports.institutions = exports.tenants = void 0;
var sqlite_core_1 = require("drizzle-orm/sqlite-core");
// Tenants table for multi-tenant support
exports.tenants = (0, sqlite_core_1.sqliteTable)('tenants', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    name: (0, sqlite_core_1.text)('name').notNull(),
    logo: (0, sqlite_core_1.text)('logo'),
    domain: (0, sqlite_core_1.text)('domain').notNull().unique(),
    settings: (0, sqlite_core_1.text)('settings', { mode: 'json' }),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull(),
    updatedAt: (0, sqlite_core_1.text)('updated_at').notNull(),
});
// Institutions table
exports.institutions = (0, sqlite_core_1.sqliteTable)('institutions', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    name: (0, sqlite_core_1.text)('name').notNull(),
    tenantId: (0, sqlite_core_1.integer)('tenant_id').notNull().references(function () { return exports.tenants.id; }),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull(),
});
// Users table
exports.users = (0, sqlite_core_1.sqliteTable)('users', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    email: (0, sqlite_core_1.text)('email').notNull().unique(),
    passwordHash: (0, sqlite_core_1.text)('password_hash').notNull(),
    fullName: (0, sqlite_core_1.text)('full_name').notNull(),
    avatarUrl: (0, sqlite_core_1.text)('avatar_url'),
    role: (0, sqlite_core_1.text)('role').notNull(), // 'admin', 'team', 'guest'
    institutionId: (0, sqlite_core_1.integer)('institution_id').notNull().references(function () { return exports.institutions.id; }),
    tenantId: (0, sqlite_core_1.integer)('tenant_id').notNull().references(function () { return exports.tenants.id; }),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull(),
    updatedAt: (0, sqlite_core_1.text)('updated_at').notNull(),
});
// Tasks table
exports.tasks = (0, sqlite_core_1.sqliteTable)('tasks', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    title: (0, sqlite_core_1.text)('title').notNull(),
    description: (0, sqlite_core_1.text)('description'),
    status: (0, sqlite_core_1.text)('status').notNull(), // 'todo', 'in_progress', 'review', 'done'
    priority: (0, sqlite_core_1.text)('priority').notNull(), // 'low', 'medium', 'high', 'urgent'
    assignedToId: (0, sqlite_core_1.integer)('assigned_to_id').references(function () { return exports.users.id; }),
    createdById: (0, sqlite_core_1.integer)('created_by_id').notNull().references(function () { return exports.users.id; }),
    institutionId: (0, sqlite_core_1.integer)('institution_id').notNull().references(function () { return exports.institutions.id; }),
    tenantId: (0, sqlite_core_1.integer)('tenant_id').notNull().references(function () { return exports.tenants.id; }),
    dueDate: (0, sqlite_core_1.text)('due_date'),
    reviewStatus: (0, sqlite_core_1.text)('reviewStatus'), // Add reviewStatus column for task review workflow
    lastUpdatedBy: (0, sqlite_core_1.integer)('last_updated_by').references(function () { return exports.users.id; }), // Track who last updated the task
    isArchived: (0, sqlite_core_1.integer)('is_archived', { mode: 'boolean' }).default(false), // Archive flag
    version: (0, sqlite_core_1.integer)('version').notNull().default(1), // Optimistic concurrency control
    createdAt: (0, sqlite_core_1.text)('created_at').notNull(),
    updatedAt: (0, sqlite_core_1.text)('updated_at').notNull(),
});
// Events table
exports.events = (0, sqlite_core_1.sqliteTable)('events', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    title: (0, sqlite_core_1.text)('title').notNull(),
    description: (0, sqlite_core_1.text)('description'),
    startTime: (0, sqlite_core_1.text)('start_time').notNull(),
    endTime: (0, sqlite_core_1.text)('end_time').notNull(),
    approvalStatus: (0, sqlite_core_1.text)('approval_status').notNull().default('pending'), // 'pending', 'approved', 'declined'
    createdById: (0, sqlite_core_1.integer)('created_by_id').notNull().references(function () { return exports.users.id; }),
    institutionId: (0, sqlite_core_1.integer)('institution_id').notNull().references(function () { return exports.institutions.id; }),
    tenantId: (0, sqlite_core_1.integer)('tenant_id').notNull().references(function () { return exports.tenants.id; }),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull(),
    updatedAt: (0, sqlite_core_1.text)('updated_at').notNull(),
});
// Notifications table
exports.notifications = (0, sqlite_core_1.sqliteTable)('notifications', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    userId: (0, sqlite_core_1.integer)('user_id').notNull().references(function () { return exports.users.id; }),
    title: (0, sqlite_core_1.text)('title').notNull(),
    body: (0, sqlite_core_1.text)('body').notNull(),
    readAt: (0, sqlite_core_1.text)('read_at'),
    channel: (0, sqlite_core_1.text)('channel').default('ui'), // 'ui', 'email', 'realtime'
    category: (0, sqlite_core_1.text)('category'), // Notification categories for smart bundling
    ttl: (0, sqlite_core_1.integer)('ttl'), // Time to live in seconds
    readReceipt: (0, sqlite_core_1.integer)('read_receipt', { mode: 'boolean' }).default(false), // Read receipt flag
    createdAt: (0, sqlite_core_1.text)('created_at').notNull(),
    updatedAt: (0, sqlite_core_1.text)('updated_at'),
});
// Attendance table
exports.attendance = (0, sqlite_core_1.sqliteTable)('attendance', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    userId: (0, sqlite_core_1.integer)('user_id').notNull().references(function () { return exports.users.id; }),
    checkIn: (0, sqlite_core_1.text)('check_in').notNull(),
    checkOut: (0, sqlite_core_1.text)('check_out'),
    institutionId: (0, sqlite_core_1.integer)('institution_id').notNull().references(function () { return exports.institutions.id; }),
    tenantId: (0, sqlite_core_1.integer)('tenant_id').notNull().references(function () { return exports.tenants.id; }),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull(),
});
// Task comments table
exports.taskComments = (0, sqlite_core_1.sqliteTable)('task_comments', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    taskId: (0, sqlite_core_1.integer)('task_id').notNull().references(function () { return exports.tasks.id; }, { onDelete: 'cascade' }),
    userId: (0, sqlite_core_1.integer)('user_id').notNull().references(function () { return exports.users.id; }),
    comment: (0, sqlite_core_1.text)('comment').notNull(),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull(),
});
// Attachments table (for tasks)
exports.attachments = (0, sqlite_core_1.sqliteTable)('attachments', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    taskId: (0, sqlite_core_1.integer)('task_id').notNull().references(function () { return exports.tasks.id; }, { onDelete: 'cascade' }),
    fileName: (0, sqlite_core_1.text)('file_name').notNull(),
    fileUrl: (0, sqlite_core_1.text)('file_url').notNull(),
    fileType: (0, sqlite_core_1.text)('file_type').notNull(),
    fileSize: (0, sqlite_core_1.integer)('file_size').notNull(),
    uploadedById: (0, sqlite_core_1.integer)('uploaded_by_id').notNull().references(function () { return exports.users.id; }),
    tenantId: (0, sqlite_core_1.integer)('tenant_id').notNull().references(function () { return exports.tenants.id; }),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull(),
});
// Files table (general file hub)
exports.files = (0, sqlite_core_1.sqliteTable)('files', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    name: (0, sqlite_core_1.text)('name').notNull(),
    fileUrl: (0, sqlite_core_1.text)('file_url').notNull(),
    fileType: (0, sqlite_core_1.text)('file_type').notNull(),
    fileSize: (0, sqlite_core_1.integer)('file_size').notNull(),
    folder: (0, sqlite_core_1.text)('folder'),
    visibility: (0, sqlite_core_1.text)('visibility').notNull(), // 'all', 'team', 'guest'
    uploadedById: (0, sqlite_core_1.integer)('uploaded_by_id').notNull().references(function () { return exports.users.id; }),
    institutionId: (0, sqlite_core_1.integer)('institution_id').notNull().references(function () { return exports.institutions.id; }),
    tenantId: (0, sqlite_core_1.integer)('tenant_id').notNull().references(function () { return exports.tenants.id; }),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull(),
});
// Presence table for tracking user online status
exports.presence = (0, sqlite_core_1.sqliteTable)('presence', {
    userId: (0, sqlite_core_1.integer)('user_id').primaryKey().references(function () { return exports.users.id; }),
    lastSeenAt: (0, sqlite_core_1.text)('last_seen_at').notNull(),
    online: (0, sqlite_core_1.integer)('online', { mode: 'boolean' }).notNull().default(false),
});
// Edit locks table for document locking
exports.editLocks = (0, sqlite_core_1.sqliteTable)('edit_locks', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    taskId: (0, sqlite_core_1.integer)('task_id').notNull().references(function () { return exports.tasks.id; }),
    userId: (0, sqlite_core_1.integer)('user_id').notNull().references(function () { return exports.users.id; }),
    acquiredAt: (0, sqlite_core_1.text)('acquired_at').notNull(),
    expiresAt: (0, sqlite_core_1.text)('expires_at').notNull(),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull(),
});
// Task activity table for timeline
exports.taskActivity = (0, sqlite_core_1.sqliteTable)('task_activity', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    taskId: (0, sqlite_core_1.integer)('task_id').notNull().references(function () { return exports.tasks.id; }),
    userId: (0, sqlite_core_1.integer)('user_id').notNull().references(function () { return exports.users.id; }),
    action: (0, sqlite_core_1.text)('action').notNull(), // 'created', 'status_changed', 'review_changed', 'assigned', 'moved', 'commented'
    oldValue: (0, sqlite_core_1.text)('old_value'),
    newValue: (0, sqlite_core_1.text)('new_value'),
    metadata: (0, sqlite_core_1.text)('metadata', { mode: 'json' }),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull(),
});
// Automation rules table for no-code workflow builder
exports.automationRules = (0, sqlite_core_1.sqliteTable)('automation_rules', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    name: (0, sqlite_core_1.text)('name').notNull(),
    description: (0, sqlite_core_1.text)('description'),
    triggerType: (0, sqlite_core_1.text)('trigger_type').notNull(), // 'task_created', 'task_deadline', 'event_created', etc.
    triggerConfig: (0, sqlite_core_1.text)('trigger_config', { mode: 'json' }), // Configuration for the trigger
    conditions: (0, sqlite_core_1.text)('conditions', { mode: 'json' }), // Array of conditions
    actions: (0, sqlite_core_1.text)('actions', { mode: 'json' }), // Array of actions to perform
    enabled: (0, sqlite_core_1.integer)('enabled', { mode: 'boolean' }).notNull().default(true),
    tenantId: (0, sqlite_core_1.integer)('tenant_id').notNull().references(function () { return exports.tenants.id; }),
    createdBy: (0, sqlite_core_1.integer)('created_by').notNull().references(function () { return exports.users.id; }),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull(),
    updatedAt: (0, sqlite_core_1.text)('updated_at').notNull(),
});
// Audit log table for compliance
exports.auditLog = (0, sqlite_core_1.sqliteTable)('audit_log', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    userId: (0, sqlite_core_1.integer)('user_id').notNull().references(function () { return exports.users.id; }),
    action: (0, sqlite_core_1.text)('action').notNull(), // 'create', 'update', 'delete', 'login', etc.
    resourceType: (0, sqlite_core_1.text)('resource_type').notNull(), // 'task', 'event', 'user', etc.
    resourceId: (0, sqlite_core_1.integer)('resource_id'),
    details: (0, sqlite_core_1.text)('details', { mode: 'json' }), // Additional details about the action
    ipAddress: (0, sqlite_core_1.text)('ip_address'), // Masked IP address
    userAgent: (0, sqlite_core_1.text)('user_agent'),
    tenantId: (0, sqlite_core_1.integer)('tenant_id').notNull().references(function () { return exports.tenants.id; }),
    timestamp: (0, sqlite_core_1.text)('timestamp').notNull(),
});
// Media reports table for AI Media Quality Analyzer
exports.mediaReports = (0, sqlite_core_1.sqliteTable)('media_reports', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    filename: (0, sqlite_core_1.text)('filename'),
    uploaderId: (0, sqlite_core_1.integer)('uploader_id').references(function () { return exports.users.id; }),
    type: (0, sqlite_core_1.text)('type'), // 'image', 'video', 'audio'
    score: (0, sqlite_core_1.integer)('score'), // Quality score from 0-100
    reportJson: (0, sqlite_core_1.text)('report_json', { mode: 'json' }), // Full JSON report with detailed metrics
    createdAt: (0, sqlite_core_1.text)('created_at').notNull(),
    updatedAt: (0, sqlite_core_1.text)('updated_at').notNull(),
});
// VIP embeddings table for face recognition
exports.vipEmbeddings = (0, sqlite_core_1.sqliteTable)('vip_embeddings', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    label: (0, sqlite_core_1.text)('label').notNull(), // VIP name/label
    userId: (0, sqlite_core_1.integer)('user_id').references(function () { return exports.users.id; }), // Optional association with user
    embedding: (0, sqlite_core_1.text)('embedding', { mode: 'json' }).notNull(), // JSON array of embedding vector (encrypted)
    createdBy: (0, sqlite_core_1.integer)('created_by').references(function () { return exports.users.id; }), // Admin who created the embedding
    createdAt: (0, sqlite_core_1.text)('created_at').notNull(),
});
