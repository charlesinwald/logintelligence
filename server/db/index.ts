import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DB_PATH || './data/errors.db';

// Type definitions
export interface ErrorData {
  message: string;
  stack_trace?: string | null;
  timestamp: number;
  source: string;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'unknown';
  environment?: string | null;
  user_id?: string | null;
  request_id?: string | null;
  metadata?: Record<string, any> | null;
  ai_category?: string | null;
}

export interface ErrorRecord extends ErrorData {
  id: number;
  ai_severity?: string | null;
  ai_hypothesis?: string | null;
  ai_processed_at?: number | null;
  created_at: number;
}

export interface AIData {
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  hypothesis: string;
}

export interface CategoryStat {
  category: string | null;
  count: number;
  last_occurrence: number;
}

export interface ErrorPattern {
  id: number;
  pattern_hash: string;
  category: string | null;
  message_template: string | null;
  first_seen: number;
  last_seen: number;
  occurrence_count: number;
  severity: string | null;
  created_at: number;
  updated_at: number;
}

export interface ErrorStat {
  id: number;
  time_bucket: number;
  source: string;
  category: string | null;
  error_count: number;
  created_at: number;
}

export interface StatsRow {
  time_bucket: number;
  source: string;
  category: string | null;
  total_errors: number;
}

export interface HourlyAverage {
  source: string;
  category: string | null;
  avg_errors: number;
}

// Initialize database
export const db: Database.Database = new Database(DB_PATH);
db.pragma('journal_mode = WAL'); // Better concurrency

// Initialize schema
const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

console.log('✓ Database initialized at:', DB_PATH);

// Prepared statements for common operations
export const statements = {
  // Insert new error
  insertError: db.prepare<[string, string | null, number, string, string, string | null, string | null, string | null, string | null]>(
    `
    INSERT INTO errors (
      message, stack_trace, timestamp, source, severity,
      environment, user_id, request_id, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ),

  // Update error with AI analysis
  updateErrorAI: db.prepare<[string | null, string | null, string | null, number, number]>(
    `
    UPDATE errors
    SET ai_category = ?, ai_severity = ?, ai_hypothesis = ?, ai_processed_at = ?
    WHERE id = ?
  `
  ),

  // Get recent errors
  getRecentErrors: db.prepare<[number]>(
    `
    SELECT * FROM errors
    ORDER BY timestamp DESC
    LIMIT ?
  `
  ),

  // Get errors in time range
  getErrorsInRange: db.prepare<[number, number]>(
    `
    SELECT * FROM errors
    WHERE timestamp >= ? AND timestamp <= ?
    ORDER BY timestamp DESC
  `
  ),

  // Get error by ID
  getErrorById: db.prepare<[number]>(
    `
    SELECT * FROM errors WHERE id = ?
  `
  ),

  // Error counts by category (time windowed)
  getCategoryCounts: db.prepare<[number]>(
    `
    SELECT
      ai_category as category,
      COUNT(*) as count,
      MAX(timestamp) as last_occurrence
    FROM errors
    WHERE timestamp >= ?
    GROUP BY ai_category
    ORDER BY count DESC
  `
  ),

  // Insert or update error pattern
  upsertPattern: db.prepare<[string, string | null, string, number, number, string | null]>(
    `
    INSERT INTO error_patterns (pattern_hash, category, message_template, first_seen, last_seen, occurrence_count, severity)
    VALUES (?, ?, ?, ?, ?, 1, ?)
    ON CONFLICT(pattern_hash) DO UPDATE SET
      last_seen = excluded.last_seen,
      occurrence_count = occurrence_count + 1,
      category = excluded.category,
      severity = excluded.severity
  `
  ),

  // Get pattern by hash
  getPattern: db.prepare<[string]>(
    `
    SELECT * FROM error_patterns WHERE pattern_hash = ?
  `
  ),

  // Insert/update stats bucket
  upsertStats: db.prepare<[number, string, string | null]>(
    `
    INSERT INTO error_stats (time_bucket, source, category, error_count)
    VALUES (?, ?, ?, 1)
    ON CONFLICT(time_bucket, source, category) DO UPDATE SET
      error_count = error_count + 1
  `
  ),

  // Get stats for spike detection
  getStatsInRange: db.prepare<[number, number]>(
    `
    SELECT
      time_bucket,
      source,
      category,
      SUM(error_count) as total_errors
    FROM error_stats
    WHERE time_bucket >= ? AND time_bucket <= ?
    GROUP BY time_bucket, source, category
    ORDER BY time_bucket DESC
  `
  ),

  // Get hourly average for spike detection
  getHourlyAverage: db.prepare<[number]>(
    `
    SELECT
      source,
      category,
      AVG(error_count) as avg_errors
    FROM error_stats
    WHERE time_bucket >= ?
    GROUP BY source, category
  `
  )
};

// Utility functions
export function insertError(errorData: ErrorData): number {
  const result = statements.insertError.run(
    errorData.message,
    errorData.stack_trace || null,
    errorData.timestamp,
    errorData.source,
    errorData.severity || 'unknown',
    errorData.environment || null,
    errorData.user_id || null,
    errorData.request_id || null,
    errorData.metadata ? JSON.stringify(errorData.metadata) : null
  );

  // Update stats bucket (5-minute buckets)
  const timeBucket = Math.floor(errorData.timestamp / 1000 / 300);
  statements.upsertStats.run(
    timeBucket,
    errorData.source,
    errorData.ai_category || 'uncategorized'
  );

  return Number(result.lastInsertRowid);
}

export function updateErrorWithAI(errorId: number, aiData: AIData): Database.RunResult {
  return statements.updateErrorAI.run(
    aiData.category,
    aiData.severity,
    aiData.hypothesis,
    Date.now(),
    errorId
  );
}

export function getRecentErrors(limit: number = 100): ErrorRecord[] {
  return statements.getRecentErrors.all(limit) as ErrorRecord[];
}

export function getCategoryStats(timeWindowMs: number = 3600000): CategoryStat[] {
  const startTime = Date.now() - timeWindowMs;
  return statements.getCategoryCounts.all(startTime) as CategoryStat[];
}

export function getErrorsInTimeRange(startTime: number, endTime: number): ErrorRecord[] {
  return statements.getErrorsInRange.all(startTime, endTime) as ErrorRecord[];
}

export default db;

