import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

// Type definitions
export interface ErrorRecord {
  id: number;
  message: string;
  stack_trace?: string | null;
  timestamp: number;
  source: string;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'unknown';
  environment?: string | null;
  user_id?: string | null;
  request_id?: string | null;
  metadata?: Record<string, any> | null;
  ai_category?: string | null;
  ai_severity?: string | null;
  ai_hypothesis?: string | null;
  ai_status?: 'processing' | 'complete' | 'failed';
}

export interface ErrorStatistics {
  totalErrors: number;
  errorRate: number;
  categories: Array<{
    category: string | null;
    count: number;
    lastOccurrence: number;
  }>;
  timeSeries: Array<{
    timestamp: number;
    count: number;
    source: string;
    category: string | null;
  }>;
}

export interface SpikeAlert {
  spike: boolean;
  currentRate: number;
  averageRate: number;
  threshold: number;
  multiplier: string;
  source: string;
  category: string | null;
  message: string;
}

export interface UseSocketReturn {
  connected: boolean;
  errors: ErrorRecord[];
  stats: ErrorStatistics | null;
  aiStreaming: Record<number, string>;
  spikes: SpikeAlert[];
  requestStats: (timeWindow?: number) => void;
  clearSpike: (index: number) => void;
  clearErrors: () => Promise<void>;
  hideError: (id: number) => void;
  reconnect: () => void;
}

/**
 * Normalize stats data to ensure arrays aren't stringified
 */
function normalizeStats(stats: any): ErrorStatistics {
  return {
    ...stats,
    categories: typeof stats.categories === 'string' ? JSON.parse(stats.categories) : (stats.categories || []),
    timeSeries: typeof stats.timeSeries === 'string' ? JSON.parse(stats.timeSeries) : (stats.timeSeries || [])
  };
}

/**
 * Compute stats from errors array as fallback when server stats are empty
 */
function computeStatsFromErrors(errors: ErrorRecord[], timeWindowMs: number = 3600000): ErrorStatistics {
  const now = Date.now();
  const startTime = now - timeWindowMs;
  
  // Filter errors within time window (or all errors if they're outside the window)
  const errorsInWindow = errors.filter(err => err.timestamp >= startTime || errors.length > 0 && errors.every(e => e.timestamp > now));
  
  // Use all errors if they're all outside the window (likely test data with future timestamps)
  const errorsToUse = errorsInWindow.length > 0 ? errorsInWindow : errors;
  
  // Group by category
  const categoryMap = new Map<string | null, { count: number; lastOccurrence: number }>();
  
  errorsToUse.forEach(error => {
    const category = error.ai_category || null;
    const existing = categoryMap.get(category) || { count: 0, lastOccurrence: 0 };
    categoryMap.set(category, {
      count: existing.count + 1,
      lastOccurrence: Math.max(existing.lastOccurrence, error.timestamp)
    });
  });
  
  // Convert to array format
  const categories = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      count: data.count,
      lastOccurrence: data.lastOccurrence
    }))
    .sort((a, b) => b.count - a.count);
  
  const totalErrors = errorsToUse.length;
  const errorRate = totalErrors / (timeWindowMs / 60000); // Errors per minute
  
  return {
    totalErrors,
    errorRate: Math.round(errorRate * 10) / 10,
    categories,
    timeSeries: [] // Time series would require more complex aggregation
  };
}

/**
 * Custom hook for managing Socket.io connection and real-time events
 */
