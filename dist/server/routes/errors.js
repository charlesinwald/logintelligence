import express from 'express';
import { z } from 'zod';
import { insertError, updateErrorWithAI, getRecentErrors, getErrorsInTimeRange, clearAllErrors as dbClearAllErrors } from '../db/index.js';
import { analyzeErrorStreaming } from '../services/ai.js';
import { trackErrorPattern, detectSpikes, findSimilarErrors, getErrorStatistics } from '../services/patterns.js';
import { verifyApiKey, updateApiKeyLastUsed } from '../models/ApiKey.js';
import { hasCredits, deductCredits } from '../models/Credits.js';
import { getSubscriptionByUserId, isProTier } from '../models/Subscription.js';
import { incrementErrorCount, getErrorLimit, getMonthlyErrorCount } from '../models/UsageTracking.js';
import { rateLimit } from '../middleware/rateLimit.js';
const router = express.Router();
// Apply rate limiting to all error routes
router.use(rateLimit());
// Validation schema
const errorSchema = z.object({
    message: z.string().min(1, 'Message is required'),
    stack_trace: z.string().optional(),
    timestamp: z.number().optional(),
    source: z.string().min(1, 'Source/service name is required'),
    severity: z.enum(['critical', 'high', 'medium', 'low', 'unknown']).optional(),
    category: z.string().optional(), // User-provided category
    environment: z.string().optional(),
    user_id: z.string().optional(),
    request_id: z.string().optional(),
    metadata: z.record(z.any()).optional(),
    analyze: z.boolean().optional() // Explicit flag to request AI analysis (for free tier)
});
const batchErrorSchema = z.object({
    errors: z.array(errorSchema).min(1).max(100) // Max 100 errors per batch
});
/**
 * Analyze error with AI and stream results
 * Requires credits - deducts 1 credit per analysis
 */
async function analyzeErrorWithStreaming(errorId, errorData, io, userId) {
    // Check if user has credits (if userId provided)
    if (userId && !hasCredits(userId)) {
        console.log(`[AI] Skipping analysis for error ${errorId} - user ${userId} has no credits`);
        io.emit('error:ai_failed', {
            errorId,
            error: 'Insufficient credits',
            message: 'Upgrade to Pro for unlimited AI analysis'
        });
        return;
    }
    let streamedText = '';
    const analysis = await analyzeErrorStreaming(errorData, (chunk) => {
        streamedText += chunk;
        // Emit each chunk to clients for real-time AI streaming
        io.emit('error:ai_stream', {
            errorId,
            chunk,
            fullText: streamedText
        });
    });
    // Deduct credit after successful analysis
    if (userId) {
        const deducted = deductCredits(userId);
        if (deducted) {
            console.log(`[AI] Deducted 1 credit from user ${userId} for error ${errorId}`);
        }
    }
    // Update database with final analysis
    updateErrorWithAI(errorId, analysis);
    // Track pattern
    const patternHash = trackErrorPattern(errorData, analysis.category);
    // Check for spikes
    const spikeDetection = detectSpikes(errorData.source, analysis.category);
    // Emit complete analysis
    io.emit('error:ai_complete', {
        errorId,
        analysis,
        patternHash,
        spike: spikeDetection.spike ? spikeDetection : null
    });
    // If spike detected, emit alert
    if (spikeDetection.spike) {
        io.emit('alert:spike', spikeDetection);
    }
}
/**
 * POST /api/errors
 * Ingest a single error or batch of errors
 */
