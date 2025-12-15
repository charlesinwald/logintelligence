import { getRecentErrors, getCategoryStats } from '../db/index.js';
import { getErrorStatistics, detectSpikes } from '../services/patterns.js';

/**
 * Initialize WebSocket event handlers
 */
export function initializeSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`✓ Client connected: ${socket.id}`);

    // Send initial data on connection
    socket.emit('connection:established', {
      message: 'Connected to Error Intelligence Dashboard',
      timestamp: Date.now()
    });

    // Handle request for initial data
    socket.on('request:initial_data', async ({ timeWindow = 3600000 } = {}) => {
      try {
        const recentErrors = getRecentErrors(100);
        const stats = getErrorStatistics(timeWindow);

        socket.emit('data:initial', {
          errors: recentErrors.map(err => ({
            ...err,
            metadata: err.metadata ? JSON.parse(err.metadata) : null
          })),
          stats,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Failed to send initial data:', error);
        socket.emit('error:server', {
          message: 'Failed to load initial data',
          error: error.message
        });
      }
    });

    // Handle request for updated stats
    socket.on('request:stats', async ({ timeWindow = 3600000 } = {}) => {
      try {
        const stats = getErrorStatistics(timeWindow);
        socket.emit('data:stats', { stats, timestamp: Date.now() });
      } catch (error) {
        console.error('Failed to send stats:', error);
        socket.emit('error:server', {
          message: 'Failed to load statistics',
          error: error.message
        });
      }
    });

    // Handle spike check requests
    socket.on('request:spike_check', async ({ source, category } = {}) => {
      try {
        const spikeInfo = detectSpikes(source, category);
        socket.emit('data:spike_check', spikeInfo);
      } catch (error) {
        console.error('Failed to check spikes:', error);
        socket.emit('error:server', {
          message: 'Failed to check for spikes',
          error: error.message
        });
      }
    });

    // Heartbeat for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`✗ Client disconnected: ${socket.id} (${reason})`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  // Periodic stats broadcast (every 30 seconds)
  setInterval(() => {
    try {
      const stats = getErrorStatistics(3600000); // 1 hour window
      io.emit('data:stats_update', {
        stats,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to broadcast stats update:', error);
    }
  }, 30000);

  console.log('✓ WebSocket handlers initialized');
}

export default { initializeSocketHandlers };
