-- Migration: Add rate limiting tracking table for hourly request limits
-- Tracks API requests per hour per user for enforcing tier limits

CREATE TABLE IF NOT EXISTS rate_limit_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  hour_bucket INTEGER NOT NULL, -- Unix timestamp rounded to nearest hour
  request_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, hour_bucket)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_id ON rate_limit_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_hour_bucket ON rate_limit_tracking(hour_bucket);
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_hour ON rate_limit_tracking(user_id, hour_bucket);

-- Cleanup old entries (older than 24 hours) - this will be run periodically
-- For now, we'll rely on application-level cleanup
