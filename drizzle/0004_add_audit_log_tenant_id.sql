-- drizzle/0004_add_audit_log_tenant_id.sql
-- Migration to add tenant_id column to audit_log table for multi-tenant support

-- Add tenant_id column to audit_log table
-- ALTER TABLE audit_log ADD COLUMN tenant_id INTEGER NOT NULL REFERENCES tenants(id) DEFAULT 1;

-- Create index for tenant_id
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id ON audit_log(tenant_id);

-- Update existing records to have proper tenant_id (assuming all existing records belong to default tenant)
-- UPDATE audit_log SET tenant_id = 1 WHERE tenant_id = 0;