import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Server as SocketIOServer } from 'socket.io';
import { insertError, updateErrorWithAI, getRecentErrors, getErrorsInTimeRange, clearAllErrors as dbClearAllErrors, type ErrorData } from '../db/index.js';
import { analyzeErrorStreaming } from '../services/ai.js';
import { trackErrorPattern, detectSpikes, findSimilarErrors, getErrorStatistics, type SpikeDetection } from '../services/patterns.js';

const router = express.Router();

// Extend Express Request to include io
interface RequestWithIO extends Request {
  app: express.Application & {
    get: (key: string) => SocketIOServer;
  };
}

// Validation schema
const errorSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  stack_trace: z.string().optional(),
  timestamp: z.number().optional(),
  source: z.string().min(1, 'Source/service name is required'),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'unknown']).optional(),
  environment: z.string().optional(),
  user_id: z.string().optional(),
  request_id: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const batchErrorSchema = z.object({
  errors: z.array(errorSchema).min(1).max(100) // Max 100 errors per batch
});

/**
 * Analyze error with AI and stream results
 */
async function analyzeErrorWithStreaming(
  errorId: number,
  errorData: ErrorData,
  io: SocketIOServer
): Promise<void> {
  let streamedText = '';

  const analysis = await analyzeErrorStreaming(errorData, (chunk: string) => {
    streamedText += chunk;
    // Emit each chunk to clients for real-time AI streaming
    io.emit('error:ai_stream', {
      errorId,
      chunk,
      fullText: streamedText
    });
  });

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
router.post('/', async (req: RequestWithIO, res: Response, next: NextFunction) => {
  const io = req.app.get('io');

  try {
    // Handle both single and batch submissions
    const isBatch = Array.isArray(req.body.errors);
    const errors = isBatch ? req.body.errors : [req.body];

    // Validate
    if (isBatch) {
      batchErrorSchema.parse(req.body);
    } else {
      errorSchema.parse(req.body);
    }

    const results: Array<{ id: number }> = [];

    for (const errorData of errors) {
      // Set timestamp if not provided
      if (!errorData.timestamp) {
        errorData.timestamp = Date.now();
      }

      // Insert error into database
      const errorId = insertError(errorData as ErrorData);

      // Emit raw error to connected clients immediately
      io.emit('error:new', {
        id: errorId,
        ...errorData,
        ai_status: 'processing'
      });

      results.push({ id: errorId });

      // Analyze with AI asynchronously (don't block response)
      analyzeErrorWithStreaming(errorId, errorData as ErrorData, io).catch((err: Error) => {
        console.error(`Failed to analyze error ${errorId}:`, err);
        io.emit('error:ai_failed', { errorId, error: err.message });
      });
    }

    res.status(201).json({
      success: true,
      count: results.length,
      errors: results
    });

  } catch (error) {
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
router.get('/', (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
    const errors = getRecentErrors(limit);

    res.json({
      success: true,
      count: errors.length,
      errors: errors.map(err => ({
        ...err,
        metadata: err.metadata ? JSON.parse(err.metadata as unknown as string) : null
      }))
    });
  } catch (error) {
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
router.get('/stats', (req: Request, res: Response) => {
  try {
    const timeWindow = parseInt(req.query.window as string) || 3600000; // Default 1 hour
    const stats = getErrorStatistics(timeWindow);

    res.json({
      success: true,
      timeWindow,
      stats
    });
  } catch (error) {
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
router.get('/:id', (req: Request, res: Response) => {
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
        metadata: error.metadata ? JSON.parse(error.metadata as unknown as string) : null
      },
      similarErrors: similar.slice(0, 10) // Top 10 similar
    });
  } catch (error) {
    console.error('Failed to fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch error'
    });
  }
});

/**
 * GET /api/errors/range/:start/:end
 * Get errors in a specific time range
 */
router.get('/range/:start/:end', (req: Request, res: Response) => {
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
        metadata: err.metadata ? JSON.parse(err.metadata as unknown as string) : null
      }))
    });
  } catch (error) {
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
router.delete('/', (req: RequestWithIO, res: Response) => {
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
  } catch (error) {
    console.error('Failed to clear errors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear errors'
    });
  }
});

export default router;

