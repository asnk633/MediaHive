-- migrations/2025xxxx_m7_schema_rollback.sql
-- Rollback migration for M7 features

-- Drop indexes for ai_suggestions
DROP INDEX IF EXISTS idx_ai_suggestions_tenant_id;
DROP INDEX IF EXISTS idx_ai_suggestions_applied;
DROP INDEX IF EXISTS idx_ai_suggestions_suggestion_type;
DROP INDEX IF EXISTS idx_ai_suggestions_user_id;

-- Drop ai_suggestions table
DROP TABLE IF EXISTS ai_suggestions;

-- Drop indexes for audit_log
DROP INDEX IF EXISTS idx_audit_log_tenant_id;
DROP INDEX IF EXISTS idx_audit_log_timestamp;
DROP INDEX IF EXISTS idx_audit_log_resource_type;
DROP INDEX IF EXISTS idx_audit_log_action;
DROP INDEX IF EXISTS idx_audit_log_user_id;

-- Drop audit_log table
DROP TABLE IF EXISTS audit_log;

-- Drop indexes for knowledge_graph_cache
DROP INDEX IF EXISTS idx_knowledge_graph_cache_tenant_id;
DROP INDEX IF EXISTS idx_knowledge_graph_cache_node_type;
DROP INDEX IF EXISTS idx_knowledge_graph_cache_node_id;

-- Drop knowledge_graph_cache table
DROP TABLE IF EXISTS knowledge_graph_cache;

-- Drop indexes for notifications
DROP INDEX IF EXISTS idx_notifications_ttl;
DROP INDEX IF EXISTS idx_notifications_category;

-- Remove columns from notifications table
-- Note: SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
-- This is a simplified rollback - in practice, you'd need to preserve data

-- Drop indexes for automation_rules
DROP INDEX IF EXISTS idx_automation_rules_trigger_type;
DROP INDEX IF EXISTS idx_automation_rules_enabled;
DROP INDEX IF EXISTS idx_automation_rules_tenant_id;

-- Drop automation_rules table
DROP TABLE IF EXISTS automation_rules;

-- Drop indexes for tenants
DROP INDEX IF EXISTS idx_tenants_domain;

-- Remove tenant_id column from files table
-- Note: SQLite doesn't support DROP COLUMN directly, so we need to recreate the table

-- Remove tenant_id column from attachments table
-- Note: SQLite doesn't support DROP COLUMN directly, so we need to recreate the table

-- Remove tenant_id column from attendance table
-- Note: SQLite doesn't support DROP COLUMN directly, so we need to recreate the table

-- Remove tenant_id column from events table
-- Note: SQLite doesn't support DROP COLUMN directly, so we need to recreate the table

-- Remove tenant_id column from tasks table
-- Note: SQLite doesn't support DROP COLUMN directly, so we need to recreate the table

-- Remove tenant_id column from users table
-- Note: SQLite doesn't support DROP COLUMN directly, so we need to recreate the table

-- Remove tenant_id column from institutions table
-- Note: SQLite doesn't support DROP COLUMN directly, so we need to recreate the table

-- Drop tenants table
DROP TABLE IF EXISTS tenants;

-- Drop additional indexes for search performance
DROP INDEX IF EXISTS idx_files_name;
DROP INDEX IF EXISTS idx_users_full_name;
DROP INDEX IF EXISTS idx_events_description;
DROP INDEX IF EXISTS idx_events_title;
DROP INDEX IF EXISTS idx_tasks_description;
DROP INDEX IF EXISTS idx_tasks_title;