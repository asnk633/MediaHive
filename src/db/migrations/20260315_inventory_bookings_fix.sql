-- MediaHive: Inventory Bookings & Requests Schema Hardening
-- Date: 2026-03-15
-- Description: Creates missing tenants and inventory_requests tables. Hardens equipment_bookings with FKs and types.

BEGIN;

-- 1. Create tenants table (UUID based as seen in profiles)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT UNIQUE NOT NULL,
    logo TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert current tenant to maintain consistency (found in profiles)
INSERT INTO tenants (id, name, domain)
VALUES ('7bc0bbe7-1943-4929-a769-5fdfbc487446', 'ThaiBa Garden', 'thaiba.garden')
ON CONFLICT (id) DO NOTHING;

-- 2. Create inventory_requests table
CREATE TABLE IF NOT EXISTS inventory_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES profiles(id),
    institution_id UUID REFERENCES institutions(id),
    item_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for inventory_requests
ALTER TABLE inventory_requests ENABLE ROW LEVEL SECURITY;

-- 3. Hardening equipment_bookings table
-- Note: Dropping and recreating because it's empty (0 rows) and requires PK/FK type changes.
DROP TABLE IF EXISTS equipment_bookings CASCADE;

CREATE TABLE equipment_bookings (
    id SERIAL PRIMARY KEY,
    equipment_id UUID NOT NULL REFERENCES inventory(id),
    task_id UUID REFERENCES tasks(id),
    booked_by UUID NOT NULL REFERENCES profiles(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    units_requested INTEGER DEFAULT 1,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for equipment_bookings
ALTER TABLE equipment_bookings ENABLE ROW LEVEL SECURITY;

-- 4. Create standard isolation policies
-- Note: Assuming get_auth_tenant_id() function exists from previous migrations
CREATE OR REPLACE FUNCTION get_auth_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

DROP POLICY IF EXISTS tenant_isolation_policy ON inventory_requests;
CREATE POLICY tenant_isolation_policy ON inventory_requests 
    USING (tenant_id = get_auth_tenant_id())
    WITH CHECK (tenant_id = get_auth_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON equipment_bookings;
CREATE POLICY tenant_isolation_policy ON equipment_bookings 
    USING (tenant_id = get_auth_tenant_id())
    WITH CHECK (tenant_id = get_auth_tenant_id());

COMMIT;
