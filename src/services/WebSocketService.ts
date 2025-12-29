// ============================================
// WebSocket Service für Prüfstand Dashboard
// Vollständige Implementierung mit Reconnection
// ============================================

import type {
  ConnectionStatus,
  WebSocketConfig,
  WebSocketMessage,
  WebSocketEventType,
  WebSocketEvent,
  WebSocketEventCallback,
  IWebSocketService,
} from '../types/websocket.types';
import { DEFAULT_WEBSOCKET_CONFIG } from '../types/websocket.types';

class WebSocketService implements IWebSocketService {
  private socket: WebSocket | null = null;
  private config: WebSocketConfig = DEFAULT_WEBSOCKET_CONFIG;
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastPongTime = 0;
  private messageQueue: WebSocketMessage[] = [];

  // Event-Listener Map
  private listeners: Map<WebSocketEventType, Set<WebSocketEventCallback>> = new Map();

  constructor() {
    // Initialisiere Event-Listener Maps
    const eventTypes: WebSocketEventType[] = [
      'open', 'close', 'error', 'message', 'data', 'status', 'reconnect'
    ];
    eventTypes.forEach(type => {
      this.listeners.set(type, new Set());
    });
  }

  // ============================================
  // Verbindungsmanagement
  // ============================================

  connect(customConfig?: Partial<WebSocketConfig>): void {
    // Merge mit Default-Config
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }

