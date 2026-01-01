import { db } from '../db/index.js';
import { isProTier, getSubscriptionByUserId } from './Subscription.js';

export interface Credits {
  id: number;
  user_id: number;
  remaining_credits: number;
  total_credits_used: number;
  last_reset_date: string; // YYYY-MM-DD format
  created_at: number;
  updated_at: number;
}

const FREE_TIER_DAILY_CREDITS = 10;
const PRO_TIER_DAILY_CREDITS = 9999; // Effectively unlimited

// Prepared statements
const statements = {
  getCredits: db.prepare<[number]>(`
    SELECT * FROM credits WHERE user_id = ?
  `),

  createCredits: db.prepare(`
    INSERT INTO credits (user_id, remaining_credits, last_reset_date)
    VALUES (?, ?, date('now'))
  `),

  updateCredits: db.prepare(`
    UPDATE credits
    SET remaining_credits = ?,
        total_credits_used = ?,
        last_reset_date = ?,
        updated_at = ?
    WHERE user_id = ?
  `),

  deductCredit: db.prepare(`
    UPDATE credits
    SET remaining_credits = remaining_credits - 1,
        total_credits_used = total_credits_used + 1,
        updated_at = ?
    WHERE user_id = ? AND remaining_credits > 0
  `),

  resetCredits: db.prepare(`
    UPDATE credits
    SET remaining_credits = ?,
        last_reset_date = date('now'),
        updated_at = ?
    WHERE user_id = ?
  `),
};

/**
 * Get credits for a user, creating if doesn't exist
 */
export function getCredits(userId: number): Credits {
  let credits = statements.getCredits.get(userId) as Credits | undefined;

  if (!credits) {
    // Create credits record if it doesn't exist
    statements.createCredits.run(userId, FREE_TIER_DAILY_CREDITS);
    credits = statements.getCredits.get(userId) as Credits;
  }

  // Check if we need to reset credits (new day)
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  if (credits.last_reset_date !== today) {
    const subscription = getSubscriptionByUserId(userId);
    const dailyLimit = subscription && isProTier(subscription)
      ? PRO_TIER_DAILY_CREDITS
      : FREE_TIER_DAILY_CREDITS;

    statements.resetCredits.run(dailyLimit, Date.now(), userId);
    credits = statements.getCredits.get(userId) as Credits;
  }

  return credits;
}

/**
 * Check if user has enough credits
 */
export function hasCredits(userId: number, required: number = 1): boolean {
  const credits = getCredits(userId);
  return credits.remaining_credits >= required;
}

/**
 * Deduct credits from user
 * Returns true if successful, false if insufficient credits
 */
export function deductCredits(userId: number, amount: number = 1): boolean {
  if (!hasCredits(userId, amount)) {
    return false;
  }

  for (let i = 0; i < amount; i++) {
    const result = statements.deductCredit.run(Date.now(), userId);
    if (result.changes === 0) {
      return false;
    }
  }

  return true;
}

/**
 * Get daily credit limit for user based on subscription
 */
export function getDailyLimit(userId: number): number {
  const subscription = getSubscriptionByUserId(userId);
  return subscription && isProTier(subscription)
    ? PRO_TIER_DAILY_CREDITS
    : FREE_TIER_DAILY_CREDITS;
}

/**
 * Get credits summary with additional info
 */
export interface CreditsSummary {
  remaining: number;
  used_today: number;
  daily_limit: number;
  is_pro: boolean;
  resets_at: string; // ISO timestamp for midnight
}

export function getCreditsSummary(userId: number): CreditsSummary {
  const credits = getCredits(userId);
  const subscription = getSubscriptionByUserId(userId);
  const isPro = subscription ? isProTier(subscription) : false;
  const dailyLimit = getDailyLimit(userId);

  // Calculate when credits reset (midnight)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return {
    remaining: credits.remaining_credits,
    used_today: dailyLimit - credits.remaining_credits,
    daily_limit: dailyLimit,
    is_pro: isPro,
    resets_at: tomorrow.toISOString(),
  };
}

export default {
  getCredits,
  hasCredits,
  deductCredits,
  getDailyLimit,
  getCreditsSummary,
};
