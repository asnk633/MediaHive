-- Migration: 20260306_campaigns_upgrade.sql
-- Goal: Stabilize Campaigns Table with ownership and lifecycle columns

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS owner_id TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS phase TEXT DEFAULT 'planning';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS members JSONB DEFAULT '[]';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS institution_id INTEGER;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
