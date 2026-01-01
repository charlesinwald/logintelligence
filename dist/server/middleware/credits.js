import { hasCredits, getCreditsSummary } from '../models/Credits.js';
/**
 * Middleware to check if user has enough credits for AI operations
 * Returns 402 Payment Required if insufficient credits
 */
export function requireCredits(creditsNeeded = 1) {
    return (req, res, next) => {
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
                    ? 'You have used all your daily credits. Please try again tomorrow.'
                    : 'You have used all your free daily credits. Upgrade to Pro for unlimited AI analysis.',
                credits: {
                    remaining: summary.remaining,
                    daily_limit: summary.daily_limit,
                    resets_at: summary.resets_at,
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
export function attachCredits(req, res, next) {
    if (req.user) {
        try {
            const summary = getCreditsSummary(req.user.id);
            // Attach to request for use in handlers
            req.credits = summary;
        }
        catch (error) {
            console.error('Failed to attach credits:', error);
        }
    }
    next();
}
//# sourceMappingURL=credits.js.map