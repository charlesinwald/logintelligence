import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = process.env.DB_PATH || './data/errors.db';
// Initialize database
export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL'); // Better concurrency
// Initialize schema
const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);
// Run migrations
const migrationPath = join(__dirname, 'migrations', '001_add_auth_tables.sql');
try {
    const migration = readFileSync(migrationPath, 'utf-8');
    db.exec(migration);
    console.log('✓ Migrations applied');
}
catch (error) {
    if (error.code !== 'ENOENT') {
        console.log('✓ Migrations already applied or not needed');
    }
}
console.log('✓ Database initialized at:', DB_PATH);
// Prepared statements for common operations
export const statements = {
    // Insert new error
    insertError: db.prepare(`
    INSERT INTO errors (
      message, stack_trace, timestamp, source, severity,
      environment, user_id, request_id, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
    // Update error with AI analysis
    updateErrorAI: db.prepare(`
    UPDATE errors
    SET ai_category = ?, ai_severity = ?, ai_hypothesis = ?, ai_processed_at = ?
    WHERE id = ?
  `),
    // Get recent errors
    getRecentErrors: db.prepare(`
    SELECT * FROM errors
    ORDER BY timestamp DESC
    LIMIT ?
  `),
    // Get errors in time range
    getErrorsInRange: db.prepare(`
    SELECT * FROM errors
    WHERE timestamp >= ? AND timestamp <= ?
    ORDER BY timestamp DESC
  `),
    // Get error by ID
    getErrorById: db.prepare(`
    SELECT * FROM errors WHERE id = ?
  `),
    // Error counts by category (time windowed)
    getCategoryCounts: db.prepare(`
    SELECT
      ai_category as category,
      COUNT(*) as count,
      MAX(timestamp) as last_occurrence
    FROM errors
    WHERE timestamp >= ?
    GROUP BY ai_category
    ORDER BY count DESC
  `),
    // Insert or update error pattern
    upsertPattern: db.prepare(`
    INSERT INTO error_patterns (pattern_hash, category, message_template, first_seen, last_seen, occurrence_count, severity)
    VALUES (?, ?, ?, ?, ?, 1, ?)
    ON CONFLICT(pattern_hash) DO UPDATE SET
      last_seen = excluded.last_seen,
      occurrence_count = occurrence_count + 1,
      category = excluded.category,
      severity = excluded.severity
  `),
    // Get pattern by hash
    getPattern: db.prepare(`
    SELECT * FROM error_patterns WHERE pattern_hash = ?
  `),
    // Insert/update stats bucket
    upsertStats: db.prepare(`
    INSERT INTO error_stats (time_bucket, source, category, error_count)
    VALUES (?, ?, ?, 1)
    ON CONFLICT(time_bucket, source, category) DO UPDATE SET
      error_count = error_count + 1
  `),
    // Get stats for spike detection
    getStatsInRange: db.prepare(`
    SELECT
      time_bucket,
      source,
      category,
      SUM(error_count) as total_errors
    FROM error_stats
    WHERE time_bucket >= ? AND time_bucket <= ?
    GROUP BY time_bucket, source, category
    ORDER BY time_bucket DESC
  `),
    // Get hourly average for spike detection
    getHourlyAverage: db.prepare(`
    SELECT
      source,
      category,
      AVG(error_count) as avg_errors
    FROM error_stats
    WHERE time_bucket >= ?
    GROUP BY source, category
  `)
};
// Utility functions
export function insertError(errorData) {
    const result = statements.insertError.run(errorData.message, errorData.stack_trace || null, errorData.timestamp, errorData.source, errorData.severity || 'unknown', errorData.environment || null, errorData.user_id || null, errorData.request_id || null, errorData.metadata ? JSON.stringify(errorData.metadata) : null);
    // Update stats bucket (5-minute buckets)
    const timeBucket = Math.floor(errorData.timestamp / 1000 / 300);
    statements.upsertStats.run(timeBucket, errorData.source, errorData.ai_category || 'uncategorized');
    return Number(result.lastInsertRowid);
}
export function updateErrorWithAI(errorId, aiData) {
    return statements.updateErrorAI.run(aiData.category, aiData.severity, aiData.hypothesis, Date.now(), errorId);
}
export function getRecentErrors(limit = 100) {
    return statements.getRecentErrors.all(limit);
}
export function getCategoryStats(timeWindowMs = 3600000) {
    const startTime = Date.now() - timeWindowMs;
    return statements.getCategoryCounts.all(startTime);
}
export function getErrorsInTimeRange(startTime, endTime) {
    return statements.getErrorsInRange.all(startTime, endTime);
}
// Log Sources - helper functions for tracking user log sources
const logSourceStatements = {
    insertLogSource: db.prepare(`
    INSERT OR IGNORE INTO log_sources (user_id, source_name)
    VALUES (?, ?)
  `),
    getLogSourcesByUserId: db.prepare(`
    SELECT source_name FROM log_sources
    WHERE user_id = ?
    ORDER BY created_at ASC
  `),
    getLogSourceCount: db.prepare(`
    SELECT COUNT(*) as count FROM log_sources
    WHERE user_id = ?
  `)
};
/**
 * Track a log source for a user
 */
export function trackLogSource(userId, sourceName) {
    logSourceStatements.insertLogSource.run(userId, sourceName);
}
/**
 * Get all log sources for a user
 */
export function getLogSourcesByUserId(userId) {
    const sources = logSourceStatements.getLogSourcesByUserId.all(userId);
    return sources.map(s => s.source_name);
}
/**
 * Get log source count for a user
 */
export function getLogSourceCount(userId) {
    const result = logSourceStatements.getLogSourceCount.get(userId);
    return result.count;
}
export default db;
//# sourceMappingURL=index.js.map