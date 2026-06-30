-- Migration: 20260630_rls_processed_mutations.sql
-- Severity: CRITICAL (Supabase Advisor: RLS Disabled in Public)
-- Goal: Enable Row Level Security on the processed_mutations table.
--
-- Context:
--   This table is used exclusively by server-side API routes via the
--   Supabase service-role admin client (getSupabaseAdmin()), which bypasses
--   RLS entirely. No direct PostgREST client access is needed or intended.
--
-- Effect:
--   - Enabling RLS with zero permissive policies blocks all direct
--     anon/authenticated client access by default.
--   - The service_role key used in server-side routes is unaffected.
--   - Resolves the CRITICAL "RLS Disabled in Public" Supabase advisor finding.

ALTER TABLE public.processed_mutations ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT/UPDATE/DELETE policies are added intentionally.
-- Direct client access to this table should never be allowed.
-- Server-side access via service_role bypasses RLS automatically.
