-- 20260606103400_enable_rls.sql

-- Enable RLS on tables
ALTER TABLE IF EXISTS files ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invitations ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's tenant_id securely
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql SECURITY DEFINER SET search_path = public
STABLE
AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$;

-- --------------------------------------------------------
-- RLS Policies for 'files'
-- --------------------------------------------------------

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view files in their tenant" ON files;
DROP POLICY IF EXISTS "Users can insert files in their tenant" ON files;
DROP POLICY IF EXISTS "Users can update files in their tenant" ON files;
DROP POLICY IF EXISTS "Users can delete files in their tenant" ON files;

-- SELECT policy: Users can only see files where tenant_id matches their own
CREATE POLICY "Users can view files in their tenant" 
ON files FOR SELECT 
USING (tenant_id = get_user_tenant_id());

-- INSERT policy: Users can only insert files for their own tenant
CREATE POLICY "Users can insert files in their tenant" 
ON files FOR INSERT 
WITH CHECK (tenant_id = get_user_tenant_id());

-- UPDATE policy: Users can only update files in their tenant
CREATE POLICY "Users can update files in their tenant" 
ON files FOR UPDATE 
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- DELETE policy: Users can only delete files in their tenant
CREATE POLICY "Users can delete files in their tenant" 
ON files FOR DELETE 
USING (tenant_id = get_user_tenant_id());

-- --------------------------------------------------------
-- RLS Policies for 'invitations'
-- --------------------------------------------------------

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view invitations in their tenant" ON invitations;
DROP POLICY IF EXISTS "Users can insert invitations for their tenant" ON invitations;
DROP POLICY IF EXISTS "Users can update invitations in their tenant" ON invitations;
DROP POLICY IF EXISTS "Users can delete invitations in their tenant" ON invitations;

-- SELECT policy: Users can only see invitations where tenant_id matches their own
CREATE POLICY "Users can view invitations in their tenant" 
ON invitations FOR SELECT 
USING (tenant_id = get_user_tenant_id());

-- INSERT policy: Users can only create invitations for their own tenant
CREATE POLICY "Users can insert invitations for their tenant" 
ON invitations FOR INSERT 
WITH CHECK (tenant_id = get_user_tenant_id());

-- UPDATE policy: Users can only update invitations in their tenant
CREATE POLICY "Users can update invitations in their tenant" 
ON invitations FOR UPDATE 
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- DELETE policy: Users can only delete invitations in their tenant
CREATE POLICY "Users can delete invitations in their tenant" 
ON invitations FOR DELETE 
USING (tenant_id = get_user_tenant_id());
