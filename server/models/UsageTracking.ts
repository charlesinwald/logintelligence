import { db } from '../db/index.js';
import { getSubscriptionByUserId, isProTier } from './Subscription.js';

export interface UsageTracking {
  id: number;
  user_id: number;
  month: string; // YYYY-MM format
  error_count: number;
  ai_credit_count: number;
  last_reset_date: string; // YYYY-MM-DD format
  created_at: number;
  updated_at: number;
}

// Tier limits
const FREE_TIER_MONTHLY_ERROR_LIMIT = 1000;
const PRO_TIER_MONTHLY_ERROR_LIMIT = 999999; // Effectively unlimited

// Prepared statements
const statements = {
  getUsageTracking: db.prepare<[number, string]>(`
    SELECT * FROM usage_tracking 
    WHERE user_id = ? AND month = ?
  `),

  createUsageTracking: db.prepare(`
    INSERT INTO usage_tracking (user_id, month, error_count, ai_credit_count, last_reset_date)
    VALUES (?, ?, 0, 0, date('now'))
  `),

  incrementErrorCount: db.prepare(`
    UPDATE usage_tracking
    SET error_count = error_count + 1,
        updated_at = ?
    WHERE user_id = ? AND month = ?
  `),

  incrementAICreditCount: db.prepare(`
    UPDATE usage_tracking
    SET ai_credit_count = ai_credit_count + 1,
        updated_at = ?
    WHERE user_id = ? AND month = ?
  `),

  resetUsageTracking: db.prepare(`
    UPDATE usage_tracking
    SET error_count = 0,
        ai_credit_count = 0,
        last_reset_date = date('now'),
        updated_at = ?
    WHERE user_id = ? AND month = ?
  `),

  getCurrentMonthUsage: db.prepare<[number]>(`
    SELECT * FROM usage_tracking
    WHERE user_id = ? AND month = strftime('%Y-%m', 'now')
  `),
};

/**
 * Get or create usage tracking for current month
 */
function getOrCreateUsageTracking(userId: number): UsageTracking {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  
  let usage = statements.getUsageTracking.get(userId, currentMonth) as UsageTracking | undefined;

  if (!usage) {
    // Create usage tracking record for current month
    statements.createUsageTracking.run(userId, currentMonth);
    usage = statements.getUsageTracking.get(userId, currentMonth) as UsageTracking;
  }

  return usage!;
}

/**
 * Get monthly error count for a user
 */
export function getMonthlyErrorCount(userId: number, month?: string): number {
  const targetMonth = month || new Date().toISOString().slice(0, 7);
  const usage = statements.getUsageTracking.get(userId, targetMonth) as UsageTracking | undefined;
  return usage ? usage.error_count : 0;
}

/**
 * Increment error count for current month
 * Returns the new count
 */
export function incrementErrorCount(userId: number): number {
  const usage = getOrCreateUsageTracking(userId);
  statements.incrementErrorCount.run(Date.now(), userId, usage.month);
  
  const updated = statements.getUsageTracking.get(userId, usage.month) as UsageTracking;
  return updated.error_count;
}

/**
 * Increment AI credit count for current month
 * Returns the new count
 */
export function incrementAICreditCount(userId: number): number {
  const usage = getOrCreateUsageTracking(userId);
  statements.incrementAICreditCount.run(Date.now(), userId, usage.month);
  
  const updated = statements.getUsageTracking.get(userId, usage.month) as UsageTracking;
  return updated.ai_credit_count;
}

/**
 * Check if user can ingest more errors (under monthly limit)
 */
export function canIngestError(userId: number): boolean {
  const subscription = getSubscriptionByUserId(userId);
  const isPro = subscription ? isProTier(subscription) : false;
  
  if (isPro) {
    // Pro tier: unlimited errors
    return true;
  }

  // Free tier: check monthly limit
  const currentCount = getMonthlyErrorCount(userId);
  return currentCount < FREE_TIER_MONTHLY_ERROR_LIMIT;
}

/**
 * Get error limit for user based on subscription tier
 */
export function getErrorLimit(userId: number): number {
  const subscription = getSubscriptionByUserId(userId);
  const isPro = subscription ? isProTier(subscription) : false;
  return isPro ? PRO_TIER_MONTHLY_ERROR_LIMIT : FREE_TIER_MONTHLY_ERROR_LIMIT;
}

/**
 * Get comprehensive usage summary for a user
 */
export interface UsageSummary {
  error_count: number;
  error_limit: number;
  ai_credit_count: number;
  ai_credit_limit: number;
  month: string;
  is_pro: boolean;
  resets_at: string; // ISO timestamp for first day of next month
  error_usage_percent: number;
  ai_credit_usage_percent: number;
}

export function getUsageSummary(userId: number): UsageSummary {
  const subscription = getSubscriptionByUserId(userId);
  const isPro = subscription ? isProTier(subscription) : false;
  
  const currentMonth = new Date().toISOString().slice(0, 7);
  const usage = getOrCreateUsageTracking(userId);
  
  const errorLimit = getErrorLimit(userId);
  const aiCreditLimit = isPro ? 9999 : 100; // From Credits model
  
  // Calculate when usage resets (first day of next month)
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  nextMonth.setHours(0, 0, 0, 0);

  return {
    error_count: usage.error_count,
    error_limit: errorLimit,
    ai_credit_count: usage.ai_credit_count,
    ai_credit_limit: aiCreditLimit,
    month: currentMonth,
    is_pro: isPro,
    resets_at: nextMonth.toISOString(),
    error_usage_percent: errorLimit > 0 ? Math.round((usage.error_count / errorLimit) * 100) : 0,
    ai_credit_usage_percent: aiCreditLimit > 0 ? Math.round((usage.ai_credit_count / aiCreditLimit) * 100) : 0,
  };
}

export default {
  getMonthlyErrorCount,
  incrementErrorCount,
  incrementAICreditCount,
  canIngestError,
  getErrorLimit,
  getUsageSummary,
};
