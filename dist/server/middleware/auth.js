import { verifyAccessToken } from '../utils/jwt.js';
import { verifyApiKey, updateApiKeyLastUsed } from '../models/ApiKey.js';
import { getUserById } from '../models/User.js';
import { getSubscriptionByUserId } from '../models/Subscription.js';
/**
 * Authentication middleware
 * Supports both JWT tokens (Authorization header or cookie) and API keys (X-API-Key header)
 */
export function authenticateUser(req, res, next) {
    try {
        let userId = null;
        let email = null;
        // Check for API key first (X-API-Key header)
        const apiKey = req.headers['x-api-key'];
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
        }
        else {
            // Check for JWT token
            // Try Authorization header first
            const authHeader = req.headers.authorization;
            let token;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
            else {
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
            }
            catch (error) {
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
            console.warn(`[auth middleware] Subscription not found for user ID: ${user.id}. Assigning default free tier.`);
            // Assign a default free tier subscription if not found
            subscription = {
                id: -1, // Placeholder ID
                user_id: user.id,
                stripe_customer_id: 'N/A', // No Stripe customer for default
                stripe_subscription_id: null,
                tier: 'free',
                status: 'active',
                trial_start: null,
                trial_end: null,
                current_period_start: Date.now(),
                current_period_end: Date.now() + (10 * 365 * 24 * 60 * 60 * 1000), // 10 years from now
                cancel_at_period_end: 0,
                created_at: Date.now(),
                updated_at: Date.now()
            };
        }
        // Attach user data to request
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            subscription
        };
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
}
/**
 * Optional authentication middleware
 * Adds user data to request if authenticated, but doesn't require it
 */
export function optionalAuth(req, res, next) {
    try {
        authenticateUser(req, res, (err) => {
            // If authentication failed, continue anyway (but without user data)
            next();
        });
    }
    catch {
        // Continue without authentication
        next();
    }
}
//# sourceMappingURL=auth.js.map