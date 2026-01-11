// ============================================
// Gauge Components Export
// Basierend auf Main_Doku.json Telemetrie-Struktur
// ============================================

export { default as BaseGauge } from './BaseGauge';
export { default as RPMGauge } from './RPMGauge';
export { default as OilPressureGauge } from './OilPressureGauge';
export { default as BrakeMotorGauge } from './BrakeMotorGauge';
export { default as OilTemperatureGauge } from './OilTemperatureGauge';
export { default as FlowRateGauge } from './FlowRateGauge';
export { default as PlaceholderGauge } from './PlaceholderGauge';
export { default as GaugeGrid } from './GaugeGrid';

// Neue Komponenten für Main_Doku.json
export { default as DrehzahlKGauge } from './DrehzahlKGauge';
export { default as AuslastungGauge } from './AuslastungGauge';
export { default as Gauge } from './Gauge';
export { default as BremseBalken } from './BremseBalken';
export * from './GaugeConfig';

export type { GaugeProps, GaugeSize, GaugeStatus } from '../../types/dashboard.types';
