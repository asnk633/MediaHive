-- migrations/2025xxxx_m6_schema_rollback.sql
-- Rollback migration for M6 features

-- Drop indexes for task activity
DROP INDEX IF EXISTS idx_task_activity_created_at;
DROP INDEX IF EXISTS idx_task_activity_action;
DROP INDEX IF EXISTS idx_task_activity_user_id;
DROP INDEX IF EXISTS idx_task_activity_task_id;

-- Drop task activity table
DROP TABLE IF EXISTS task_activity;

-- Drop indexes for edit locks
DROP INDEX IF EXISTS idx_edit_locks_expires_at;
DROP INDEX IF EXISTS idx_edit_locks_user_id;
DROP INDEX IF EXISTS idx_edit_locks_task_id;

-- Drop edit locks table
DROP TABLE IF EXISTS edit_locks;

-- Remove channel column from notifications table
-- Note: SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
-- This is a simplified rollback - in practice, you'd need to preserve data

-- Drop indexes for notifications
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_notifications_user_id;

-- Drop indexes for tasks version
DROP INDEX IF EXISTS idx_tasks_version;