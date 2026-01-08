// ============================================
// WebSocket Types für Prüfstand HMI
// ============================================

import type { GearCommand } from './gauge.types';

// ============================================
// Connection Status
// ============================================

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// ============================================
// WebSocket Configuration
// ============================================

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
}

export const DEFAULT_WEBSOCKET_CONFIG: WebSocketConfig = {
  url: 'ws://localhost:8080/ws',
  reconnectInterval: 1000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
  heartbeatTimeout: 5000,
};

// ============================================
// WebSocket Messages
// ============================================

export type WebSocketMessageType = 'data' | 'command' | 'status' | 'error' | 'ping' | 'pong';

export interface WebSocketMessage<T = unknown> {
  type: WebSocketMessageType;
  payload: T;
  timestamp: number;
  id?: string;
}

// ============================================
// Prüfstand-spezifische Nachrichten
// ============================================

export interface PruefstandDataMessage {
  rpm: number;
  gear: string;
  oilPressures: number[];
  motor1Torque: number;
  motor2Torque: number;
  temperature: number;
  runtime: number;
  cycles: number;
}

export interface PruefstandStatusMessage {
  isConnected: boolean;
  isEmergencyStop: boolean;
  errorCode?: number;
  errorMessage?: string;
}

export interface PruefstandCommandMessage {
  command: 'setGear' | 'setRPM' | 'emergencyStop' | 'reset' | 'startProgram' | 'stopProgram';
  payload: GearCommand | { rpm: number } | { programId: string } | null;
}

// ============================================
// Event Types für WebSocket Service
// ============================================

export type WebSocketEventType = 
  | 'open' 
  | 'close' 
  | 'error' 
  | 'message' 
  | 'data' 
  | 'status' 
  | 'reconnect';

export interface WebSocketEvent<T = unknown> {
  type: WebSocketEventType;
  data?: T;
  error?: Error;
  timestamp: Date;
}

export type WebSocketEventCallback<T = unknown> = (event: WebSocketEvent<T>) => void;

// ============================================
// WebSocket Service Interface
// ============================================

export interface IWebSocketService {
  connect(config?: Partial<WebSocketConfig>): void;
  disconnect(): void;
  send<T>(message: WebSocketMessage<T>): boolean;
  getStatus(): ConnectionStatus;
  on<T>(event: WebSocketEventType, callback: WebSocketEventCallback<T>): () => void;
  off(event: WebSocketEventType, callback: WebSocketEventCallback): void;
}




