export interface Credits {
    id: number;
    user_id: number;
    remaining_credits: number;
    total_credits_used: number;
    last_reset_date: string;
    created_at: number;
    updated_at: number;
}
/**
 * Get credits for a user, creating if doesn't exist
 */
export declare function getCredits(userId: number): Credits;
/**
 * Check if user has enough credits
 */
export declare function hasCredits(userId: number, required?: number): boolean;
/**
 * Deduct credits from user
 * Returns true if successful, false if insufficient credits
 */
export declare function deductCredits(userId: number, amount?: number): boolean;
/**
 * Get daily credit limit for user based on subscription
 */
export declare function getDailyLimit(userId: number): number;
/**
 * Get credits summary with additional info
 */
export interface CreditsSummary {
    remaining: number;
    used_today: number;
    daily_limit: number;
    is_pro: boolean;
    resets_at: string;
}
export declare function getCreditsSummary(userId: number): CreditsSummary;
declare const _default: {
    getCredits: typeof getCredits;
    hasCredits: typeof hasCredits;
    deductCredits: typeof deductCredits;
    getDailyLimit: typeof getDailyLimit;
    getCreditsSummary: typeof getCreditsSummary;
};
export default _default;
//# sourceMappingURL=Credits.d.ts.map