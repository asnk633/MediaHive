-- ============================================================
-- Migration: Fix RLS Isolation Leaks
-- Date: 2026-06-19
-- Description: Properly scopes RLS policies to the user's tenant_id
--              for presence_logs, field_work_sessions,
--              presence_verification_settings, and manager_deputies
-- ============================================================

-- 1. presence_logs
DROP POLICY IF EXISTS "Managers can read tenant presence logs" ON presence_logs;
CREATE POLICY "Managers can read tenant presence logs"
  ON presence_logs FOR SELECT TO authenticated
  USING (
    (SELECT tenant_id FROM profiles WHERE id = presence_logs."userId") = get_auth_tenant_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('manager', 'admin'))
  );

-- 2. field_work_sessions
DROP POLICY IF EXISTS "Managers can read tenant field work sessions" ON field_work_sessions;
CREATE POLICY "Managers can read tenant field work sessions"
  ON field_work_sessions FOR SELECT TO authenticated
  USING (
    (SELECT tenant_id FROM profiles WHERE id = field_work_sessions."userId") = get_auth_tenant_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('manager', 'admin'))
  );

DROP POLICY IF EXISTS "Managers can update field work sessions" ON field_work_sessions;
CREATE POLICY "Managers can update field work sessions"
  ON field_work_sessions FOR UPDATE TO authenticated
  USING (
    (SELECT tenant_id FROM profiles WHERE id = field_work_sessions."userId") = get_auth_tenant_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('manager', 'admin'))
  )
  WITH CHECK (
    (SELECT tenant_id FROM profiles WHERE id = field_work_sessions."userId") = get_auth_tenant_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('manager', 'admin'))
  );

-- 3. presence_verification_settings
DROP POLICY IF EXISTS "Authenticated can read verification settings" ON presence_verification_settings;
CREATE POLICY "Authenticated can read verification settings"
  ON presence_verification_settings FOR SELECT TO authenticated
  USING ("organizationId" = get_auth_tenant_id());

DROP POLICY IF EXISTS "Admins can manage verification settings" ON presence_verification_settings;
CREATE POLICY "Admins can manage verification settings"
  ON presence_verification_settings FOR ALL TO authenticated
  USING (
    "organizationId" = get_auth_tenant_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    "organizationId" = get_auth_tenant_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. manager_deputies
DROP POLICY IF EXISTS "Admins can manage all deputies" ON manager_deputies;
CREATE POLICY "Admins can manage all deputies"
  ON manager_deputies FOR ALL TO authenticated
  USING (
    "organizationId" = get_auth_tenant_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    "organizationId" = get_auth_tenant_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
