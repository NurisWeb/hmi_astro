// ============================================
// Types Export für Prüfstand HMI
// ============================================

// Dashboard Types
export type {
  LogType,
  LogEntry,
  SensorReading,
  SensorConfig,
  DashboardData,
  DashboardState,
  MockDataMode,
  MockDataConfig,
  TauriSensorData,
  TauriCommandResult,
  GaugeUpdateEvent,
  SystemEvent,
} from './dashboard.types';

export { GAUGE_CONSTANTS, COLORS } from './dashboard.types';

// Gauge Types
export type {
  GaugeSize,
  GaugeStatus,
  GaugeProps,
  GaugeState,
  RPMGaugeProps,
  OilPressureGaugeProps,
  BrakeMotorGaugeProps,
  PlaceholderGaugeProps,
  GearPosition,
  GearPanelState,
  GearCommand,
} from './gauge.types';

// Menu Types
export type {
  MenuPanel,
  MenuItem,
  ProgramStatus,
  TestProgram,
} from './menu.types';

// WebSocket Types
export type {
  ConnectionStatus,
  WebSocketConfig,
  WebSocketMessageType,
  WebSocketMessage,
  PruefstandDataMessage,
  PruefstandStatusMessage,
  PruefstandCommandMessage,
  WebSocketEventType,
  WebSocketEvent,
  WebSocketEventCallback,
  IWebSocketService,
} from './websocket.types';

export { DEFAULT_WEBSOCKET_CONFIG } from './websocket.types';