router.post('/', async (req, res, next) => {
    const io = req.app.get('io');
    try {
        // Check for API key authentication (optional)
        let userId;
        const apiKey = req.headers['x-api-key'];
        if (apiKey) {
            const apiKeyRecord = verifyApiKey(apiKey);
            if (apiKeyRecord) {
                userId = apiKeyRecord.user_id;
                updateApiKeyLastUsed(apiKeyRecord.id);
            }
        }
        // Handle both single and batch submissions
        const isBatch = Array.isArray(req.body.errors);
        const errors = isBatch ? req.body.errors : [req.body];
        // Validate
        if (isBatch) {
            batchErrorSchema.parse(req.body);
        }
        else {
            errorSchema.parse(req.body);
        }
        const results = [];
        // Check error limits before processing (only for authenticated users)
        if (userId) {
            const errorLimit = getErrorLimit(userId);
            const currentCount = getMonthlyErrorCount(userId);
            const errorsCount = errors.length;
            const wouldExceedLimit = currentCount + errorsCount > errorLimit;
            if (wouldExceedLimit) {
                const subscription = getSubscriptionByUserId(userId);
                const isPro = subscription ? isProTier(subscription) : false;
                return res.status(429).json({
                    success: false,
                    error: 'Monthly error limit exceeded',
                    message: isPro
                        ? `This batch would exceed your monthly error limit. Please contact support.`
                        : `This batch would exceed your monthly limit of ${errorLimit} errors (current: ${currentCount}, batch: ${errorsCount}). Upgrade to Pro for unlimited error tracking.`,
                    limit: errorLimit,
                    current_count: currentCount,
                    batch_size: errorsCount,
                    remaining: Math.max(0, errorLimit - currentCount),
                    upgrade_url: '/upgrade',
                });
            }
        }
        for (const errorData of errors) {
            // Set timestamp if not provided
            if (!errorData.timestamp) {
                errorData.timestamp = Date.now();
            }
            // Insert error into database (with owner_id for tier limit tracking)
            const errorId = insertError(errorData, userId);
            // Track error count for authenticated users
            if (userId) {
                incrementErrorCount(userId);
            }
            // Determine if AI analysis should be performed
            let shouldAnalyze = false;
            let aiStatus = 'skipped';
            if (userId) {
                // Check subscription tier
                const subscription = getSubscriptionByUserId(userId);
                const isPro = subscription ? isProTier(subscription) : false;
                if (isPro) {
                    // Pro tier: Auto-analyze if user has credits
                    shouldAnalyze = hasCredits(userId);
                    aiStatus = shouldAnalyze ? 'processing' : 'skipped';
                }
                else {
                    // Free tier: Only analyze if explicitly requested via `analyze: true` flag
                    const explicitAnalyze = errorData.analyze === true;
                    if (explicitAnalyze && hasCredits(userId)) {
                        shouldAnalyze = true;
                        aiStatus = 'processing';
                    }
                    else {
                        aiStatus = 'not_available';
                    }
                }
            }
            else {
                // Legacy support: No userId, allow analysis (for backward compatibility)
                shouldAnalyze = true;
                aiStatus = 'processing';
            }
            // Emit raw error to connected clients immediately
            io.emit('error:new', {
                id: errorId,
                ...errorData,
                ai_status: aiStatus
            });
            results.push({ id: errorId });
            // Analyze with AI asynchronously if shouldAnalyze is true
            if (shouldAnalyze) {
                analyzeErrorWithStreaming(errorId, errorData, io, userId).catch((err) => {
                    console.error(`Failed to analyze error ${errorId}:`, err);
                    io.emit('error:ai_failed', { errorId, error: err.message });
                });
            }
            else if (userId && aiStatus === 'not_available') {
                // Emit message for free tier users that analysis is not automatic
                io.emit('error:ai_failed', {
                    errorId,
                    error: 'AI analysis not automatic',
                    message: 'Free tier users must explicitly request AI analysis by including "analyze": true in the error payload. Upgrade to Pro for automatic AI analysis.'
                });
            }
        }
        res.status(201).json({
            success: true,
            count: results.length,
            errors: results
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors
            });
        }
        console.error('Error ingestion failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to ingest error'
        });
    }
});
/**
 * GET /api/errors
 * Retrieve recent errors with optional filtering
 */
router.get('/', (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
        const errors = getRecentErrors(limit);
        res.json({
            success: true,
            count: errors.length,
            errors: errors.map(err => ({
                ...err,
                metadata: err.metadata ? JSON.parse(err.metadata) : null
            }))
        });
    }
    catch (error) {
        console.error('Failed to fetch errors:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch errors'
        });
    }
});
/**
 * GET /api/errors/stats
 * Get error statistics and category breakdown
 */
router.get('/stats', (req, res) => {
    try {
        const timeWindow = parseInt(req.query.window) || 3600000; // Default 1 hour
        const stats = getErrorStatistics(timeWindow);
        res.json({
            success: true,
            timeWindow,
            stats
        });
    }
    catch (error) {
        console.error('Failed to fetch stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics'
        });
    }
});
/**
 * GET /api/errors/:id
 * Get a specific error by ID with similar errors
 */
