-- Migration: 20260523_demo_data_indexes.sql
-- Goal: Optimize multi-tenant database lookups and deletions for tasks and events

-- Create composite index on (tenant_id, is_demo_data) for tasks table to speed up workspace cleanups/seed triaging
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_demo ON tasks(tenant_id, is_demo_data);

-- Create composite index on (tenant_id, is_demo_data) for events table to optimize calendar filters
CREATE INDEX IF NOT EXISTS idx_events_tenant_demo ON events(tenant_id, is_demo_data);
