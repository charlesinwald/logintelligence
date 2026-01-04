-- Migration 007: Add user-provided category field
-- This allows users to provide their own categories when submitting errors
-- and serves as a fallback when AI analysis is not available

-- Add category field to errors table
ALTER TABLE errors ADD COLUMN category TEXT;

-- Add index for performance on category queries
CREATE INDEX IF NOT EXISTS idx_errors_category ON errors(category);

-- Update owner_id column to ensure it's properly set
-- (This was missing from the original schema but is referenced in the code)
ALTER TABLE errors ADD COLUMN owner_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_errors_owner_id ON errors(owner_id);
