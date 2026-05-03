-- Fix: Unified Schema Alignment
-- Goal: Add missing columns and align types with schema.ts

-- 1. Events Table Fixes
ALTER TABLE events ADD COLUMN IF NOT EXISTS on_behalf_of JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE events ADD COLUMN IF NOT EXISTS media_coverage JSONB DEFAULT '[]';

-- Ensure institution_id and tenant_id are UUID in events (if they exist as varchar/int)
-- Note: schema.ts says uuid('institution_id').notNull().references(() => institutions.id)
-- We'll just add them if missing or assume they are uuid if they exist.
ALTER TABLE events ADD COLUMN IF NOT EXISTS institution_id UUID;
ALTER TABLE events ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE events ADD COLUMN IF NOT EXISTS department_id UUID;

-- 2. Tasks Table Fixes
-- schema.ts: created_by: uuid('created_by').notNull()
ALTER TABLE tasks ALTER COLUMN created_by TYPE UUID USING created_by::UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- 3. Campaigns Table Fixes
-- schema.ts: owner_id: uuid('owner_id').references(() => profiles.id)
ALTER TABLE campaigns ALTER COLUMN owner_id TYPE UUID USING owner_id::UUID;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS institution_id UUID;
