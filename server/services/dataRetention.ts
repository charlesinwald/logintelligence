import { db } from '../db/index.js';
import { getSubscriptionByUserId, isProTier } from '../models/Subscription.js';

// Retention periods in milliseconds
const FREE_TIER_RETENTION_DAYS = 7;
const PRO_TIER_RETENTION_DAYS = 90;

const FREE_TIER_RETENTION_MS = FREE_TIER_RETENTION_DAYS * 24 * 60 * 60 * 1000;
const PRO_TIER_RETENTION_MS = PRO_TIER_RETENTION_DAYS * 24 * 60 * 60 * 1000;

/**
 * Get retention period in milliseconds for a user based on subscription tier
 */
export function getRetentionPeriod(userId: number): number {
  const subscription = getSubscriptionByUserId(userId);
  const isPro = subscription ? isProTier(subscription) : false;
  return isPro ? PRO_TIER_RETENTION_MS : FREE_TIER_RETENTION_MS;
}

/**
 * Get retention period in days for a user based on subscription tier
 */
export function getRetentionPeriodDays(userId: number): number {
  const subscription = getSubscriptionByUserId(userId);
  const isPro = subscription ? isProTier(subscription) : false;
  return isPro ? PRO_TIER_RETENTION_DAYS : FREE_TIER_RETENTION_DAYS;
}

/**
 * Delete errors older than retention period for a specific user
 * Returns number of errors deleted
 */
export function cleanupUserErrors(userId: number): number {
  const retentionPeriod = getRetentionPeriod(userId);
  const cutoffTime = Date.now() - retentionPeriod;

  const result = db.prepare(`
    DELETE FROM errors
    WHERE owner_id = ? AND timestamp < ?
  `).run(userId, cutoffTime);

  return result.changes;
}

/**
 * Cleanup old errors for all users based on their subscription tier
 * This is the main cleanup function that should be run periodically
 * Returns summary of cleanup operations
 */
export function cleanupOldErrors(): {
  totalDeleted: number;
  usersProcessed: number;
  errors: Array<{ userId: number; deleted: number; retentionDays: number }>;
} {
  // Get all users with their subscription info
  const users = db.prepare(`
    SELECT DISTINCT u.id, s.tier, s.status, s.trial_end
    FROM users u
    LEFT JOIN subscriptions s ON u.id = s.user_id
  `).all() as Array<{
    id: number;
    tier: string;
    status: string;
    trial_end: number | null;
  }>;

  let totalDeleted = 0;
  const errors: Array<{ userId: number; deleted: number; retentionDays: number }> = [];

  for (const user of users) {
    // Determine if user is on Pro tier
    const isPro = user.tier === 'pro' && 
      (user.status === 'active' || 
       (user.status === 'trialing' && user.trial_end && Date.now() < user.trial_end));

    const retentionDays = isPro ? PRO_TIER_RETENTION_DAYS : FREE_TIER_RETENTION_DAYS;
    const retentionMs = isPro ? PRO_TIER_RETENTION_MS : FREE_TIER_RETENTION_MS;
    const cutoffTime = Date.now() - retentionMs;

    // Delete errors older than retention period for this user
    const result = db.prepare(`
      DELETE FROM errors
      WHERE owner_id = ? AND timestamp < ?
    `).run(user.id, cutoffTime);

    const deleted = result.changes;
    totalDeleted += deleted;

    if (deleted > 0) {
      errors.push({
        userId: user.id,
        deleted,
        retentionDays
      });
    }
  }

  // Also cleanup errors without owner_id (legacy data) using free tier retention
  const legacyCutoffTime = Date.now() - FREE_TIER_RETENTION_MS;
  const legacyResult = db.prepare(`
    DELETE FROM errors
    WHERE owner_id IS NULL AND timestamp < ?
  `).run(legacyCutoffTime);

  totalDeleted += legacyResult.changes;

  return {
    totalDeleted,
    usersProcessed: users.length,
    errors
  };
}

/**
 * Cleanup old error stats (keep last 30 days for all tiers)
 */
export function cleanupOldErrorStats(): number {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const cutoffBucket = Math.floor(thirtyDaysAgo / 1000 / 300); // 5-minute buckets

  const result = db.prepare(`
    DELETE FROM error_stats
    WHERE time_bucket < ?
  `).run(cutoffBucket);

  return result.changes;
}

/**
 * Cleanup old error patterns (keep patterns seen in last 90 days)
 */
export function cleanupOldErrorPatterns(): number {
  const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);

  const result = db.prepare(`
    DELETE FROM error_patterns
    WHERE last_seen < ?
  `).run(ninetyDaysAgo);

  return result.changes;
}

/**
 * Run all cleanup operations
 * Should be called periodically (e.g., daily)
 */
export function runAllCleanup(): {
  errors: ReturnType<typeof cleanupOldErrors>;
  stats: number;
  patterns: number;
} {
  console.log('[DataRetention] Starting cleanup operations...');
  
  const errors = cleanupOldErrors();
  const stats = cleanupOldErrorStats();
  const patterns = cleanupOldErrorPatterns();

  console.log(`[DataRetention] Cleanup complete:`);
  console.log(`  - Errors deleted: ${errors.totalDeleted} (${errors.usersProcessed} users processed)`);
  console.log(`  - Error stats deleted: ${stats}`);
  console.log(`  - Error patterns deleted: ${patterns}`);

  return {
    errors,
    stats,
    patterns
  };
}

export default {
  getRetentionPeriod,
  getRetentionPeriodDays,
  cleanupUserErrors,
  cleanupOldErrors,
  cleanupOldErrorStats,
  cleanupOldErrorPatterns,
  runAllCleanup,
};
