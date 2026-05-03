-- Create Drive Queue table for background syncing
CREATE TABLE IF NOT EXISTS drive_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drive_file_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size BIGINT NOT NULL,
    web_view_link TEXT,
    thumbnail_link TEXT,
    uploaded_by TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    detected_at TIMESTAMPTZ DEFAULT now(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES public.profiles(id),
    institution_id UUID REFERENCES public.institutions(id),
    metadata JSONB DEFAULT '{}'
);

-- RLS Policies
ALTER TABLE drive_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view drive queue" 
ON drive_queue FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.role = 'owner')
    )
);

CREATE POLICY "Admins can update drive queue" 
ON drive_queue FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.role = 'owner')
    )
);
