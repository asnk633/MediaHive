-- Migration: 20260306_audit_log_init.sql
-- Goal: Create missing audit_log table for compliance

CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_id TEXT,
    action TEXT,
    resource_type TEXT,
    resource_id TEXT,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    tenant_id INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
