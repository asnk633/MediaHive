CREATE OR REPLACE FUNCTION public.get_auth_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    tid uuid;
BEGIN
    -- 1. Try to get it from JWT claims
    BEGIN
        tid := (nullif(current_setting('request.jwt.claims', true), '')::json ->> 'tenant_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
        tid := NULL;
    END;

    -- 2. If not found in JWT, fallback to query profiles table
    IF tid IS NULL AND auth.uid() IS NOT NULL THEN
        SELECT tenant_id INTO tid FROM public.profiles WHERE id = auth.uid();
    END IF;

    -- 3. If still null (anonymous signup fallback), use the primary tenant ID
    IF tid IS NULL THEN
        tid := '7bc0bbe7-1943-4929-a769-5fdfbc487446'::uuid;
    END IF;

    RETURN tid;
END;
$function$;

-- Fix Cross-Tenant Data Leakage in Inventory Tables
DROP POLICY IF EXISTS "Enable read/write access for authenticated users" ON inventory_items;
CREATE POLICY "tenant_isolation_inventory" ON inventory_items
FOR ALL TO authenticated
USING (tenant_id = get_auth_tenant_id())
WITH CHECK (tenant_id = get_auth_tenant_id());

-- inventory_warranties
DROP POLICY IF EXISTS "Enable read/write access for authenticated users" ON inventory_warranties;
CREATE POLICY "tenant_isolation_inventory" ON inventory_warranties
FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM inventory_items 
    WHERE inventory_items.id = inventory_warranties.inventory_item_id 
      AND inventory_items.tenant_id = get_auth_tenant_id()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM inventory_items 
    WHERE inventory_items.id = inventory_warranties.inventory_item_id 
      AND inventory_items.tenant_id = get_auth_tenant_id()
));

-- inventory_assignments
DROP POLICY IF EXISTS "Enable read/write access for authenticated users" ON inventory_assignments;
CREATE POLICY "tenant_isolation_inventory" ON inventory_assignments
FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM inventory_items 
    WHERE inventory_items.id = inventory_assignments.inventory_item_id 
      AND inventory_items.tenant_id = get_auth_tenant_id()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM inventory_items 
    WHERE inventory_items.id = inventory_assignments.inventory_item_id 
      AND inventory_items.tenant_id = get_auth_tenant_id()
));

-- inventory_asset_movements
DROP POLICY IF EXISTS "Enable read/write access for authenticated users" ON inventory_asset_movements;
CREATE POLICY "tenant_isolation_inventory" ON inventory_asset_movements
FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM inventory_items 
    WHERE inventory_items.id = inventory_asset_movements.inventory_item_id 
      AND inventory_items.tenant_id = get_auth_tenant_id()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM inventory_items 
    WHERE inventory_items.id = inventory_asset_movements.inventory_item_id 
      AND inventory_items.tenant_id = get_auth_tenant_id()
));

-- inventory_maintenance_history
DROP POLICY IF EXISTS "Enable read/write access for authenticated users" ON inventory_maintenance_history;
CREATE POLICY "tenant_isolation_inventory" ON inventory_maintenance_history
FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM inventory_items 
    WHERE inventory_items.id = inventory_maintenance_history.inventory_item_id 
      AND inventory_items.tenant_id = get_auth_tenant_id()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM inventory_items 
    WHERE inventory_items.id = inventory_maintenance_history.inventory_item_id 
      AND inventory_items.tenant_id = get_auth_tenant_id()
));

-- inventory_borrow_logs
DROP POLICY IF EXISTS "Enable read/write access for authenticated users" ON inventory_borrow_logs;
CREATE POLICY "tenant_isolation_inventory" ON inventory_borrow_logs
FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM inventory_items 
    WHERE inventory_items.id = inventory_borrow_logs.inventory_item_id 
      AND inventory_items.tenant_id = get_auth_tenant_id()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM inventory_items 
    WHERE inventory_items.id = inventory_borrow_logs.inventory_item_id 
      AND inventory_items.tenant_id = get_auth_tenant_id()
));

