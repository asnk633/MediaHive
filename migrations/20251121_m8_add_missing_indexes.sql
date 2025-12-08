-- migrations/20251121_m8_add_missing_indexes.sql
-- Migration to add missing indexes for performance optimization

-- Add indexes for commonly queried columns in tasks table
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_id ON tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_institution_id ON tasks(institution_id);
CREATE INDEX IF NOT EXISTS idx_tasks_title ON tasks(title);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_review_status ON tasks(review_status);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_tasks_institution_status_priority ON tasks(institution_id, status, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_institution ON tasks(tenant_id, institution_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status ON tasks(assigned_to_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by_status ON tasks(created_by_id, status);