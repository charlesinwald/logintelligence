import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { db } from '../db/index.js';
import { getSubscriptionByUserId, isProTier } from '../models/Subscription.js';
import { verifyApiKey } from '../models/ApiKey.js';

// Tier rate limits (requests per hour)
const FREE_TIER_HOURLY_LIMIT = 100;
const PRO_TIER_HOURLY_LIMIT = 1000;

// Prepared statements for rate limiting
const statements = {
  getRateLimitTracking: db.prepare<[number, number]>(`
    SELECT * FROM rate_limit_tracking
    WHERE user_id = ? AND hour_bucket = ?
  `),

  createRateLimitTracking: db.prepare(`
    INSERT INTO rate_limit_tracking (user_id, hour_bucket, request_count)
    VALUES (?, ?, 1)
  `),

  incrementRequestCount: db.prepare(`
    UPDATE rate_limit_tracking
    SET request_count = request_count + 1,
        updated_at = ?
    WHERE user_id = ? AND hour_bucket = ?
  `),

  cleanupOldEntries: db.prepare(`
    DELETE FROM rate_limit_tracking
    WHERE hour_bucket < ?
  `),
};

/**
 * Get current hour bucket (Unix timestamp rounded to nearest hour)
 */
function getCurrentHourBucket(): number {
  const now = Date.now();
  return Math.floor(now / 1000 / 3600); // Round down to nearest hour
}

/**
 * Get rate limit for user based on subscription tier
 */
function getRateLimit(userId: number): number {
  const subscription = getSubscriptionByUserId(userId);
  const isPro = subscription ? isProTier(subscription) : false;
  return isPro ? PRO_TIER_HOURLY_LIMIT : FREE_TIER_HOURLY_LIMIT;
}

/**
 * Get or create rate limit tracking for current hour
 */
function getOrCreateRateLimitTracking(userId: number, hourBucket: number): { request_count: number } {
  let tracking = statements.getRateLimitTracking.get(userId, hourBucket) as { request_count: number } | undefined;

  if (!tracking) {
    // Create new tracking record for this hour
    statements.createRateLimitTracking.run(userId, hourBucket);
    tracking = statements.getRateLimitTracking.get(userId, hourBucket) as { request_count: number };
  }

  return tracking!;
}

/**
 * Increment request count for current hour
 */
function incrementRequestCount(userId: number, hourBucket: number): number {
  const tracking = getOrCreateRateLimitTracking(userId, hourBucket);
  statements.incrementRequestCount.run(Date.now(), userId, hourBucket);
  
  const updated = statements.getRateLimitTracking.get(userId, hourBucket) as { request_count: number };
  return updated.request_count;
}

/**
 * Cleanup old rate limit entries (older than 24 hours)
 * Should be called periodically (e.g., on server startup and every hour)
 */
export function cleanupOldRateLimitEntries(): void {
  const twentyFourHoursAgo = getCurrentHourBucket() - 24;
  const result = statements.cleanupOldEntries.run(twentyFourHoursAgo);
  console.log(`[RateLimit] Cleaned up ${result.changes} old rate limit entries`);
}

/**
 * Rate limiting middleware
 * Enforces hourly request limits based on subscription tier
 * 
 * Free tier: 100 requests/hour
 * Pro tier: 1,000 requests/hour
 * 
 * Supports both JWT authentication (req.user) and API key authentication (X-API-Key header)
 */
export function rateLimit() {
  return (req: Request | AuthRequest, res: Response, next: NextFunction): void => {
    let userId: number | null = null;

    // Check for authenticated user (JWT)
    if ((req as AuthRequest).user) {
      userId = (req as AuthRequest).user!.id;
    } else {
      // Check for API key authentication
      const apiKey = req.headers['x-api-key'] as string | undefined;
      if (apiKey) {
        const apiKeyRecord = verifyApiKey(apiKey);
        if (apiKeyRecord) {
          userId = apiKeyRecord.user_id;
        }
      }
    }

    // Skip rate limiting if user is not authenticated
    // Unauthenticated requests are allowed through (they're limited by other means)
    if (!userId) {
      return next();
    }

    const hourBucket = getCurrentHourBucket();
    const rateLimit = getRateLimit(userId);

    // Get current request count for this hour
    const tracking = getOrCreateRateLimitTracking(userId, hourBucket);
    const currentCount = tracking.request_count;

    // Check if limit exceeded
    if (currentCount >= rateLimit) {
      // Calculate when the rate limit resets (next hour)
      const resetTime = (hourBucket + 1) * 3600 * 1000; // Next hour in milliseconds
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000); // Seconds until reset

      const subscription = getSubscriptionByUserId(userId);
      const isPro = subscription ? isProTier(subscription) : false;

      res.setHeader('Retry-After', retryAfter.toString());
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: isPro
          ? `You have exceeded your hourly rate limit of ${rateLimit} requests. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`
          : `You have exceeded your hourly rate limit of ${rateLimit} requests/hour. Upgrade to Pro for ${PRO_TIER_HOURLY_LIMIT} requests/hour.`,
        limit: rateLimit,
        current_count: currentCount,
        resets_at: new Date(resetTime).toISOString(),
        retry_after_seconds: retryAfter,
        upgrade_url: '/upgrade',
      });
      return;
    }

    // Increment request count
    incrementRequestCount(userId, hourBucket);

    // Add rate limit headers to response
    res.setHeader('X-RateLimit-Limit', rateLimit.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, rateLimit - currentCount - 1).toString());
    res.setHeader('X-RateLimit-Reset', ((hourBucket + 1) * 3600).toString());

    next();
  };
}

/**
 * Get rate limit status for a user (for API endpoints)
 */
export function getRateLimitStatus(userId: number): {
  limit: number;
  current_count: number;
  remaining: number;
  resets_at: string;
} {
  const hourBucket = getCurrentHourBucket();
  const rateLimit = getRateLimit(userId);
  const tracking = getOrCreateRateLimitTracking(userId, hourBucket);
  const currentCount = tracking.request_count;
  const resetTime = (hourBucket + 1) * 3600 * 1000;

  return {
    limit: rateLimit,
    current_count: currentCount,
    remaining: Math.max(0, rateLimit - currentCount),
    resets_at: new Date(resetTime).toISOString(),
  };
}

export default {
  rateLimit,
  getRateLimitStatus,
  cleanupOldRateLimitEntries,
};
