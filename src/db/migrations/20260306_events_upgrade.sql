-- Migration: 20260306_events_upgrade.sql
-- Goal: Stabilize Events Table with missing columns for approval and metadata

ALTER TABLE events ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE events ADD COLUMN IF NOT EXISTS department_id INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming';
ALTER TABLE events ADD COLUMN IF NOT EXISTS media_coverage JSONB DEFAULT '[]';
ALTER TABLE events ADD COLUMN IF NOT EXISTS institution_id INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
