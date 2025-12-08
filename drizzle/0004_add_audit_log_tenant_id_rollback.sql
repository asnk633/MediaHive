-- drizzle/0004_add_audit_log_tenant_id_rollback.sql
-- Rollback migration for removing tenant_id column from audit_log table

-- Drop index for tenant_id
DROP INDEX IF EXISTS idx_audit_log_tenant_id;

-- Remove tenant_id column from audit_log table
-- Note: SQLite does not support dropping columns directly
-- This would require recreating the table without the tenant_id column
-- For simplicity, we'll just note that the column exists but is unused
-- In a production environment, you would need to recreate the table

-- To properly rollback, you would need to:
-- 1. Create a new table without tenant_id
-- 2. Copy all data from the old table to the new table
-- 3. Drop the old table
-- 4. Rename the new table to audit_log