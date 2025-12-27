// ============================================
// Server Types für Prüfstand Backend
// ============================================

export type GearPosition = 'R' | 'N' | '1' | '2' | '3' | '4' | '5' | '6' | '7';

export interface DashboardData {
  rpm: number;
  gear: GearPosition;
  oilPressures: number[];
  brakeMotors: {
    motor1: { torque: number; kw: number; load: number };
    motor2: { torque: number; kw: number; load: number };
  };
  temperature: number;
  runtime: number;
  cycles: number;
  isConnected: boolean;
}

export type MockDataMode = 'random' | 'realistic';

export type RealisticPhase = 'idle' | 'warmup' | 'running' | 'stress' | 'cooldown';

export interface SSEClient {
  id: string;
  response: import('express').Response;
  connectedAt: Date;
}

export interface ServerConfig {
  port: number;
  corsOrigin: string;
  updateInterval: number;
}

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
} as const;

