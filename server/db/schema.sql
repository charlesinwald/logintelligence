-- Errors table - stores all incoming error events
CREATE TABLE IF NOT EXISTS errors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT NOT NULL,
  stack_trace TEXT,
  timestamp INTEGER NOT NULL, -- Unix timestamp in milliseconds
  source TEXT NOT NULL, -- Service/application name
  severity TEXT CHECK(severity IN ('critical', 'high', 'medium', 'low', 'unknown')) DEFAULT 'unknown',

  -- AI-generated fields
  ai_category TEXT, -- e.g., "Database", "Authentication", "Network"
  ai_severity TEXT CHECK(ai_severity IN ('critical', 'high', 'medium', 'low')),
  ai_hypothesis TEXT, -- Brief root cause analysis
  ai_processed_at INTEGER, -- When AI classification completed

  -- Metadata
  environment TEXT, -- production, staging, development
  user_id TEXT,
  request_id TEXT,
  metadata TEXT, -- JSON string for additional context

  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_errors_timestamp ON errors(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_errors_source ON errors(source);
CREATE INDEX IF NOT EXISTS idx_errors_severity ON errors(severity);
CREATE INDEX IF NOT EXISTS idx_errors_ai_category ON errors(ai_category);
CREATE INDEX IF NOT EXISTS idx_errors_created_at ON errors(created_at DESC);

-- Error patterns table - tracks recurring patterns
CREATE TABLE IF NOT EXISTS error_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern_hash TEXT UNIQUE NOT NULL, -- Hash of error signature
  category TEXT,
  message_template TEXT,
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  occurrence_count INTEGER DEFAULT 1,
  severity TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE INDEX IF NOT EXISTS idx_patterns_hash ON error_patterns(pattern_hash);
CREATE INDEX IF NOT EXISTS idx_patterns_last_seen ON error_patterns(last_seen DESC);

-- Time-series aggregation for spike detection
CREATE TABLE IF NOT EXISTS error_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  time_bucket INTEGER NOT NULL, -- 5-minute buckets (Unix timestamp / 300)
  source TEXT NOT NULL,
  category TEXT,
  error_count INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),

  UNIQUE(time_bucket, source, category)
);

CREATE INDEX IF NOT EXISTS idx_stats_bucket ON error_stats(time_bucket DESC);
CREATE INDEX IF NOT EXISTS idx_stats_source_bucket ON error_stats(source, time_bucket DESC);
