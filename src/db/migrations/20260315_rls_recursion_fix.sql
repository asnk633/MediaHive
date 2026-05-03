-- MediaHive: RLS Recursion & Stack Depth Fix
-- Date: 2026-03-15
-- Description: Fixes "stack depth limit exceeded" by redefining get_auth_tenant_id as SECURITY DEFINER.
-- Consolidates and hardens RLS policies for profiles and inventory.

BEGIN;

-- 1. Redefine get_auth_tenant_id as SECURITY DEFINER
-- This allows the function to bypass RLS on the profiles table, breaking the recursion.
CREATE OR REPLACE FUNCTION get_auth_tenant_id()
RETURNS UUID AS $$
DECLARE
    t_id UUID;
BEGIN
    -- Try to get it from JWT first (fastest, no DB hit)
    t_id := (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID;
    
    IF t_id IS NULL THEN
        t_id := (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::UUID;
    END IF;
    
    -- Fallback to database lookup if not in JWT
    IF t_id IS NULL THEN
        SELECT tenant_id INTO t_id FROM profiles WHERE id = auth.uid();
    END IF;
    
    RETURN t_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Consolidate PROFILES policies
-- Drop all existing select policies to start fresh
DROP POLICY IF EXISTS "tenant_select_profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles in same tenant" ON profiles;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON profiles;

-- Final hardened select policy for profiles
CREATE POLICY "profiles_select_policy" ON profiles
FOR SELECT USING (
    auth.uid() = id -- Own profile
    OR 
    tenant_id = get_auth_tenant_id() -- Same tenant
);

-- Ensure other verbs are secured
DROP POLICY IF EXISTS "tenant_insert_profiles" ON profiles;
DROP POLICY IF EXISTS "tenant_update_profiles" ON profiles;
DROP POLICY IF EXISTS "tenant_delete_profiles" ON profiles;

CREATE POLICY "profiles_modify_policy" ON profiles
FOR ALL USING (tenant_id = get_auth_tenant_id())
WITH CHECK (tenant_id = get_auth_tenant_id());


-- 3. Consolidate INVENTORY policies
DROP POLICY IF EXISTS "tenant_isolation_policy" ON inventory;
DROP POLICY IF EXISTS "tenant_select_inventory" ON inventory;
DROP POLICY IF EXISTS "tenant_insert_inventory" ON inventory;
DROP POLICY IF EXISTS "tenant_update_inventory" ON inventory;
DROP POLICY IF EXISTS "tenant_delete_inventory" ON inventory;

CREATE POLICY "inventory_tenant_policy" ON inventory
FOR ALL USING (tenant_id = get_auth_tenant_id())
WITH CHECK (tenant_id = get_auth_tenant_id());

COMMIT;
