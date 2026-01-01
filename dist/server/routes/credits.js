import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { getCreditsSummary } from '../models/Credits.js';
const router = express.Router();
/**
 * GET /api/credits
 * Get current user's credit balance and info
 */
router.get('/', authenticateUser, (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const summary = getCreditsSummary(req.user.id);
        res.json({
            success: true,
            credits: summary
        });
    }
    catch (error) {
        console.error('Credits fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch credits',
            message: error.message
        });
    }
});
export default router;
//# sourceMappingURL=credits.js.map