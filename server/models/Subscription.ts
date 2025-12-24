import { db } from '../db/index.js';
import type { Statement } from 'better-sqlite3';

export type SubscriptionTier = 'free' | 'pro';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';

export interface Subscription {
  id: number;
  user_id: number;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  trial_start: number | null;
  trial_end: number | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: number;
  created_at: number;
  updated_at: number;
}

export interface CreateSubscriptionData {
  user_id: number;
  stripe_customer_id: string;
  stripe_subscription_id?: string | null;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  trial_start?: number | null;
  trial_end?: number | null;
  current_period_start?: number | null;
  current_period_end?: number | null;
}

export interface UpdateSubscriptionData {
  stripe_subscription_id?: string | null;
  tier?: SubscriptionTier;
  status?: SubscriptionStatus;
  trial_start?: number | null;
  trial_end?: number | null;
  current_period_start?: number | null;
  current_period_end?: number | null;
  cancel_at_period_end?: number;
}

// Prepared statements
const statements = {
  insertSubscription: db.prepare(`
    INSERT INTO subscriptions (
      user_id, stripe_customer_id, stripe_subscription_id, tier, status,
      trial_start, trial_end, current_period_start, current_period_end
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),

  getSubscriptionById: db.prepare<[number]>(`
    SELECT * FROM subscriptions WHERE id = ?
  `),

  getSubscriptionByUserId: db.prepare<[number]>(`
    SELECT * FROM subscriptions WHERE user_id = ?
  `),

  getSubscriptionByStripeCustomerId: db.prepare<[string]>(`
    SELECT * FROM subscriptions WHERE stripe_customer_id = ?
  `),

  getSubscriptionByStripeSubscriptionId: db.prepare<[string]>(`
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

  deleteSubscription: db.prepare<[number]>(`
    DELETE FROM subscriptions WHERE id = ?
  `)
};

/**
 * Create a new subscription
 */
export function createSubscription(data: CreateSubscriptionData): Subscription {
  const result = statements.insertSubscription.run(
    data.user_id,
    data.stripe_customer_id,
    data.stripe_subscription_id || null,
    data.tier,
    data.status,
    data.trial_start || null,
    data.trial_end || null,
    data.current_period_start || null,
    data.current_period_end || null
  );

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
export function getSubscriptionById(id: number): Subscription | null {
  return statements.getSubscriptionById.get(id) as Subscription | undefined || null;
}

/**
 * Get subscription by user ID
 */
export function getSubscriptionByUserId(userId: number): Subscription | null {
  return statements.getSubscriptionByUserId.get(userId) as Subscription | undefined || null;
}

/**
 * Get subscription by Stripe customer ID
 */
export function getSubscriptionByStripeCustomerId(customerId: string): Subscription | null {
  return statements.getSubscriptionByStripeCustomerId.get(customerId) as Subscription | undefined || null;
}

/**
 * Get subscription by Stripe subscription ID
 */
export function getSubscriptionByStripeSubscriptionId(subscriptionId: string): Subscription | null {
  return statements.getSubscriptionByStripeSubscriptionId.get(subscriptionId) as Subscription | undefined || null;
}

/**
 * Update subscription
 */
export function updateSubscription(id: number, updates: UpdateSubscriptionData): Subscription {
  const now = Date.now();

  statements.updateSubscription.run(
    updates.stripe_subscription_id !== undefined ? updates.stripe_subscription_id : null,
    updates.tier || null,
    updates.status || null,
    updates.trial_start !== undefined ? updates.trial_start : null,
    updates.trial_end !== undefined ? updates.trial_end : null,
    updates.current_period_start !== undefined ? updates.current_period_start : null,
    updates.current_period_end !== undefined ? updates.current_period_end : null,
    updates.cancel_at_period_end !== undefined ? updates.cancel_at_period_end : null,
    now,
    id
  );

  const subscription = getSubscriptionById(id);
  if (!subscription) {
    throw new Error('Subscription not found after update');
  }

  return subscription;
}

/**
 * Delete subscription
 */
export function deleteSubscription(id: number): void {
  statements.deleteSubscription.run(id);
}

/**
 * Check if user is on Pro tier (including active trial)
 */
export function isProTier(subscription: Subscription): boolean {
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
export function getSubscriptionWithAccess(userId: number): {
  subscription: Subscription;
  isPro: boolean;
} | null {
  const subscription = getSubscriptionByUserId(userId);
  if (!subscription) {
    return null;
  }

  return {
    subscription,
    isPro: isProTier(subscription)
  };
}
