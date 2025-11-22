-- Add indexes to events table for better query performance
CREATE INDEX IF NOT EXISTS idx_events_institution_id ON events(institution_id);
CREATE INDEX IF NOT EXISTS idx_events_created_by_id ON events(created_by_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);