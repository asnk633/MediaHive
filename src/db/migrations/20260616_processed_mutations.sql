-- Migration: 20260616_processed_mutations.sql
-- Goal: Add processed_mutations table for idempotent offline sync queue

CREATE TABLE IF NOT EXISTS processed_mutations (
  idempotency_key UUID PRIMARY KEY,
  entity_id UUID NOT NULL,
  resolved_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_processed_mutations_resolved_at ON processed_mutations(resolved_at);

-- Pruning will be handled via a scheduled pg_cron or Supabase function
