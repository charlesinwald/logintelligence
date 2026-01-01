import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { verifyApiKey, updateApiKeyLastUsed } from '../models/ApiKey.js';
import { getUserById } from '../models/User.js';
import { getSubscriptionByUserId, createSubscription } from '../models/Subscription.js';
import type { User } from '../models/User.js';
import type { Subscription } from '../models/Subscription.js';

// Extend Express Request to include user data
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string | null;
    subscription: Subscription;
  };
}

/**
 * Authentication middleware
 * Supports both JWT tokens (Authorization header or cookie) and API keys (X-API-Key header)
 */
export function authenticateUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    let userId: number | null = null;
    let email: string | null = null;

    // Check for API key first (X-API-Key header)
    const apiKey = req.headers['x-api-key'] as string | undefined;
    if (apiKey) {
      const apiKeyRecord = verifyApiKey(apiKey);
      if (!apiKeyRecord) {
        res.status(401).json({ error: 'Invalid API key' });
        return;
      }

      // Update last used timestamp
      updateApiKeyLastUsed(apiKeyRecord.id);

      // Get user from API key
      const user = getUserById(apiKeyRecord.user_id);
      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }

      userId = user.id;
      email = user.email;
    } else {
      // Check for JWT token
      // Try Authorization header first
      const authHeader = req.headers.authorization;
      let token: string | undefined;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else {
        // Try cookie
        token = req.cookies?.accessToken;
      }

      if (!token) {
        res.status(401).json({ error: 'No authentication token provided' });
        return;
      }

      // Verify JWT token
      try {
        const payload = verifyAccessToken(token);
        userId = payload.userId;
        email = payload.email;
      } catch (error: any) {
        res.status(401).json({ error: error.message || 'Invalid token' });
        return;
      }
    }

    // Load user data
    if (!userId) {
      res.status(401).json({ error: 'Authentication failed' });
      return;
    }

    const user = getUserById(userId);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Load subscription
    let subscription = getSubscriptionByUserId(user.id);
    if (!subscription) {
      console.warn(`[auth middleware] Subscription not found for user ID: ${user.id}. Creating default free tier subscription in DB.`);
      // Create a real subscription in the database for users who don't have one
      // This handles migration for existing users created before subscriptions were mandatory
      subscription = createSubscription({
        user_id: user.id,
        stripe_customer_id: `cus_local_${user.id}_${Date.now()}`, // Placeholder for local/legacy users
        tier: 'free',
        status: 'active'
      });
      console.log(`[auth middleware] Created subscription ${subscription.id} for user ${user.id}`);
    }

    // Attach user data to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      subscription
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Optional authentication middleware
 * Adds user data to request if authenticated, but doesn't require it
 */
export function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    authenticateUser(req, res, (err?: any) => {
      // If authentication failed, continue anyway (but without user data)
      next();
    });
  } catch {
    // Continue without authentication
    next();
  }
}