-- inventory_qr_codes
DROP POLICY IF EXISTS "Enable read/write access for authenticated users" ON inventory_qr_codes;
CREATE POLICY "tenant_isolation_inventory" ON inventory_qr_codes
FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM inventory_items 
    WHERE inventory_items.id = inventory_qr_codes.inventory_item_id 
      AND inventory_items.tenant_id = get_auth_tenant_id()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM inventory_items 
    WHERE inventory_items.id = inventory_qr_codes.inventory_item_id 
      AND inventory_items.tenant_id = get_auth_tenant_id()
));

-- Fix Tenant Bypass & Hardcoded Tenant UUID in Profiles
DROP POLICY IF EXISTS "allow_anon_read_profiles" ON profiles;
CREATE POLICY "allow_anon_read_profiles" ON profiles
FOR SELECT TO public
USING ((status = 'active'::text) AND (tenant_id = get_auth_tenant_id()));

DROP POLICY IF EXISTS "allow_anon_read_departments" ON departments;
CREATE POLICY "allow_anon_read_departments" ON departments
FOR SELECT TO public
USING (tenant_id = get_auth_tenant_id());

DROP POLICY IF EXISTS "allow_anon_read_institutions" ON institutions;
CREATE POLICY "allow_anon_read_institutions" ON institutions
FOR SELECT TO public
USING ((status = 'active'::text) AND (tenant_id = get_auth_tenant_id()));

-- Fix Tenant-Wide Edit Permissions on Tasks & Events
DROP POLICY IF EXISTS "tenant_wide_tasks" ON tasks;
CREATE POLICY "users_read_tenant_tasks" ON tasks
FOR SELECT TO authenticated
USING (tenant_id = get_auth_tenant_id());

CREATE POLICY "users_insert_tenant_tasks" ON tasks
FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_auth_tenant_id() AND (auth.uid() = created_by OR created_by IS NULL));

CREATE POLICY "users_modify_own_tasks" ON tasks
FOR UPDATE TO authenticated
USING (
  tenant_id = get_auth_tenant_id() AND (
    auth.uid() = created_by OR 
    is_admin() OR 
    is_manager() OR 
    EXISTS (
      SELECT 1 FROM public.task_assignments 
      WHERE task_assignments.task_id = tasks.id 
        AND task_assignments.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  tenant_id = get_auth_tenant_id() AND (
    auth.uid() = created_by OR 
    is_admin() OR 
    is_manager() OR 
    EXISTS (
      SELECT 1 FROM public.task_assignments 
      WHERE task_assignments.task_id = tasks.id 
        AND task_assignments.user_id = auth.uid()
    )
  )
);

CREATE POLICY "users_delete_own_tasks" ON tasks
FOR DELETE TO authenticated
USING (
  tenant_id = get_auth_tenant_id() AND (
    auth.uid() = created_by OR 
    is_admin() OR 
    is_manager()
  )
);

DROP POLICY IF EXISTS "tenant_wide_events" ON events;
CREATE POLICY "users_read_tenant_events" ON events
FOR SELECT TO authenticated
USING (tenant_id = get_auth_tenant_id());

CREATE POLICY "users_insert_tenant_events" ON events
FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_auth_tenant_id() AND (auth.uid() = created_by OR created_by IS NULL));

CREATE POLICY "users_modify_own_events" ON events
FOR UPDATE TO authenticated
USING (
  tenant_id = get_auth_tenant_id() AND (
    auth.uid() = created_by OR 
    is_admin() OR 
    is_manager() OR 
    EXISTS (
      SELECT 1 FROM public.event_crew 
      WHERE event_crew.event_id = events.id 
        AND event_crew.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  tenant_id = get_auth_tenant_id() AND (
    auth.uid() = created_by OR 
    is_admin() OR 
    is_manager() OR 
    EXISTS (
      SELECT 1 FROM public.event_crew 
      WHERE event_crew.event_id = events.id 
        AND event_crew.user_id = auth.uid()
    )
  )
);

CREATE POLICY "users_delete_own_events" ON events
FOR DELETE TO authenticated
USING (
  tenant_id = get_auth_tenant_id() AND (
    auth.uid() = created_by OR 
    is_admin() OR 
    is_manager()
  )
);