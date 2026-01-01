-- Migration: Add credits table for tracking AI usage
-- Free users: 10 credits per day
-- Pro users: unlimited (or high limit)

CREATE TABLE IF NOT EXISTS credits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  remaining_credits INTEGER NOT NULL DEFAULT 10,
  total_credits_used INTEGER NOT NULL DEFAULT 0,
  last_reset_date TEXT NOT NULL, -- ISO date string (YYYY-MM-DD)
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits(user_id);

-- Create credits record for existing users
INSERT INTO credits (user_id, remaining_credits, last_reset_date)
SELECT id, 10, date('now')
FROM users
WHERE id NOT IN (SELECT user_id FROM credits);
