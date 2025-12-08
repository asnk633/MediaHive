-- migrations/2025xxxx_add_task_columns.sql
-- Migration to add lastUpdatedBy and isArchived columns to tasks table

-- Add lastUpdatedBy column to tasks table
ALTER TABLE tasks ADD COLUMN last_updated_by INTEGER REFERENCES users(id);

-- Add isArchived column to tasks table with default value
ALTER TABLE tasks ADD COLUMN is_archived INTEGER DEFAULT 0;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_institution_status ON tasks(institution_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by_id);
CREATE INDEX IF NOT EXISTS idx_tasks_last_updated_by ON tasks(last_updated_by);

-- Add a comment to document the migration
-- This migration adds tracking columns to the tasks table:
-- - last_updated_by: references the user who last updated the task
-- - is_archived: boolean flag to mark archived tasks
-- And creates indexes for better query performance on commonly filtered columns