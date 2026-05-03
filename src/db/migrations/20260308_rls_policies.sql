-- Supabase RLS Policies for Tenant Isolation
-- Date: 2026-03-08
-- Description: Enforces data isolation at the database level.

-- Enable RLS on all tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;

-- 1. Helper Function/Pattern
-- We assume the tenant_id is stored in the JWT for efficiency
-- Or we fetch it from the profiles table in a policy.

-- Direct Policy Example (using JWT metadata if available, otherwise sub-query)
-- CREATE POLICY tenant_isolation ON tasks
-- FOR ALL
-- USING (tenant_id::text = (auth.jwt() -> 'user_metadata' ->> 'tenant_id'));

-- 2. Authoritative Policy Pattern (Slower but most secure)
-- Checks the profile of the authenticated user.
CREATE POLICY tenant_isolation_tasks ON tasks
FOR ALL
USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY tenant_isolation_events ON events
FOR ALL
USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY tenant_isolation_campaigns ON campaigns
FOR ALL
USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY tenant_isolation_inventory ON inventory
FOR ALL
USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY tenant_isolation_profiles ON profiles
FOR SELECT
USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);

-- Note: Admin roles might need bypass policies, but for strict isolation, this is foundation.