router.get('/:id', (req, res) => {
    try {
        const errorId = parseInt(req.params.id);
        const error = getRecentErrors(1000).find(e => e.id === errorId);
        if (!error) {
            return res.status(404).json({
                success: false,
                error: 'Error not found'
            });
        }
        // Find similar errors
        const recentErrors = getRecentErrors(500);
        const similar = findSimilarErrors(error, recentErrors, 0.7);
        res.json({
            success: true,
            error: {
                ...error,
                metadata: error.metadata ? JSON.parse(error.metadata) : null
            },
            similarErrors: similar.slice(0, 10) // Top 10 similar
        });
    }
    catch (error) {
        console.error('Failed to fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch error'
        });
    }
});
/**
 * POST /api/errors/:id/analyze
 * Manually request AI analysis for an existing error (useful for free tier users)
 */
router.post('/:id/analyze', async (req, res) => {
    const io = req.app.get('io');
    try {
        const errorId = parseInt(req.params.id);
        const error = getRecentErrors(1000).find(e => e.id === errorId);
        if (!error) {
            return res.status(404).json({
                success: false,
                error: 'Error not found'
            });
        }
        // Check for API key authentication
        let userId;
        const apiKey = req.headers['x-api-key'];
        if (apiKey) {
            const apiKeyRecord = verifyApiKey(apiKey);
            if (apiKeyRecord) {
                userId = apiKeyRecord.user_id;
                updateApiKeyLastUsed(apiKeyRecord.id);
            }
        }
        // Check if user has credits
        if (userId && !hasCredits(userId)) {
            const subscription = getSubscriptionByUserId(userId);
            const isPro = subscription ? isProTier(subscription) : false;
            return res.status(402).json({
                success: false,
                error: 'Insufficient credits',
                message: isPro
                    ? 'You have used all your monthly credits. Credits reset at the beginning of next month.'
                    : `You have used all your free monthly credits (100/month). Upgrade to Pro for unlimited AI analysis.`
            });
        }
        // Perform AI analysis
        const errorData = {
            message: error.message,
            stack_trace: error.stack_trace || null,
            timestamp: error.timestamp,
            source: error.source,
            severity: error.severity || 'unknown',
            environment: error.environment || null,
            user_id: error.user_id || null,
            request_id: error.request_id || null,
            metadata: error.metadata ? JSON.parse(error.metadata) : null,
            ai_category: error.ai_category || null
        };
        // Start analysis asynchronously
        analyzeErrorWithStreaming(errorId, errorData, io, userId).catch((err) => {
            console.error(`Failed to analyze error ${errorId}:`, err);
            io.emit('error:ai_failed', { errorId, error: err.message });
        });
        res.json({
            success: true,
            message: 'AI analysis started',
            errorId
        });
    }
    catch (error) {
        console.error('Failed to start AI analysis:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start AI analysis'
        });
    }
});
/**
 * GET /api/errors/range/:start/:end
 * Get errors in a specific time range
 */
router.get('/range/:start/:end', (req, res) => {
    try {
        const start = parseInt(req.params.start);
        const end = parseInt(req.params.end);
        if (isNaN(start) || isNaN(end)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid time range'
            });
        }
        const errors = getErrorsInTimeRange(start, end);
        res.json({
            success: true,
            count: errors.length,
            timeRange: { start, end },
            errors: errors.map(err => ({
                ...err,
                metadata: err.metadata ? JSON.parse(err.metadata) : null
            }))
        });
    }
    catch (error) {
        console.error('Failed to fetch errors in range:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch errors'
        });
    }
});
/**
 * DELETE /api/errors
 * Clear all errors from the database
 */
router.delete('/', (req, res) => {
    const io = req.app.get('io');
    try {
        // Clear all errors from the database
        dbClearAllErrors();
        // Notify all connected clients to clear their errors
        io.emit('errors:cleared');
        res.json({
            success: true,
            message: 'All errors cleared successfully'
        });
    }
    catch (error) {
        console.error('Failed to clear errors:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear errors'
        });
    }
});
export default router;
//# sourceMappingURL=errors.js.map