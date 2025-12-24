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
import { initializeSocketHandlers } from './socket/handler.js';
import './db/index.js'; // Initialize database

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
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

