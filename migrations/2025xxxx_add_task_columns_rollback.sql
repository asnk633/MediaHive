-- migrations/2025xxxx_add_task_columns_rollback.sql
-- Rollback migration to remove lastUpdatedBy and isArchived columns from tasks table

-- Drop indexes
DROP INDEX IF EXISTS idx_tasks_institution_status;
DROP INDEX IF EXISTS idx_tasks_assigned_to;
DROP INDEX IF EXISTS idx_tasks_created_by;
DROP INDEX IF EXISTS idx_tasks_last_updated_by;

-- SQLite does not support dropping columns directly, so we need to:
-- 1. Create a new table without the columns
-- 2. Copy data from the old table
-- 3. Drop the old table
-- 4. Rename the new table

-- Create new table without the added columns
CREATE TABLE tasks_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  assigned_to_id INTEGER REFERENCES users(id),
  created_by_id INTEGER NOT NULL REFERENCES users(id),
  institution_id INTEGER NOT NULL REFERENCES institutions(id),
  due_date TEXT,
  reviewStatus TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Copy data from old table (excluding the new columns)
INSERT INTO tasks_new 
SELECT 
  id, 
  title, 
  description, 
  status, 
  priority, 
  assigned_to_id, 
  created_by_id, 
  institution_id, 
  due_date, 
  reviewStatus, 
  created_at, 
  updated_at
FROM tasks;

-- Drop the old table
DROP TABLE tasks;

-- Rename the new table
ALTER TABLE tasks_new RENAME TO tasks;

-- Recreate the indexes that existed before
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by_id ON tasks(created_by_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_id ON tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_tasks_institution_id ON tasks(institution_id);