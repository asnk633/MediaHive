-- migrations/20251121_m8_add_vip_and_media_rollback.sql
-- Rollback migration for M8 features: AI Media Quality Analyzer, VIP Face Recognition

-- Drop indexes for media_reports
DROP INDEX IF EXISTS idx_media_reports_uploader_id;
DROP INDEX IF EXISTS idx_media_reports_type;
DROP INDEX IF EXISTS idx_media_reports_score;
DROP INDEX IF EXISTS idx_media_reports_created_at;

-- Drop media_reports table
DROP TABLE IF EXISTS media_reports;

-- Drop indexes for vip_embeddings
DROP INDEX IF EXISTS idx_vip_embeddings_label;
DROP INDEX IF EXISTS idx_vip_embeddings_user_id;
DROP INDEX IF EXISTS idx_vip_embeddings_created_by;
DROP INDEX IF EXISTS idx_vip_embeddings_created_at;

-- Drop vip_embeddings table
DROP TABLE IF EXISTS vip_embeddings;

-- Note: SQLite doesn't support dropping columns easily, so we'll leave the version column in tasks
-- In a production environment, you might want to create a new tasks table without the version column
-- and copy all data over, but for this rollback we'll just leave it as is