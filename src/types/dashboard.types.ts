// ============================================
// Dashboard Types für Prüfstand HMI
// ============================================

// Gauge Types
export type GaugeSize = 'small' | 'medium' | 'large';
export type GaugeStatus = 'normal' | 'warning' | 'danger';

export interface GaugeProps {
  value: number;
  maxValue: number;
  minValue?: number;
  warningThreshold?: number;
  dangerThreshold?: number;
  unit: string;
  label: string;
  size: GaugeSize;
  accentColor: string;
  warningColor?: string;
  dangerColor?: string;
  id?: string;
}

export interface GaugeState {
  currentValue: number;
  status: GaugeStatus;
  isAnimating: boolean;
}

// RPM Gauge spezifisch
export interface RPMGaugeProps extends Omit<GaugeProps, 'maxValue' | 'unit'> {
  redlineRPM?: number;
  gear?: GearPosition;
}

// Öldruck Gauge
export interface OilPressureGaugeProps extends Omit<GaugeProps, 'maxValue' | 'unit'> {
  sensorId: number; // 1-4
}

// Bremsmotor Gauge
export interface BrakeMotorGaugeProps extends Omit<GaugeProps, 'maxValue' | 'unit'> {
  motorId: 1 | 2;
  rpm?: number;
}

// Platzhalter Gauge
export interface PlaceholderGaugeProps {
  label: string;
  size: GaugeSize;
  id?: string;
}

// ============================================
// Gear / Gang Types
// ============================================

export type GearPosition = 'R' | 'N' | '1' | '2' | '3' | '4' | '5' | '6' | '7';

export interface GearPanelState {
  selectedGear: GearPosition;
  manualRPM: number;
  autoMode: boolean;
  autoModeSpeed: 'slow' | 'normal' | 'fast';
  isRunning: boolean;
}

export interface GearCommand {
  gear: GearPosition;
  targetRPM?: number;
}

// ============================================
// Status Log Types
// ============================================

export type LogType = 'info' | 'success' | 'warning' | 'error';

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: LogType;
  message: string;
}

// ============================================
// Menu Types
// ============================================

export type MenuPanel = 
  | 'none' 
  | 'gear' 
  | 'program' 
  | 'sensors' 
  | 'regelung' 
  | 'config' 
  | 'dsg';

export interface MenuItem {
  id: MenuPanel;
  label: string;
  icon: string;
  subtitle?: string;
}

// ============================================
// Program Types
// ============================================

export type ProgramStatus = 'ready' | 'running' | 'paused' | 'completed' | 'error';

export interface TestProgram {
  id: string;
  name: string;
  icon: string;
  status: ProgramStatus;
  progress?: number;
  description?: string;
}

// ============================================
// Sensor Types
// ============================================

export interface SensorReading {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: GaugeStatus;
  timestamp: Date;
}

export interface SensorConfig {
  id: string;
  name: string;
  minValue: number;
  maxValue: number;
  warningThreshold: number;
  dangerThreshold: number;
  unit: string;
}

// ============================================
// Dashboard State
// ============================================

export interface DashboardData {
  rpm: number;
  gear: GearPosition;
  oilPressures: number[]; // 4 Werte für 4 Sensoren
  oilTemperature: number; // Öltemperatur in °C
  flowRate: number; // Durchfluss in L/min
  brakeMotors: {
    motor1: { torque: number; kw: number; load: number };
    motor2: { torque: number; kw: number; load: number };
  };
  temperature: number;
  runtime: number; // Sekunden
  cycles: number;
  isConnected: boolean;
}

export interface DashboardState {
  data: DashboardData;
  activePanel: MenuPanel;
  isCompactMode: boolean;
  logs: LogEntry[];
  mockMode: 'random' | 'realistic';
  isEmergencyStop: boolean;
}

// ============================================
// Mock Data Types
// ============================================

export type MockDataMode = 'random' | 'realistic';

export interface MockDataConfig {
  mode: MockDataMode;
  updateInterval: number; // ms
  realisticCyclePhase?: 'idle' | 'warmup' | 'running' | 'stress' | 'cooldown';
}

// ============================================
// Tauri Command Types (für Rust Backend)
// ============================================

export interface TauriSensorData {
  rpm: number;
  gear: string;
  oil_pressures: number[];
  motor1_torque: number;
  motor2_torque: number;
  temperature: number;
  is_connected: boolean;
}

export interface TauriCommandResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// Event Types
// ============================================

export interface GaugeUpdateEvent {
  gaugeId: string;
  value: number;
  timestamp: number;
}

export interface SystemEvent {
  type: 'connection' | 'error' | 'warning' | 'status';
  message: string;
  timestamp: Date;
  data?: unknown;
}

// ============================================
// Constants
// ============================================

export const GAUGE_CONSTANTS = {
  RPM: {
    MAX: 12000,
    REDLINE: 8000,
    IDLE: 800,
  },
  OIL_PRESSURE: {
    MAX: 20,
    WARNING: 12,
    DANGER: 15,
  },
  BRAKE_MOTOR: {
    MAX_TORQUE: 1500,
    WARNING_PERCENT: 70,
    DANGER_PERCENT: 85,
    MOTOR_RPM: 1450,
  },
  OIL_TEMPERATURE: {
    MIN: 0,
    MAX: 150,
    COLD: 40,      // Unter 40°C gilt als kalt
    OPTIMAL: 80,   // Optimale Betriebstemperatur
    WARNING: 100,  // Ab 100°C Warnung
    DANGER: 120,   // Ab 120°C kritisch
  },
  FLOW_RATE: {
    MAX: 50,
    LOW: 5,        // Unter 5 L/min ist zu niedrig
    OPTIMAL: 20,   // Optimaler Durchfluss
    WARNING: 40,   // Ab 40 L/min Warnung
    DANGER: 45,    // Ab 45 L/min kritisch
  },
} as const;

export const COLORS = {
  // Accent Colors
  CYAN: '#00bcd4',
  BLUE: '#00d4ff',
  GREEN: '#00e676',
  PURPLE: '#ab47bc',
  ORANGE: '#ff9800',
  RED: '#ff3b5c',
  AMBER: '#ffab00',
  YELLOW: '#ffeb3b',
  
  // Background Colors
  BG_DARK: '#0a0a0f',
  BG_PANEL: '#0d0d14',
  GLASS_BG: 'rgba(255, 255, 255, 0.03)',
  GLASS_BORDER: 'rgba(255, 255, 255, 0.08)',
  
  // Text Colors
  TEXT_PRIMARY: '#ffffff',
  TEXT_SECONDARY: 'rgba(255, 255, 255, 0.5)',
  TEXT_DIM: 'rgba(255, 255, 255, 0.25)',
} as const;
