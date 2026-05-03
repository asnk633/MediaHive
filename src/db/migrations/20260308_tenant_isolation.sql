-- Migration: Tenant Isolation Support
-- Date: 2026-03-08
-- Description: Adds tenant_id to profiles and inventory tables, and creates indexes.

-- 1. Profiles Table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
-- Index for performance and RLS
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON profiles(tenant_id);

-- 2. Inventory Table
-- Assuming inventory might still be using older pattern or missing tenant_id based on audit
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_inventory_tenant_id ON inventory(tenant_id);

-- 3. Additional Indexes for performance across multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_id_created_at ON tasks(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_tenant_id_start_at ON events(tenant_id, start_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_id_phase ON campaigns(tenant_id, phase);

-- 4. Initial Migration Logic (Optional/Manual)
-- In a real scenario, we would populate tenant_id for existing rows based on institution mapping.
-- UPDATE profiles SET tenant_id = '0f8e65be-3600-48a9-9793-04a78e524257' WHERE tenant_id IS NULL;
