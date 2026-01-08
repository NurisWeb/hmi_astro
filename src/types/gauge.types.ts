// ============================================
// Gauge Types für Prüfstand HMI
// ============================================

// ============================================
// Base Gauge Types
// ============================================

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

// ============================================
// RPM Gauge spezifisch
// ============================================

export interface RPMGaugeProps extends Omit<GaugeProps, 'maxValue' | 'unit'> {
  redlineRPM?: number;
  gear?: GearPosition;
}

// ============================================
// Öldruck Gauge
// ============================================

export interface OilPressureGaugeProps extends Omit<GaugeProps, 'maxValue' | 'unit'> {
  sensorId: number; // 1-4
}

// ============================================
// Bremsmotor Gauge
// ============================================

export interface BrakeMotorGaugeProps extends Omit<GaugeProps, 'maxValue' | 'unit'> {
  motorId: 1 | 2;
  rpm?: number;
}

// ============================================
// Platzhalter Gauge
// ============================================

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




