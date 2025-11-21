-- migrations/20251121_m8_add_vip_and_media.sql
-- Migration for M8 features: AI Media Quality Analyzer, VIP Face Recognition

-- Create media_reports table for storing media analysis results
CREATE TABLE IF NOT EXISTS media_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT,
  uploader_id INTEGER REFERENCES users(id),
  type TEXT, -- 'image', 'video', 'audio'
  score INTEGER, -- Quality score from 0-100
  report_json TEXT, -- Full JSON report with detailed metrics
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for media_reports
CREATE INDEX IF NOT EXISTS idx_media_reports_uploader_id ON media_reports(uploader_id);
CREATE INDEX IF NOT EXISTS idx_media_reports_type ON media_reports(type);
CREATE INDEX IF NOT EXISTS idx_media_reports_score ON media_reports(score);
CREATE INDEX IF NOT EXISTS idx_media_reports_created_at ON media_reports(created_at);

-- Create vip_embeddings table for storing VIP face recognition data
CREATE TABLE IF NOT EXISTS vip_embeddings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL, -- VIP name/label (e.g., "Director Suhairudeen Nurani")
  user_id INTEGER REFERENCES users(id), -- Optional association with user
  embedding TEXT NOT NULL, -- JSON array of embedding vector (encrypted)
  created_by INTEGER REFERENCES users(id), -- Admin who created the embedding
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for vip_embeddings
CREATE INDEX IF NOT EXISTS idx_vip_embeddings_label ON vip_embeddings(label);
CREATE INDEX IF NOT EXISTS idx_vip_embeddings_user_id ON vip_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_embeddings_created_by ON vip_embeddings(created_by);
CREATE INDEX IF NOT EXISTS idx_vip_embeddings_created_at ON vip_embeddings(created_at);

-- Add version column to tasks table for future use
ALTER TABLE tasks ADD COLUMN version INTEGER DEFAULT 1;

-- Create indexes for the new version column
CREATE INDEX IF NOT EXISTS idx_tasks_version ON tasks(version);