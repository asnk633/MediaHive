-- migrations/2025xxxx_m6_schema.sql
-- Migration for M6 features: Offline Mode, Document Locking, Task Timeline, Notification Rules, AI Assistant, Monitoring

-- Add version index to tasks table for better concurrency control
CREATE INDEX IF NOT EXISTS idx_tasks_version ON tasks(version);

-- Add channel column to notifications table for notification channels
ALTER TABLE notifications ADD COLUMN channel TEXT DEFAULT 'ui';

-- Create edit locks table for document locking
CREATE TABLE IF NOT EXISTS edit_locks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES tasks(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  acquired_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Create indexes for edit locks
CREATE INDEX IF NOT EXISTS idx_edit_locks_task_id ON edit_locks(task_id);
CREATE INDEX IF NOT EXISTS idx_edit_locks_user_id ON edit_locks(user_id);
CREATE INDEX IF NOT EXISTS idx_edit_locks_expires_at ON edit_locks(expires_at);

-- Create task activity table for timeline
CREATE TABLE IF NOT EXISTS task_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES tasks(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  action TEXT NOT NULL, -- 'created', 'status_changed', 'review_changed', 'assigned', 'moved', 'commented'
  old_value TEXT,
  new_value TEXT,
  metadata TEXT, -- JSON data for additional context
  created_at TEXT NOT NULL
);

-- Create indexes for task activity
CREATE INDEX IF NOT EXISTS idx_task_activity_task_id ON task_activity(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_user_id ON task_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_action ON task_activity(action);
CREATE INDEX IF NOT EXISTS idx_task_activity_created_at ON task_activity(created_at);