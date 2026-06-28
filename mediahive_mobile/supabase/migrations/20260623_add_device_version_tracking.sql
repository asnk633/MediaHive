-- Migration: Add app version and build number columns to device_tokens
ALTER TABLE public.device_tokens 
  ADD COLUMN IF NOT EXISTS app_version text,
  ADD COLUMN IF NOT EXISTS build_number text;

-- Add documentation comments to columns
COMMENT ON COLUMN public.device_tokens.app_version IS 'The semantic version of the client app (e.g., 1.2.5-beta)';
COMMENT ON COLUMN public.device_tokens.build_number IS 'The build/version code of the client app (e.g., 62001)';
