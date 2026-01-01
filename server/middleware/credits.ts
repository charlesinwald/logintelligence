import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { hasCredits, getCreditsSummary } from '../models/Credits.js';

/**
 * Middleware to check if user has enough credits for AI operations
 * Returns 402 Payment Required if insufficient credits
 */
export function requireCredits(creditsNeeded: number = 1) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userId = req.user.id;

    if (!hasCredits(userId, creditsNeeded)) {
      const summary = getCreditsSummary(userId);

      res.status(402).json({
        error: 'Insufficient credits',
        message: summary.is_pro
          ? 'You have used all your monthly credits. Credits reset at the beginning of next month.'
          : `You have used all your free monthly credits (${summary.monthly_limit}/month). Upgrade to Pro for unlimited AI analysis.`,
        credits: {
          remaining: summary.remaining,
          used_this_month: summary.used_this_month,
          monthly_limit: summary.monthly_limit,
          resets_at: summary.resets_at,
          // Legacy fields for backward compatibility
          daily_limit: summary.daily_limit,
        },
        upgrade_url: '/upgrade',
      });
      return;
    }

    next();
  };
}

/**
 * Optional middleware that adds credit info to request but doesn't block
 */
export function attachCredits(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user) {
    try {
      const summary = getCreditsSummary(req.user.id);
      // Attach to request for use in handlers
      (req as any).credits = summary;
    } catch (error) {
      console.error('Failed to attach credits:', error);
    }
  }
  next();
}