export function useSocket(socketUrl: string): UseSocketReturn {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [connected, setConnected] = useState<boolean>(false);
  const [errors, setErrors] = useState<ErrorRecord[]>([]);
  const [stats, setStats] = useState<ErrorStatistics | null>(null);
  const [aiStreaming, setAiStreaming] = useState<Record<number, string>>({});
  const [spikes, setSpikes] = useState<SpikeAlert[]>([]);
  const [hiddenErrorIds, setHiddenErrorIds] = useState<Set<number>>(new Set());
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection with auth token
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: accessToken ? { token: accessToken } : undefined
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('✓ Connected to server');
      setConnected(true);
      // Request initial data
      socket.emit('request:initial_data', { timeWindow: 3600000 });
    });

    socket.on('disconnect', () => {
      console.log('✗ Disconnected from server');
      setConnected(false);
    });

    socket.on('connection:established', (data: { message: string; timestamp: number }) => {
      console.log('Connection established:', data.message);
    });

    // Initial data load
    socket.on('data:initial', ({ errors: initialErrors, stats: initialStats }: { errors: ErrorRecord[]; stats: any }) => {
      console.log(`Loaded ${initialErrors.length} initial errors`);
      setErrors(initialErrors);
      setStats(normalizeStats(initialStats));
    });

    // New error received
    socket.on('error:new', (error: ErrorRecord) => {
      setErrors(prev => [error, ...prev].slice(0, 500)); // Keep last 500
    });

    // AI streaming chunks
    socket.on('error:ai_stream', ({ errorId, chunk, fullText }: { errorId: number; chunk: string; fullText: string }) => {
      setAiStreaming(prev => ({
        ...prev,
        [errorId]: fullText
      }));
    });

    // AI analysis complete
    socket.on('error:ai_complete', ({ errorId, analysis, spike }: { errorId: number; analysis: { category: string; severity: string; hypothesis: string }; spike: SpikeAlert | null }) => {
      setErrors(prev => prev.map(err =>
        err.id === errorId
          ? {
              ...err,
              ai_category: analysis.category,
              ai_severity: analysis.severity,
              ai_hypothesis: analysis.hypothesis,
              ai_status: 'complete' as const
            }
          : err
      ));

      // Clear streaming state
      setAiStreaming(prev => {
        const next = { ...prev };
        delete next[errorId];
        return next;
      });

      if (spike) {
        setSpikes(prev => [spike, ...prev].slice(0, 10));
      }
    });

    // AI failed
    socket.on('error:ai_failed', ({ errorId, error }: { errorId: number; error: string }) => {
      console.error(`AI analysis failed for error ${errorId}:`, error);
      setErrors(prev => prev.map(err =>
        err.id === errorId ? { ...err, ai_status: 'failed' as const } : err
      ));
    });

    // Spike alerts
    socket.on('alert:spike', (spikeData: SpikeAlert) => {
      console.warn('🚨 Spike detected:', spikeData);
      setSpikes(prev => [spikeData, ...prev].slice(0, 10));
    });

    // Stats updates
    socket.on('data:stats_update', ({ stats: updatedStats }: { stats: any }) => {
      setStats(normalizeStats(updatedStats));
    });

    socket.on('data:stats', ({ stats: updatedStats }: { stats: any }) => {
      setStats(normalizeStats(updatedStats));
    });

    // Server errors
    socket.on('error:server', ({ message, error }: { message: string; error: string }) => {
      console.error('Server error:', message, error);
    });

    // Errors cleared
    socket.on('errors:cleared', () => {
      console.log('All errors cleared');
      setErrors([]);
      setStats(null);
      setAiStreaming({});
      setHiddenErrorIds(new Set());
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, [socketUrl, accessToken]);

  // Request stats update
  const requestStats = useCallback((timeWindow: number = 3600000) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('request:stats', { timeWindow });
    }
  }, []);

  // Clear a specific spike alert by index
  const clearSpike = useCallback((index: number) => {
    setSpikes(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Hide a specific error by ID
  const hideError = useCallback((id: number) => {
    setHiddenErrorIds(prev => new Set(prev).add(id));
  }, []);

  // Clear all errors
  const clearErrors = useCallback(async () => {
    try {
      const baseUrl = socketUrl.replace(/\/socket\.io\/?$/, '');
      const currentToken = useAuthStore.getState().accessToken;
      const response = await fetch(`${baseUrl}/api/errors`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {})
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to clear errors');
      }

      // Local state will be cleared when 'errors:cleared' event is received
      console.log('Errors cleared successfully');
    } catch (error) {
      console.error('Failed to clear errors:', error);
      throw error;
    }
  }, [socketUrl]);

  // Force reconnect
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.connect();
    }
  }, []);

  // Filter out hidden errors
  const visibleErrors = errors.filter(error => !hiddenErrorIds.has(error.id));

  return {
    connected,
    errors: visibleErrors,
    stats,
    aiStreaming,
    spikes,
    requestStats,
    clearSpike,
    clearErrors,
    hideError,
    reconnect
  };
}

export default useSocket;

