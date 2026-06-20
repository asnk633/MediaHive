CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  token TEXT UNIQUE NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'Member',
  department_id BIGINT REFERENCES departments(id),
  invited_by UUID REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, revoked
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

-- Note: Depending on your RLS setup, you might want to enable RLS
-- ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable read access for all users" ON invitations FOR SELECT USING (true);
-- CREATE POLICY "Enable insert for authenticated users" ON invitations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Enable update for all users" ON invitations FOR UPDATE USING (true);
