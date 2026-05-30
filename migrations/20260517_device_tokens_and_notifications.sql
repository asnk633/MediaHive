-- Create device_tokens table referencing profiles(id)
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  platform text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists and create
DROP POLICY IF EXISTS "Users can manage their own device tokens" ON public.device_tokens;
CREATE POLICY "Users can manage their own device tokens" 
  ON public.device_tokens 
  FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Alter notifications table to add extra columns if not exists
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS payload jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS silent boolean DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS collapse_key text;
