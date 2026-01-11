// ============================================
// useWebSocket Hook - WebSocket-Kommunikation
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { webSocketService } from '../services/WebSocketService';
import type { DashboardData } from '../types/dashboard.types';
import type { GearCommand, GearPosition } from '../types/gauge.types';
import type {
  ConnectionStatus,
  WebSocketConfig,
  PruefstandDataMessage,
  DEFAULT_WEBSOCKET_CONFIG,
} from '../types/websocket.types';

interface UseWebSocketOptions {
  config?: Partial<WebSocketConfig>;
  autoConnect?: boolean;
  onData?: (data: DashboardData) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
}

interface UseWebSocketReturn {
  data: DashboardData | null;
  status: ConnectionStatus;
  error: string | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  sendCommand: (command: GearCommand) => void;
  setGear: (gear: GearPosition) => void;
  setRPM: (rpm: number) => void;
  emergencyStop: () => void;
  reset: () => void;
}

// Konvertiert Prüfstand-Daten zu DashboardData
function convertToDashboardData(message: PruefstandDataMessage): DashboardData {
  return {
    rpm: message.rpm,
    gear: message.gear as GearPosition,
    oilPressures: message.oilPressures,
    brakeMotors: {
      motor1: {
        torque: message.motor1Torque,
        kw: (message.motor1Torque * 1450) / 9549, // P = (M × n) / 9549
        load: (message.motor1Torque / 1500) * 100,
      },
      motor2: {
        torque: message.motor2Torque,
        kw: (message.motor2Torque * 1450) / 9549,
        load: (message.motor2Torque / 1500) * 100,
      },
    },
    temperature: 0, // Wird vom Server nicht gesendet, default
    runtime: message.runtime,
    cycles: message.cycles,
    isConnected: true,
  };
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    config,
    autoConnect = false,
    onData,
    onError,
    onStatusChange,
  } = options;

  const [data, setData] = useState<DashboardData | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  
  // Refs für Callbacks, um stale closures zu vermeiden
  const onDataRef = useRef(onData);
  const onErrorRef = useRef(onError);
  const onStatusChangeRef = useRef(onStatusChange);

  // Update refs wenn sich callbacks ändern
  useEffect(() => {
    onDataRef.current = onData;
    onErrorRef.current = onError;
    onStatusChangeRef.current = onStatusChange;
  }, [onData, onError, onStatusChange]);

  // Verbindung herstellen
  const connect = useCallback(() => {
    setError(null);
    webSocketService.connect(config);
  }, [config]);

  // Verbindung trennen
  const disconnect = useCallback(() => {
    webSocketService.disconnect();
  }, []);

  // Befehl senden
  const sendCommand = useCallback((command: GearCommand) => {
    const success = webSocketService.send({
      type: 'command',
      payload: {
        command: 'setGear',
        payload: command,
      },
      timestamp: Date.now(),
    });

    if (!success) {
      setError('Befehl konnte nicht gesendet werden');
    }
  }, []);

  // Gang setzen
  const setGear = useCallback((gear: GearPosition) => {
    sendCommand({ gear });
  }, [sendCommand]);

  // RPM setzen
  const setRPM = useCallback((rpm: number) => {
    webSocketService.send({
      type: 'command',
      payload: {
        command: 'setRPM',
        payload: { rpm },
      },
      timestamp: Date.now(),
    });
  }, []);

  // Not-Aus
  const emergencyStop = useCallback(() => {
    webSocketService.send({
      type: 'command',
      payload: {
        command: 'emergencyStop',
        payload: null,
      },
      timestamp: Date.now(),
    });
  }, []);

  // Reset
  const reset = useCallback(() => {
    webSocketService.send({
      type: 'command',
      payload: {
        command: 'reset',
        payload: null,
      },
      timestamp: Date.now(),
    });
  }, []);

  // Event-Listener Setup
  useEffect(() => {
    // Status-Updates
    const unsubOpen = webSocketService.on('open', () => {
      setStatus('connected');
      setError(null);
      onStatusChangeRef.current?.('connected');
    });

    const unsubClose = webSocketService.on('close', () => {
      setStatus('disconnected');
      onStatusChangeRef.current?.('disconnected');
    });

    const unsubError = webSocketService.on<Error>('error', (event) => {
      setStatus('error');
      const errorMessage = event.error?.message || 'Verbindungsfehler';
      setError(errorMessage);
      onErrorRef.current?.(errorMessage);
      onStatusChangeRef.current?.('error');
    });

    const unsubReconnect = webSocketService.on('reconnect', () => {
      setStatus('connecting');
      onStatusChangeRef.current?.('connecting');
    });

    // Daten-Updates
    const unsubData = webSocketService.on<PruefstandDataMessage>('data', (event) => {
      if (event.data) {
        const dashboardData = convertToDashboardData(event.data);
        setData(dashboardData);
        onDataRef.current?.(dashboardData);
      }
    });

    // Auto-Connect wenn aktiviert
    if (autoConnect) {
      connect();
    }

    // Cleanup
    return () => {
      unsubOpen();
      unsubClose();
      unsubError();
      unsubReconnect();
      unsubData();
    };
  }, [autoConnect, connect]);

  return {
    data,
    status,
    error,
    isConnected: status === 'connected',
    connect,
    disconnect,
    sendCommand,
    setGear,
    setRPM,
    emergencyStop,
    reset,
  };
}

export default useWebSocket;





