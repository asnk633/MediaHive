-- Create system_config table for secure backend secrets storage
CREATE TABLE IF NOT EXISTS public.system_config (
  key text primary key,
  value text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security to isolate the table
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Note: We intentionally do NOT define any SELECT, INSERT, UPDATE, or DELETE policies 
-- for public, anon, or authenticated roles. This guarantees that only the service_role key
-- (which bypasses RLS) can read or modify configuration secrets.
