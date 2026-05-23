-- migrations/20260523_add_tenant_and_foreign_indexes.sql
-- Migration to add tenant-level and foreign key indexes for performance optimization

-- 1. Index tenant_id foreign keys across core tables to prevent sequential scans
CREATE INDEX IF NOT EXISTS idx_institutions_tenant_id ON institutions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_events_tenant_id ON events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_tenant_id ON attendance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attachments_tenant_id ON attachments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_files_tenant_id ON files(tenant_id);

-- 2. Index relational foreign keys to optimize joins and cascading deletions
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by_id ON attachments(uploaded_by_id);
