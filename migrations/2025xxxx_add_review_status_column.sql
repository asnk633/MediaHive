-- Migration: Add reviewStatus column to tasks table
-- Date: 2025-11-21
-- Description: Add reviewStatus column to support task review workflow

-- Add reviewStatus column to tasks table
ALTER TABLE tasks ADD COLUMN reviewStatus TEXT;