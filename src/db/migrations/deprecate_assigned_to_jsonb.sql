-- Phase 3: Column Deprecation & Integrity Cleanup
-- Execute ONLY after Phase 1 and 2 are in production

-- 1. DRIFT DETECTION (Safeguard)
-- Returns rows where JSONB and Relational table diverge
-- Should return 0 results if trigger and app logic are healthy
SELECT 
  t.id, 
  t.assigned_to as jsonb_data,
  COALESCE(jsonb_agg(ta.user_id) FILTER (WHERE ta.user_id IS NOT NULL), '[]'::jsonb) as relational_data
FROM public.tasks t
LEFT JOIN public.task_assignments ta ON t.id = ta.task_id
GROUP BY t.id, t.assigned_to
HAVING t.assigned_to::text <> COALESCE(jsonb_agg(ta.user_id) FILTER (WHERE ta.user_id IS NOT NULL), '[]'::jsonb)::text;

-- 2. DROP SYNC TRIGGERS
DROP TRIGGER IF EXISTS sync_task_assignments_trigger ON public.tasks;
DROP FUNCTION IF EXISTS public.sync_task_assignments();

-- 3. RENAME COLUMN (Soft Deprecation)
ALTER TABLE public.tasks RENAME COLUMN assigned_to TO assigned_to_deprecated;
