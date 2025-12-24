import { db } from '../db/index.js';
// Prepared statements
const statements = {
    insertSubscription: db.prepare(`
    INSERT INTO subscriptions (
      user_id, stripe_customer_id, stripe_subscription_id, tier, status,
      trial_start, trial_end, current_period_start, current_period_end
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
    getSubscriptionById: db.prepare(`
    SELECT * FROM subscriptions WHERE id = ?
  `),
    getSubscriptionByUserId: db.prepare(`
    SELECT * FROM subscriptions WHERE user_id = ?
  `),
    getSubscriptionByStripeCustomerId: db.prepare(`
    SELECT * FROM subscriptions WHERE stripe_customer_id = ?
  `),
    getSubscriptionByStripeSubscriptionId: db.prepare(`
    SELECT * FROM subscriptions WHERE stripe_subscription_id = ?
  `),
    updateSubscription: db.prepare(`
    UPDATE subscriptions
    SET stripe_subscription_id = COALESCE(?, stripe_subscription_id),
        tier = COALESCE(?, tier),
        status = COALESCE(?, status),
        trial_start = COALESCE(?, trial_start),
        trial_end = COALESCE(?, trial_end),
        current_period_start = COALESCE(?, current_period_start),
        current_period_end = COALESCE(?, current_period_end),
        cancel_at_period_end = COALESCE(?, cancel_at_period_end),
        updated_at = ?
    WHERE id = ?
  `),
    deleteSubscription: db.prepare(`
    DELETE FROM subscriptions WHERE id = ?
  `)
};
/**
 * Create a new subscription
 */
export function createSubscription(data) {
    const result = statements.insertSubscription.run(data.user_id, data.stripe_customer_id, data.stripe_subscription_id || null, data.tier, data.status, data.trial_start || null, data.trial_end || null, data.current_period_start || null, data.current_period_end || null);
    const subscriptionId = Number(result.lastInsertRowid);
    const subscription = getSubscriptionById(subscriptionId);
    if (!subscription) {
        throw new Error('Failed to create subscription');
    }
    return subscription;
}
/**
 * Get subscription by ID
 */
export function getSubscriptionById(id) {
    return statements.getSubscriptionById.get(id) || null;
}
/**
 * Get subscription by user ID
 */
export function getSubscriptionByUserId(userId) {
    return statements.getSubscriptionByUserId.get(userId) || null;
}
/**
 * Get subscription by Stripe customer ID
 */
export function getSubscriptionByStripeCustomerId(customerId) {
    return statements.getSubscriptionByStripeCustomerId.get(customerId) || null;
}
/**
 * Get subscription by Stripe subscription ID
 */
export function getSubscriptionByStripeSubscriptionId(subscriptionId) {
    return statements.getSubscriptionByStripeSubscriptionId.get(subscriptionId) || null;
}
/**
 * Update subscription
 */
export function updateSubscription(id, updates) {
    const now = Date.now();
    statements.updateSubscription.run(updates.stripe_subscription_id !== undefined ? updates.stripe_subscription_id : null, updates.tier || null, updates.status || null, updates.trial_start !== undefined ? updates.trial_start : null, updates.trial_end !== undefined ? updates.trial_end : null, updates.current_period_start !== undefined ? updates.current_period_start : null, updates.current_period_end !== undefined ? updates.current_period_end : null, updates.cancel_at_period_end !== undefined ? updates.cancel_at_period_end : null, now, id);
    const subscription = getSubscriptionById(id);
    if (!subscription) {
        throw new Error('Subscription not found after update');
    }
    return subscription;
}
/**
 * Delete subscription
 */
export function deleteSubscription(id) {
    statements.deleteSubscription.run(id);
}
/**
 * Check if user is on Pro tier (including active trial)
 */
export function isProTier(subscription) {
    if (subscription.tier === 'pro') {
        // Check if subscription is active or in trial
        if (subscription.status === 'active' || subscription.status === 'trialing') {
            // If trialing, check if trial hasn't expired
            if (subscription.status === 'trialing' && subscription.trial_end) {
                return Date.now() < subscription.trial_end;
            }
            return true;
        }
    }
    return false;
}
/**
 * Get subscription with tier check
 */
export function getSubscriptionWithAccess(userId) {
    const subscription = getSubscriptionByUserId(userId);
    if (!subscription) {
        return null;
    }
    return {
        subscription,
        isPro: isProTier(subscription)
    };
}
//# sourceMappingURL=Subscription.js.map