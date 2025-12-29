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
// DSG-Getriebe Types (7-Gang Doppelkupplung)
// ============================================

export type ShiftPhase = 'idle' | 'preselect' | 'overlap' | 'complete';

export interface ClutchState {
  engagement: number;      // 0-100% Kupplungseingriff
  pressure: number;        // bar - Kupplungsdruck
  temperature: number;     // °C - Kupplungstemperatur
  gears: GearPosition[];   // Welche Gänge auf dieser Kupplung liegen
  isActive: boolean;       // Ist diese Kupplung gerade aktiv/geschlossen
}

export interface DSGState {
  activeGear: GearPosition;           // Aktuell eingelegter Gang
  preselectedGear: GearPosition | null; // Vorgewählter Gang
  clutch1: ClutchState;               // K1: Gänge 1, 3, 5, 7 (ungerade)
  clutch2: ClutchState;               // K2: Gänge R, 2, 4, 6 (gerade + Rückwärts)
  shiftPhase: ShiftPhase;             // Aktuelle Schaltphase
  shiftTimeMs: number;                // Letzte Schaltzeit in ms
  isShifting: boolean;                // Gerade im Schaltvorgang
  targetRPM: number;                  // Ziel-Drehzahl
  load: number;                       // Last/Gasstellung 0-100%
}

// Gang-Übersetzungsverhältnisse für 7-Gang DSG
export interface GearRatio {
  gear: GearPosition;
  ratio: number;           // Übersetzungsverhältnis
  maxRPM: number;          // Max RPM bei Volllast
  clutch: 1 | 2;           // Welche Kupplung
}

// DSG-Konfiguration
export interface DSGConfig {
  gearRatios: GearRatio[];
  shiftTimeMs: number;     // Standard-Schaltzeit
  overlapTimeMs: number;   // Überschneidungszeit beim Schalten
  clutch1Gears: GearPosition[];
  clutch2Gears: GearPosition[];
}

// Erweiterte Dashboard-Daten mit DSG-Status
export interface DashboardDataWithDSG extends DashboardData {
  dsg: DSGState;
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

// ============================================
// DSG-Getriebe Konstanten (7-Gang DSG)
// ============================================

export const DSG_CONSTANTS = {
  // Gang-Übersetzungen (typisch für 7-Gang DSG wie DQ381)
  GEAR_RATIOS: [
    { gear: 'R' as GearPosition, ratio: 3.99, maxRPM: 4000, clutch: 2 as const },
    { gear: '1' as GearPosition, ratio: 3.46, maxRPM: 7500, clutch: 1 as const },
    { gear: '2' as GearPosition, ratio: 2.05, maxRPM: 7200, clutch: 2 as const },
    { gear: '3' as GearPosition, ratio: 1.30, maxRPM: 7000, clutch: 1 as const },
    { gear: '4' as GearPosition, ratio: 0.90, maxRPM: 6800, clutch: 2 as const },
    { gear: '5' as GearPosition, ratio: 0.76, maxRPM: 6500, clutch: 1 as const },
    { gear: '6' as GearPosition, ratio: 0.65, maxRPM: 6200, clutch: 2 as const },
    { gear: '7' as GearPosition, ratio: 0.54, maxRPM: 6000, clutch: 1 as const },
  ],
  
  // Kupplungszuordnung
  CLUTCH1_GEARS: ['1', '3', '5', '7'] as GearPosition[],  // Ungerade Gänge
  CLUTCH2_GEARS: ['R', '2', '4', '6'] as GearPosition[],  // Gerade + Rückwärts
  
  // Schaltzeiten
  SHIFT_TIME_MS: 200,        // Typische Schaltzeit
  OVERLAP_TIME_MS: 50,       // Kupplungsüberschneidung
  PRESELECT_TIME_MS: 100,    // Zeit für Gangvorwahl
  
  // Kupplungsparameter
  CLUTCH: {
    MAX_PRESSURE: 25,        // bar
    OPERATING_PRESSURE: 18,  // bar im Normalbetrieb
    MAX_TEMP: 200,           // °C
    WARNING_TEMP: 150,       // °C
    ENGAGEMENT_RATE: 5,      // % pro Update-Tick
  },
  
  // Vorwahl-Logik: Welcher Gang wird bei welchem aktiven Gang vorgewählt
  PRESELECT_MAP: {
    'N': '1',   // Bei Neutral: 1. Gang vorwählen
    '1': '2',   // Bei 1. Gang: 2. Gang vorwählen
    '2': '3',
    '3': '4',
    '4': '5',
    '5': '6',
    '6': '7',
    '7': '6',   // Im 7. Gang: 6. Gang vorwählen (Rückschaltung)
    'R': '1',   // Bei Rückwärts: 1. Gang vorwählen
  } as Record<GearPosition, GearPosition>,
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
