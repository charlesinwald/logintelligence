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
/**
 * Create a new subscription
 */
export declare function createSubscription(data: CreateSubscriptionData): Subscription;
/**
 * Get subscription by ID
 */
export declare function getSubscriptionById(id: number): Subscription | null;
/**
 * Get subscription by user ID
 */
export declare function getSubscriptionByUserId(userId: number): Subscription | null;
/**
 * Get subscription by Stripe customer ID
 */
export declare function getSubscriptionByStripeCustomerId(customerId: string): Subscription | null;
/**
 * Get subscription by Stripe subscription ID
 */
export declare function getSubscriptionByStripeSubscriptionId(subscriptionId: string): Subscription | null;
/**
 * Update subscription
 */
export declare function updateSubscription(id: number, updates: UpdateSubscriptionData): Subscription;
/**
 * Delete subscription
 */
export declare function deleteSubscription(id: number): void;
/**
 * Check if user is on Pro tier (including active trial)
 */
export declare function isProTier(subscription: Subscription): boolean;
/**
 * Get subscription with tier check
 */
export declare function getSubscriptionWithAccess(userId: number): {
    subscription: Subscription;
    isPro: boolean;
} | null;
//# sourceMappingURL=Subscription.d.ts.map