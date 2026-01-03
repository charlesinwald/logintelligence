import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import routes and services
import errorRoutes from './routes/errors.js';
import authRoutes from './routes/auth.js';
import subscriptionRoutes from './routes/subscriptions.js';
import creditsRoutes from './routes/credits.js';
import { initializeSocketHandlers } from './socket/handler.js';
import { cleanupOldRateLimitEntries } from './middleware/rateLimit.js';
import { runAllCleanup } from './services/dataRetention.js';
import './db/index.js'; // Initialize database

dotenv.config();
console.log(process.env.STRIPE_SECRET_KEY);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Set COOP header to allow Google sign-in popups
app.use((_req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
      : 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 7878;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : 'http://localhost:5173',
  credentials: true
}));
app.use(cookieParser());

// Stripe webhook route needs raw body, so register it before JSON middleware
app.use('/api/subscriptions/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' })); // Support larger error batches
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// Make io available to routes
app.set('io', io);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/errors', errorRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/credits', creditsRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = join(__dirname, '../../client/dist');

  // Serve static assets
  app.use(express.static(clientDistPath));

  // Serve index.html for all non-API routes
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(join(clientDistPath, 'index.html'));
  });
}

// Error handling middleware
const errorHandler: ErrorRequestHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status((err as any).status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

app.use(errorHandler);

// Initialize WebSocket handlers
initializeSocketHandlers(io);

// Cleanup old rate limit entries on startup
cleanupOldRateLimitEntries();

// Set up periodic cleanup of old rate limit entries (every hour)
setInterval(() => {
  cleanupOldRateLimitEntries();
}, 60 * 60 * 1000); // Every hour

// Start server
httpServer.listen(PORT, () => {
  const portStr = String(PORT).padEnd(4);
  const envStr = (process.env.NODE_ENV || 'development').padEnd(11);
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 LogIntelligence Dashboard Server                  ║
║                                                            ║
║   Server running on: http://localhost:${portStr}              ║
║   Environment: ${envStr}                                   ║
║   WebSocket: Ready                                         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);

  // Run data retention cleanup on startup (after server is ready)
  console.log('[Server] Running initial data retention cleanup...');
  runAllCleanup();

  // Set up periodic data retention cleanup (daily at 2 AM)
  // Calculate milliseconds until next 2 AM
  function getMillisecondsUntil2AM(): number {
    const now = new Date();
    const next2AM = new Date();
    next2AM.setHours(2, 0, 0, 0);
    
    // If it's already past 2 AM today, schedule for tomorrow
    if (now.getTime() >= next2AM.getTime()) {
      next2AM.setDate(next2AM.getDate() + 1);
    }
    
    return next2AM.getTime() - now.getTime();
  }

  // Schedule first cleanup
  const initialDelay = getMillisecondsUntil2AM();
  setTimeout(() => {
    runAllCleanup();
    // Then run daily
    setInterval(() => {
      runAllCleanup();
    }, 24 * 60 * 60 * 1000); // Every 24 hours
  }, initialDelay);

  console.log(`[Server] Data retention cleanup scheduled to run daily at 2 AM (first run in ${Math.round(initialDelay / 1000 / 60)} minutes)`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { app, io };

