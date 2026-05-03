-- MediaHive: Tenant Isolation Hardening & RLS Enforcement
-- Date: 2026-03-08
-- Description: Enables RLS on all tables and adds tenant_id to secondary tables.

BEGIN;

-- 1. Secondary Tables: Add tenant_id (if missing)
DO $$ 
BEGIN
    -- Task Secondary Data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_comments' AND column_name = 'tenant_id') THEN
        ALTER TABLE task_comments ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_activity' AND column_name = 'tenant_id') THEN
        ALTER TABLE task_activity ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subtasks' AND column_name = 'tenant_id') THEN
        ALTER TABLE subtasks ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'edit_locks' AND column_name = 'tenant_id') THEN
        ALTER TABLE edit_locks ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    END IF;

    -- Equipment & Media
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_bookings' AND column_name = 'tenant_id') THEN
        ALTER TABLE equipment_bookings ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_reports' AND column_name = 'tenant_id') THEN
        ALTER TABLE media_reports ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vip_embeddings' AND column_name = 'tenant_id') THEN
        ALTER TABLE vip_embeddings ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    END IF;

    -- Admin Data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_intervention_notes' AND column_name = 'tenant_id') THEN
        ALTER TABLE admin_intervention_notes ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    END IF;
END $$;

-- 2. Enable RLS on ALL Core Tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- 3. Enable RLS on Secondary Tables
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE edit_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE vip_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_intervention_notes ENABLE ROW LEVEL SECURITY;

-- 4. Create Standard Tenant Isolation Policies
-- Rule: Users can only see data where tenant_id matches their own profile.tenant_id

CREATE OR REPLACE FUNCTION get_auth_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- Example: Define policies for each table
DO $$ 
DECLARE 
    t TEXT;
    tables_to_protect TEXT[] := ARRAY[
        'tasks', 'events', 'inventory', 'campaigns', 'departments', 
        'notifications', 'attendance', 'audit_log', 'task_comments', 
        'task_activity', 'subtasks', 'edit_locks', 'equipment_bookings',
        'attachments', 'automation_rules', 'media_reports', 
        'vip_embeddings', 'admin_intervention_notes'
    ];
BEGIN
    FOREACH t IN ARRAY tables_to_protect LOOP
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I', t);
        EXECUTE format('CREATE POLICY tenant_isolation_policy ON %I 
                        USING (tenant_id = get_auth_tenant_id())
                        WITH CHECK (tenant_id = get_auth_tenant_id())', t);
    END LOOP;
END $$;

-- Special Case: Profiles
-- Users can see profiles in their own tenant
DROP POLICY IF EXISTS profile_tenant_isolation ON profiles;
CREATE POLICY profile_tenant_isolation ON profiles
    USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Special Case: Institutions
-- Users can see institutions in their own tenant
DROP POLICY IF EXISTS institution_tenant_isolation ON institutions;
CREATE POLICY institution_tenant_isolation ON institutions
    USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

COMMIT;
