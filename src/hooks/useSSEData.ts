// ============================================
// useSSEData Hook - Server-Sent Events für Echtzeit-Daten
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DashboardData } from '../types/dashboard.types';

interface UseSSEDataOptions {
  url?: string;
  autoConnect?: boolean;
}

interface UseSSEDataReturn {
  data: DashboardData;
  isConnected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
}

const initialData: DashboardData = {
  rpm: 0,
  gear: 'N',
  oilPressures: [0, 0, 0, 0],
  brakeMotors: {
    motor1: { torque: 0, kw: 0, load: 0 },
    motor2: { torque: 0, kw: 0, load: 0 },
  },
  temperature: 25,
  runtime: 0,
  cycles: 0,
  isConnected: false,
};

export function useSSEData(options: UseSSEDataOptions = {}): UseSSEDataReturn {
  const {
    url = 'http://localhost:3001/api/stream',
    autoConnect = true,
  } = options;

  const [data, setData] = useState<DashboardData>(initialData);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        console.log('[SSE] Connected to server');
      };

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          // Skip connection messages
          if (parsed.type === 'connected') {
            console.log('[SSE] Client ID:', parsed.clientId);
            return;
          }
          setData({ ...parsed, isConnected: true });
        } catch (e) {
          console.error('[SSE] Parse error:', e);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        setError('Connection lost');
        console.error('[SSE] Connection error');
        
        // Auto-reconnect after 3 seconds
        setTimeout(() => {
          if (eventSourceRef.current === eventSource) {
            connect();
          }
        }, 3000);
      };
    } catch (e) {
      setError('Failed to connect');
      console.error('[SSE] Failed to create EventSource:', e);
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    setData(initialData);
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    data,
    isConnected,
    error,
    connect,
    disconnect,
  };
}

export default useSSEData;




