import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

/**
 * Custom hook for managing Socket.io connection and real-time events
 */
export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [errors, setErrors] = useState([]);
  const [stats, setStats] = useState(null);
  const [aiStreaming, setAiStreaming] = useState({});
  const [spikes, setSpikes] = useState([]);
  const socketRef = useRef(null);

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

    socket.on('connection:established', (data) => {
      console.log('Connection established:', data.message);
    });

    // Initial data load
    socket.on('data:initial', ({ errors: initialErrors, stats: initialStats }) => {
      console.log(`Loaded ${initialErrors.length} initial errors`);
      setErrors(initialErrors);
      setStats(initialStats);
    });

    // New error received
    socket.on('error:new', (error) => {
      setErrors(prev => [error, ...prev].slice(0, 500)); // Keep last 500
    });

    // AI streaming chunks
    socket.on('error:ai_stream', ({ errorId, chunk, fullText }) => {
      setAiStreaming(prev => ({
        ...prev,
        [errorId]: fullText
      }));
    });

    // AI analysis complete
    socket.on('error:ai_complete', ({ errorId, analysis, spike }) => {
      setErrors(prev => prev.map(err =>
        err.id === errorId
          ? {
              ...err,
              ai_category: analysis.category,
              ai_severity: analysis.severity,
              ai_hypothesis: analysis.hypothesis,
              ai_status: 'complete'
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
    socket.on('error:ai_failed', ({ errorId, error }) => {
      console.error(`AI analysis failed for error ${errorId}:`, error);
      setErrors(prev => prev.map(err =>
        err.id === errorId ? { ...err, ai_status: 'failed' } : err
      ));
    });

    // Spike alerts
    socket.on('alert:spike', (spikeData) => {
      console.warn('🚨 Spike detected:', spikeData);
      setSpikes(prev => [spikeData, ...prev].slice(0, 10));
    });

    // Stats updates
    socket.on('data:stats_update', ({ stats: updatedStats }) => {
      setStats(updatedStats);
    });

    socket.on('data:stats', ({ stats: updatedStats }) => {
      setStats(updatedStats);
    });

    // Server errors
    socket.on('error:server', ({ message, error }) => {
      console.error('Server error:', message, error);
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, []);

  // Request stats update
  const requestStats = useCallback((timeWindow = 3600000) => {
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
