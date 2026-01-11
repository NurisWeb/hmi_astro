// ============================================
// GaugeConfig - Alle Gauge-Bereiche aus Main_Doku.json
// ============================================

// Bereich-Definition
export interface GaugeBereich {
  min: number;
  max: number;
  green: [number, number];
  orange: [number, number];
  red: [number, number];
}

// === BEREICHE AUS MAIN_DOKU.JSON ===

// Drehzahl Eingangsmotor: 0-3530
export const EINGANGSMOTOR: GaugeBereich = {
  min: 0,
  max: 3530,
  green: [0, 2000],
  orange: [2000, 3000],
  red: [3000, 3530],
};

// K1/K2/Ausgleich Drehzahl: 0-1000
export const DREHZAHL_K: GaugeBereich = {
  min: 0,
  max: 1000,
  green: [0, 400],
  orange: [400, 800],
  red: [800, 1000],
};

// Bremsen KWB1/KWB2: 0-6 KW
export const BREMSEN_KW: GaugeBereich = {
  min: 0,
  max: 6,
  green: [0, 2],
  orange: [2, 4],
  red: [4, 6],
};

// Öldrücke: 0-60 bar
export const OELDRUCK: GaugeBereich = {
  min: 0,
  max: 60,
  green: [0, 35],
  orange: [35, 50],
  red: [50, 60],
};

// Temperaturen: 0-110 °C
export const TEMPERATUR: GaugeBereich = {
  min: 0,
  max: 110,
  green: [0, 70],
  orange: [70, 90],
  red: [90, 110],
};

// Prüfstand Auslastung: 0-100 %
export const AUSLASTUNG: GaugeBereich = {
  min: 0,
  max: 100,
  green: [0, 60],
  orange: [60, 80],
  red: [80, 100],
};

// === FARBEN ===

export const GAUGE_COLORS = {
  green: '#4CAF50',
  greenDim: 'rgba(76, 175, 80, 0.3)',
  orange: '#FF9800',
  orangeDim: 'rgba(255, 152, 0, 0.3)',
  red: '#F44336',
  redDim: 'rgba(244, 67, 54, 0.3)',
  cyan: '#00BCD4',
  purple: '#9C27B0',
};

// === HELPER FUNKTION ===

export const getZoneColor = (
  wert: number, 
  bereich: GaugeBereich
): 'green' | 'orange' | 'red' => {
  if (wert >= bereich.red[0]) return 'red';
  if (wert >= bereich.orange[0]) return 'orange';
  return 'green';
};

export const getZoneColorHex = (
  wert: number, 
  bereich: GaugeBereich
): string => {
  const zone = getZoneColor(wert, bereich);
  return GAUGE_COLORS[zone];
};

// === ÜBERSICHT (für Dokumentation) ===
/*
  Parameter          | Min-Max   | Grün      | Orange    | Rot
  -------------------|-----------|-----------|-----------|------------
  Eingangsmotor      | 0-3530    | 0-2000    | 2000-3000 | 3000-3530
  K1/K2/Ausgleich    | 0-1000    | 0-400     | 400-800   | 800-1000
  Bremsen (KW)       | 0-6       | 0-2       | 2-4       | 4-6
  Öldrücke (bar)     | 0-60      | 0-35      | 35-50     | 50-60
  Temperaturen (°C)  | 0-110     | 0-70      | 70-90     | 90-110
  Auslastung (%)     | 0-100     | 0-60      | 60-80     | 80-100
*/
