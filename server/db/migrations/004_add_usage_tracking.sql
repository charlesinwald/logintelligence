-- Migration: Add usage tracking table for monthly error and AI credit limits
-- Tracks monthly usage per user for enforcing tier limits

CREATE TABLE IF NOT EXISTS usage_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  month TEXT NOT NULL, -- Format: YYYY-MM (e.g., '2024-01')
  error_count INTEGER NOT NULL DEFAULT 0,
  ai_credit_count INTEGER NOT NULL DEFAULT 0,
  last_reset_date TEXT NOT NULL, -- ISO date string (YYYY-MM-DD)
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, month)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_month ON usage_tracking(month);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_month ON usage_tracking(user_id, month);

-- Initialize usage tracking for existing users for current month
INSERT INTO usage_tracking (user_id, month, error_count, ai_credit_count, last_reset_date)
SELECT 
  id,
  strftime('%Y-%m', 'now') as month,
  0 as error_count,
  0 as ai_credit_count,
  date('now') as last_reset_date
FROM users
WHERE id NOT IN (
  SELECT user_id FROM usage_tracking 
  WHERE month = strftime('%Y-%m', 'now')
);