    // Bereits verbunden?
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.warn('[WebSocketService] Bereits verbunden');
      return;
    }

    // Alte Verbindung schließen
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.setStatus('connecting');
    
    try {
      this.socket = new WebSocket(this.config.url);
      this.setupSocketListeners();
    } catch (error) {
      console.error('[WebSocketService] Verbindungsfehler:', error);
      this.setStatus('error');
      this.emit('error', { 
        type: 'error', 
        error: error instanceof Error ? error : new Error(String(error)),
        timestamp: new Date() 
      });
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.clearReconnectTimeout();
    this.stopHeartbeat();
    
    if (this.socket) {
      // Verhindere automatisches Reconnect beim manuellen Disconnect
      this.reconnectAttempts = this.config.maxReconnectAttempts;
      this.socket.close(1000, 'Client disconnect');
      this.socket = null;
    }
    
    this.setStatus('disconnected');
    this.reconnectAttempts = 0;
  }

  // ============================================
  // Nachrichten senden
  // ============================================

  send<T>(message: WebSocketMessage<T>): boolean {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocketService] Socket nicht bereit, Nachricht wird in Queue gespeichert');
      this.messageQueue.push(message as WebSocketMessage);
      return false;
    }

    try {
      const messageStr = JSON.stringify(message);
      this.socket.send(messageStr);
      return true;
    } catch (error) {
      console.error('[WebSocketService] Sendefehler:', error);
      return false;
    }
  }

  // ============================================
  // Event-System
  // ============================================

  on<T>(event: WebSocketEventType, callback: WebSocketEventCallback<T>): () => void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.add(callback as WebSocketEventCallback);
    }

    // Unsubscribe-Funktion zurückgeben
    return () => {
      this.off(event, callback as WebSocketEventCallback);
    };
  }

  off(event: WebSocketEventType, callback: WebSocketEventCallback): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private emit<T>(event: WebSocketEventType, data: WebSocketEvent<T>): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[WebSocketService] Listener-Fehler für Event "${event}":`, error);
        }
      });
    }
  }

  // ============================================
  // Status-Management
  // ============================================

  getStatus(): ConnectionStatus {
    return this.status;
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.emit('status', { 
        type: 'status', 
        data: status,
        timestamp: new Date() 
      });
    }
  }

  // ============================================
  // Socket Event-Listener Setup
  // ============================================

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('[WebSocketService] Verbindung hergestellt');
      this.setStatus('connected');
      this.reconnectAttempts = 0;
      
      // Starte Heartbeat
      this.startHeartbeat();
      
      // Sende gepufferte Nachrichten
      this.flushMessageQueue();
      
      this.emit('open', { type: 'open', timestamp: new Date() });
    };

    this.socket.onclose = (event) => {
      console.log(`[WebSocketService] Verbindung geschlossen: ${event.code} - ${event.reason}`);
      this.stopHeartbeat();
      
      const wasConnected = this.status === 'connected';
      this.setStatus('disconnected');
      
      this.emit('close', { 
        type: 'close', 
        data: { code: event.code, reason: event.reason },
        timestamp: new Date() 
      });
      
      // Nur reconnecten wenn es keine absichtliche Trennung war
      if (wasConnected && event.code !== 1000) {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = (event) => {
      console.error('[WebSocketService] Socket-Fehler:', event);
      this.setStatus('error');
      this.emit('error', { 
        type: 'error', 
        error: new Error('WebSocket error'),
        timestamp: new Date() 
      });
    };

    this.socket.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }

  // ============================================
  // Nachrichten-Verarbeitung
  // ============================================

  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      
      // Allgemeines Message-Event
      this.emit('message', { 
        type: 'message', 
        data: message,
        timestamp: new Date() 
      });

      // Spezifische Verarbeitung nach Nachrichtentyp
      switch (message.type) {
        case 'pong':
          this.handlePong();
          break;
          
        case 'data':
          this.emit('data', { 
            type: 'data', 
            data: message.payload,
            timestamp: new Date() 
          });
          break;
          
        case 'status':
          this.emit('status', { 
            type: 'status', 
            data: message.payload,
            timestamp: new Date() 
          });
          break;
          
        case 'error':
          this.emit('error', { 
            type: 'error', 
            error: new Error(String(message.payload)),
            timestamp: new Date() 
          });
          break;
          
        default:
          // Unbekannter Typ, trotzdem als data weiterleiten
          this.emit('data', { 
            type: 'data', 
            data: message.payload,
            timestamp: new Date() 
          });
      }
    } catch (error) {
      console.error('[WebSocketService] Fehler beim Parsen der Nachricht:', error);
    }
  }

  // ============================================
  // Heartbeat / Keep-Alive
  // ============================================

  private startHeartbeat(): void {
    if (!this.config.heartbeatInterval) return;
    
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      this.sendPing();
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  private sendPing(): void {
    if (this.socket?.readyState !== WebSocket.OPEN) return;

    const pingMessage: WebSocketMessage = {
      type: 'ping',
      payload: null,
      timestamp: Date.now(),
    };

    try {
      this.socket.send(JSON.stringify(pingMessage));
      
      // Timeout für Pong-Antwort setzen
      if (this.config.heartbeatTimeout) {
        this.heartbeatTimeout = setTimeout(() => {
          console.warn('[WebSocketService] Heartbeat-Timeout, Verbindung wird neu aufgebaut');
          this.socket?.close(4000, 'Heartbeat timeout');
        }, this.config.heartbeatTimeout);
      }
    } catch (error) {
      console.error('[WebSocketService] Ping-Fehler:', error);
    }
  }

  private handlePong(): void {
    this.lastPongTime = Date.now();
    
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  // ============================================
  // Reconnection mit Exponential Backoff
  // ============================================

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('[WebSocketService] Maximale Reconnect-Versuche erreicht');
      this.setStatus('error');
      return;
    }

    this.clearReconnectTimeout();
    
    // Exponential Backoff: 1s, 2s, 4s, 8s, ... max 30s
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts),
      30000
    );
    
    console.log(`[WebSocketService] Reconnect in ${delay}ms (Versuch ${this.reconnectAttempts + 1}/${this.config.maxReconnectAttempts})`);
    
    this.reconnectAttempts++;
    
    this.emit('reconnect', { 
      type: 'reconnect', 
      data: { attempt: this.reconnectAttempts, delay },
      timestamp: new Date() 
    });

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  // ============================================
  // Message Queue
  // ============================================

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  // ============================================
  // Utilities
  // ============================================

  isConnected(): boolean {
    return this.status === 'connected' && this.socket?.readyState === WebSocket.OPEN;
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  getConfig(): WebSocketConfig {
    return { ...this.config };
  }
}

// Singleton Export
export const webSocketService = new WebSocketService();
export default WebSocketService;


