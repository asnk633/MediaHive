-- drizzle/0013_update_audit_log_user_id.sql
-- Migration to update audit_log table to store userId as TEXT instead of INTEGER

-- Since SQLite doesn't support direct column type changes, we need to:
-- 1. Create a new table with the correct schema
-- 2. Copy data from the old table to the new table
-- 3. Drop the old table
-- 4. Rename the new table to the original name

-- Create new audit_log table with userId as TEXT
CREATE TABLE IF NOT EXISTS `audit_log_new` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` text NOT NULL, -- Changed from INTEGER to TEXT
  `action` text NOT NULL,
  `resource_type` text NOT NULL,
  `resource_id` integer,
  `details` text DEFAULT '{}',
  `ip_address` text,
  `user_agent` text,
  `tenant_id` integer NOT NULL REFERENCES tenants(id),
  `timestamp` text NOT NULL
);

-- Copy data from old table to new table (assuming old table exists with INTEGER user_id)
-- This will convert INTEGER values to TEXT
INSERT INTO audit_log_new 
SELECT 
  id,
  CAST(user_id AS TEXT), -- Convert INTEGER to TEXT
  action,
  resource_type,
  resource_id,
  details,
  ip_address,
  user_agent,
  tenant_id,
  timestamp
FROM audit_log;

-- Drop the old table
DROP TABLE audit_log;

-- Rename new table to original name
ALTER TABLE audit_log_new RENAME TO audit_log;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource_type ON audit_log(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);