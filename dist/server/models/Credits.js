import { db } from '../db/index.js';
import { isProTier, getSubscriptionByUserId } from './Subscription.js';
import { incrementAICreditCount } from './UsageTracking.js';
const FREE_TIER_MONTHLY_CREDITS = 100; // 100 credits per month (~3 per day)
const PRO_TIER_MONTHLY_CREDITS = 9999; // Effectively unlimited
// Prepared statements
const statements = {
    getCredits: db.prepare(`
    SELECT * FROM credits WHERE user_id = ?
  `),
    createCredits: db.prepare(`
    INSERT INTO credits (user_id, remaining_credits, last_reset_date)
    VALUES (?, ?, strftime('%Y-%m', 'now'))
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
        last_reset_date = strftime('%Y-%m', 'now'),
        updated_at = ?
    WHERE user_id = ?
  `),
};
/**
 * Get credits for a user, creating if doesn't exist
 */
export function getCredits(userId) {
    let credits = statements.getCredits.get(userId);
    if (!credits) {
        // Create credits record if it doesn't exist
        const subscription = getSubscriptionByUserId(userId);
        const monthlyLimit = subscription && isProTier(subscription)
            ? PRO_TIER_MONTHLY_CREDITS
            : FREE_TIER_MONTHLY_CREDITS;
        statements.createCredits.run(userId, monthlyLimit);
        credits = statements.getCredits.get(userId);
    }
    // Check if we need to reset credits (new month)
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    if (credits.last_reset_date !== currentMonth) {
        const subscription = getSubscriptionByUserId(userId);
        const monthlyLimit = subscription && isProTier(subscription)
            ? PRO_TIER_MONTHLY_CREDITS
            : FREE_TIER_MONTHLY_CREDITS;
        statements.resetCredits.run(monthlyLimit, Date.now(), userId);
        credits = statements.getCredits.get(userId);
    }
    return credits;
}
/**
 * Check if user has enough credits
 */
export function hasCredits(userId, required = 1) {
    const credits = getCredits(userId);
    return credits.remaining_credits >= required;
}
/**
 * Deduct credits from user
 * Returns true if successful, false if insufficient credits
 */
export function deductCredits(userId, amount = 1) {
    if (!hasCredits(userId, amount)) {
        return false;
    }
    for (let i = 0; i < amount; i++) {
        const result = statements.deductCredit.run(Date.now(), userId);
        if (result.changes === 0) {
            return false;
        }
        // Track AI credit usage in usage_tracking table
        try {
            incrementAICreditCount(userId);
        }
        catch (error) {
            // Log but don't fail if usage tracking fails
            console.error(`Failed to track AI credit usage for user ${userId}:`, error);
        }
    }
    return true;
}
/**
 * Get monthly credit limit for user based on subscription
 */
export function getMonthlyLimit(userId) {
    const subscription = getSubscriptionByUserId(userId);
    return subscription && isProTier(subscription)
        ? PRO_TIER_MONTHLY_CREDITS
        : FREE_TIER_MONTHLY_CREDITS;
}
/**
 * Get daily credit limit for user based on subscription (deprecated, kept for backward compatibility)
 * @deprecated Use getMonthlyLimit instead
 */
export function getDailyLimit(userId) {
    return getMonthlyLimit(userId);
}
export function getCreditsSummary(userId) {
    const credits = getCredits(userId);
    const subscription = getSubscriptionByUserId(userId);
    const isPro = subscription ? isProTier(subscription) : false;
    const monthlyLimit = getMonthlyLimit(userId);
    // Calculate when credits reset (first day of next month)
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    nextMonth.setHours(0, 0, 0, 0);
    const usedThisMonth = monthlyLimit - credits.remaining_credits;
    return {
        remaining: credits.remaining_credits,
        used_this_month: usedThisMonth,
        monthly_limit: monthlyLimit,
        is_pro: isPro,
        resets_at: nextMonth.toISOString(),
        // Legacy fields for backward compatibility
        used_today: usedThisMonth,
        daily_limit: monthlyLimit,
    };
}
export default {
    getCredits,
    hasCredits,
    deductCredits,
    getMonthlyLimit,
    getDailyLimit, // Deprecated but kept for backward compatibility
    getCreditsSummary,
};
//# sourceMappingURL=Credits.js.map