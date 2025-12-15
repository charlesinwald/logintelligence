import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

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
  clearSpikes: () => void;
  clearErrors: () => void;
}

/**
 * Custom hook for managing Socket.io connection and real-time events
 */
export function useSocket(): UseSocketReturn {
  const [connected, setConnected] = useState<boolean>(false);
  const [errors, setErrors] = useState<ErrorRecord[]>([]);
  const [stats, setStats] = useState<ErrorStatistics | null>(null);
  const [aiStreaming, setAiStreaming] = useState<Record<number, string>>({});
  const [spikes, setSpikes] = useState<SpikeAlert[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
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
    socket.on('data:initial', ({ errors: initialErrors, stats: initialStats }: { errors: ErrorRecord[]; stats: ErrorStatistics }) => {
      console.log(`Loaded ${initialErrors.length} initial errors`);
      setErrors(initialErrors);
      setStats(initialStats);
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
    socket.on('data:stats_update', ({ stats: updatedStats }: { stats: ErrorStatistics }) => {
      setStats(updatedStats);
    });

    socket.on('data:stats', ({ stats: updatedStats }: { stats: ErrorStatistics }) => {
      setStats(updatedStats);
    });

    // Server errors
    socket.on('error:server', ({ message, error }: { message: string; error: string }) => {
      console.error('Server error:', message, error);
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, []);

  // Request stats update
  const requestStats = useCallback((timeWindow: number = 3600000) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('request:stats', { timeWindow });
    }
  }, []);

  // Clear spike alerts
  const clearSpikes = useCallback(() => {
    setSpikes([]);
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return {
    connected,
    errors,
    stats,
    aiStreaming,
    spikes,
    requestStats,
    clearSpikes,
    clearErrors
  };
}

export default useSocket;

