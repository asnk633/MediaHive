import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

// Institutions table
export const institutions = sqliteTable('institutions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
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
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Notifications table
export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  body: text('body').notNull(),
  readAt: text('read_at'),
  createdAt: text('created_at').notNull(),
});

// Attendance table
export const attendance = sqliteTable('attendance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  checkIn: text('check_in').notNull(),
  checkOut: text('check_out'),
  institutionId: integer('institution_id').notNull().references(() => institutions.id),
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
  createdAt: text('created_at').notNull(),
});

// Presence table for tracking user online status
export const presence = sqliteTable('presence', {
  userId: integer('user_id').primaryKey().references(() => users.id),
  lastSeenAt: text('last_seen_at').notNull(),
  online: integer('online', { mode: 'boolean' }).notNull().default(false),
});