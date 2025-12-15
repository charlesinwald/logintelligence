import { statements } from '../db/index.js';
import crypto from 'crypto';

/**
 * Generate a hash for error pattern matching
 * Uses message and first few lines of stack trace for similarity
 */
export function generateErrorHash(error) {
  // Normalize error message (remove numbers, IDs, timestamps)
  const normalizedMessage = error.message
    .replace(/\d+/g, 'N') // Replace numbers with N
    .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, 'UUID') // UUIDs
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, 'EMAIL') // Emails
    .toLowerCase()
    .trim();

  // Get first 3 lines of stack trace for pattern matching
  const stackSignature = error.stack_trace
    ? error.stack_trace.split('\n').slice(0, 3).join('\n')
        .replace(/:\d+:\d+/g, ':N:N') // Line and column numbers
        .replace(/\d+/g, 'N')
    : '';

  const signature = `${error.source}:${normalizedMessage}:${stackSignature}`;
  return crypto.createHash('md5').update(signature).digest('hex');
}

/**
 * Track error pattern and update occurrence count
 */
export function trackErrorPattern(error, aiCategory) {
  const patternHash = generateErrorHash(error);
  const now = Date.now();

  statements.upsertPattern.run(
    patternHash,
    aiCategory || 'Unknown',
    error.message.substring(0, 200), // Template (truncated)
    now,
    now,
    error.severity || 'medium'
  );

  return patternHash;
}

/**
 * Detect spikes in error rates
 * Returns alerts if current rate exceeds baseline by threshold
 */
export function detectSpikes(source, category, thresholdMultiplier = 2.0) {
  const now = Date.now();
  const currentBucket = Math.floor(now / 1000 / 300); // Current 5-min bucket

  // Get last 12 buckets (1 hour)
  const hourAgo = currentBucket - 12;

  const stats = statements.getStatsInRange.all(hourAgo, currentBucket);

  if (stats.length === 0) {
    return { spike: false, message: 'Insufficient data' };
  }

  // Calculate hourly average (exclude current bucket)
  const historicalStats = stats.filter(s => s.time_bucket < currentBucket);
  const avgErrorsPerBucket = historicalStats.length > 0
    ? historicalStats.reduce((sum, s) => sum + s.total_errors, 0) / historicalStats.length
    : 0;

  // Get current bucket errors
  const currentStats = stats.find(s => s.time_bucket === currentBucket);
  const currentErrors = currentStats ? currentStats.total_errors : 0;

  const spike = currentErrors > avgErrorsPerBucket * thresholdMultiplier;

  return {
    spike,
    currentRate: currentErrors,
    averageRate: Math.round(avgErrorsPerBucket * 10) / 10,
    threshold: Math.round(avgErrorsPerBucket * thresholdMultiplier * 10) / 10,
    multiplier: avgErrorsPerBucket > 0 ? (currentErrors / avgErrorsPerBucket).toFixed(2) : 0,
    source,
    category,
    message: spike
      ? `Spike detected! Current rate (${currentErrors}) is ${(currentErrors / avgErrorsPerBucket).toFixed(1)}x the baseline (${avgErrorsPerBucket.toFixed(1)})`
      : 'Normal error rate'
  };
}

/**
 * Calculate Levenshtein distance for string similarity
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Find similar errors based on message similarity
 */
export function findSimilarErrors(error, recentErrors, threshold = 0.7) {
  const similar = [];

  for (const candidate of recentErrors) {
    if (candidate.id === error.id) continue;

    const distance = levenshteinDistance(
      error.message.toLowerCase(),
      candidate.message.toLowerCase()
    );

    const maxLength = Math.max(error.message.length, candidate.message.length);
    const similarity = 1 - distance / maxLength;

    if (similarity >= threshold) {
      similar.push({
        ...candidate,
        similarity: Math.round(similarity * 100)
      });
    }
  }

  return similar.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Get error statistics for dashboard
 */
export function getErrorStatistics(timeWindowMs = 3600000) {
  const now = Date.now();
  const startTime = now - timeWindowMs;
  const currentBucket = Math.floor(now / 1000 / 300);
  const startBucket = Math.floor(startTime / 1000 / 300);

  // Get time-series data
  const timeSeries = statements.getStatsInRange.all(startBucket, currentBucket);

  // Get category breakdown
  const categories = statements.getCategoryCounts.all(startTime);

  // Calculate overall stats
  const totalErrors = timeSeries.reduce((sum, stat) => sum + stat.total_errors, 0);
  const errorRate = totalErrors / (timeWindowMs / 60000); // Errors per minute

  return {
    totalErrors,
    errorRate: Math.round(errorRate * 10) / 10,
    categories: categories.map(c => ({
      category: c.category || 'Unknown',
      count: c.count,
      lastOccurrence: c.last_occurrence
    })),
    timeSeries: timeSeries.map(stat => ({
      timestamp: stat.time_bucket * 300 * 1000, // Convert back to ms
      count: stat.total_errors,
      source: stat.source,
      category: stat.category
    }))
  };
}

export default {
  generateErrorHash,
  trackErrorPattern,
  detectSpikes,
  findSimilarErrors,
  getErrorStatistics
};
