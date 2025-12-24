import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { isProTier } from '../models/Subscription.js';

/**
 * Middleware to require Pro tier subscription
 * Must be used after authenticateUser middleware
 */
export function requirePro(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const subscription = req.user.subscription;

  // Check if user has Pro tier (including active trial)
  if (!isProTier(subscription)) {
    res.status(402).json({
      error: 'Pro subscription required',
      message: 'This feature requires a Pro subscription. Please upgrade to continue.',
      currentTier: subscription.tier,
      upgradeUrl: '/api/subscriptions/checkout'
    });
    return;
  }

  next();
}
