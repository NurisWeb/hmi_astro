// mockBackend/data/telemetrieData.ts
// Parameter-Definitionen EXAKT aus Main_Doku.json

import type { TelemetrieResponse } from '../types';

// === PARAMETER CONFIG ===
export interface ParameterConfig {
  id: string;
  name: string;
  unit: string;
  min: number;
  max: number;
  green: [number, number];
  orange: [number, number];
  red: [number, number];
  priority: 'high' | 'low';
}

// === ÖLDRÜCKE (p) ===
// Bereich: 0-60 bar (grün 0-35, orange 35-50, rot 50-60)
export const oeldruckParams: ParameterConfig[] = [
  {
    id: 'k1_oeldruck',
    name: 'K1 Öldruck',
    unit: 'bar',
    min: 0, max: 60,
    green: [0, 35], orange: [35, 50], red: [50, 60],
    priority: 'high'
  },
  {
    id: 'k2_oeldruck',
    name: 'K2 Öldruck',
    unit: 'bar',
    min: 0, max: 60,
    green: [0, 35], orange: [35, 50], red: [50, 60],
    priority: 'high'
  },
  {
    id: 'system_oeldruck',
    name: 'System Öldruck',
    unit: 'bar',
    min: 0, max: 60,
    green: [0, 35], orange: [35, 50], red: [50, 60],
    priority: 'high'
  },
  {
    id: 'ediff_oeldruck',
    name: 'EDiff Öldruck',
    unit: 'bar',
    min: 0, max: 60,
    green: [0, 35], orange: [35, 50], red: [50, 60],
    priority: 'high'
  },
];

// === DREHZAHLEN (r) ===
// Bereich: 0-1000 (grün 0-400, orange 400-800, rot 800-1000)
export const drehzahlParams: ParameterConfig[] = [
  {
    id: 'drehzahl_k1',
    name: 'Drehzahl K1',
    unit: 'U/min',
    min: 0, max: 1000,
    green: [0, 400], orange: [400, 800], red: [800, 1000],
    priority: 'high'
  },
  {
    id: 'drehzahl_k2',
    name: 'Drehzahl K2',
    unit: 'U/min',
    min: 0, max: 1000,
    green: [0, 400], orange: [400, 800], red: [800, 1000],
    priority: 'high'
  },
  {
    id: 'drehzahl_ausgleich',
    name: 'Drehzahl Ausgleich',
    unit: 'U/min',
    min: 0, max: 1000,
    green: [0, 400], orange: [400, 800], red: [800, 1000],
    priority: 'high'
  },
];

// === MOTOR (m) ===
// Antriebmotor: 0-3530 (grün 0-2000, orange 2000-3000, rot 3000-3530)
// Bremsen KWB1/KWB2: 0-6 KW (grün 0-2, orange 2-4, rot 4-6) - LOW PRIO!
export const motorParams: ParameterConfig[] = [
  {
    id: 'drehzahl_antriebmotor',
    name: 'Antriebmotor',
    unit: 'U/min',
    min: 0, max: 3530,
    green: [0, 2000], orange: [2000, 3000], red: [3000, 3530],
    priority: 'high'
  },
  {
    id: 'kwb1',
    name: 'KWB1',
    unit: 'KW',
    min: 0, max: 6,
    green: [0, 2], orange: [2, 4], red: [4, 6],
    priority: 'low'  // <-- LOW PRIO aus Main_Doku.json
  },
  {
    id: 'kwb2',
    name: 'KWB2',
    unit: 'KW',
    min: 0, max: 6,
    green: [0, 2], orange: [2, 4], red: [4, 6],
    priority: 'low'  // <-- LOW PRIO aus Main_Doku.json
  },
];

// === TEMPERATUREN / LAST (l) ===
// Temperaturen: 0-110 (grün 0-70, orange 70-90, rot 90-110)
// Auslastung: 0-100 (grün 0-60, orange 60-80, rot 80-100)
export const tempLastParams: ParameterConfig[] = [
  {
    id: 'oeltemp_hydraulik',
    name: 'Öltemp Hydraulik',
    unit: '°C',
    min: 0, max: 110,
    green: [0, 70], orange: [70, 90], red: [90, 110],
    priority: 'high'
  },
  {
    id: 'oeltemp_radsatz',
    name: 'Öltemp Radsatz',
    unit: '°C',
    min: 0, max: 110,
    green: [0, 70], orange: [70, 90], red: [90, 110],
    priority: 'high'
  },
  {
    id: 'pruefstand_auslastung',
    name: 'Prüfstand Auslastung',
    unit: '%',
    min: 0, max: 100,
    green: [0, 60], orange: [60, 80], red: [80, 100],
    priority: 'high'
  },
];

// === ALLE PARAMETER KOMBINIERT ===
export const alleParameter: ParameterConfig[] = [
  ...oeldruckParams,
  ...drehzahlParams,
  ...motorParams,
  ...tempLastParams,
];

// === SIMULIERTE WERTE ===
let simulierteWerte = {
  p: [25, 28, 30, 22],       // Öldrücke im grünen Bereich
  g: [3, 0],                  // Gang 3 aktiv
  r: [350, 340, 10],          // Drehzahlen K1, K2, Ausgleich
  m: [1500, 1.5, 1.2],        // Antrieb, KWB1, KWB2
  l: [65, 62, 45],            // Temps, Auslastung
};

// Zufällige Variation für realistische Werte
const variiere = (wert: number, range: number): number => {
  const variation = (Math.random() - 0.5) * range;
  return Math.round((wert + variation) * 10) / 10;
};

// === TELEMETRIE GENERATOR ===
export const generateTelemetrieData = (): TelemetrieResponse => {
  return {
    t: 'tele',
    ts: Date.now(),
    p: simulierteWerte.p.map(w => variiere(w, 5)),
    g: [...simulierteWerte.g],
    r: simulierteWerte.r.map(w => variiere(w, 20)),
    m: [
      variiere(simulierteWerte.m[0], 100),
      variiere(simulierteWerte.m[1], 0.3),
      variiere(simulierteWerte.m[2], 0.3),
    ],
    l: simulierteWerte.l.map(w => variiere(w, 3)),
    s: 'System bereit',
  };
};

// === SETTER FÜR TESTS / COMMANDS ===
export const setSimulierteWerte = (
  key: keyof typeof simulierteWerte, 
  values: number[]
) => {
  simulierteWerte[key] = values;
};

export const setBaseValues = (updates: Partial<typeof simulierteWerte>) => {
  Object.assign(simulierteWerte, updates);
};

export const resetTelemetrie = () => {
  simulierteWerte = {
    p: [25, 28, 30, 22],
    g: [3, 0],
    r: [350, 340, 10],
    m: [1500, 1.5, 1.2],
    l: [65, 62, 45],
  };
};
