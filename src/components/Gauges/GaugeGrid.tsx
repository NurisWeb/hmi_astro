// ============================================
// GaugeGrid - Container für alle Gauges
// Struktur EXAKT nach Main_Doku.json:
// 
// LAYOUT:
// ┌─────────────────────────────────────────────────────────────────────┐
// │  LINKS (Drücke)    │    MITTE (Motor)     │   RECHTS (Drehzahlen)  │
// │  K1, K2 Öldruck    │   Antriebmotor groß  │   Drehzahl K1, K2      │
// │  System, EDiff     │                      │   Auslastung           │
// │  Öltemp Hydr/Rads  │   KWB1 ══════  KWB2  │   Drehzahl Ausgleich   │
// └─────────────────────────────────────────────────────────────────────┘
// 
// Daten-Mapping (Main_Doku.json):
// p: [K1 Öldruck, K2 Öldruck, System Öldruck, EDiff Öldruck]
// r: [Drehzahl K1, Drehzahl K2, Drehzahl Ausgleich]
// m: [Drehzahl Antriebmotor, KWB1, KWB2]
// l: [Öltemp Hydraulik, Öltemp Radsatz, Prüfstand Auslastung]
// ============================================

import React from 'react';
import RPMGauge from './RPMGauge';
import OilPressureGauge from './OilPressureGauge';
import OilTemperatureGauge from './OilTemperatureGauge';
import DrehzahlKGauge from './DrehzahlKGauge';
import AuslastungGauge from './AuslastungGauge';
import BremseBalken from './BremseBalken';
import type { TelemetrieResponse } from '../../services/mockBackend/types';
import type { GaugeSize, GearPosition } from '../../types/dashboard.types';
import './GaugeGrid.css';

interface GaugeGridProps {
  telemetrie: TelemetrieResponse | null;
  isCompact: boolean;
  activeGear?: GearPosition;
}

const GaugeGrid: React.FC<GaugeGridProps> = ({ telemetrie, isCompact, activeGear = 'N' }) => {
  const gaugeSize: GaugeSize = isCompact ? 'small' : 'medium';
  const rpmSize: GaugeSize = isCompact ? 'medium' : 'large';
  const bremseSize: 'small' | 'medium' | 'large' = isCompact ? 'small' : 'medium';

  // Fallback-Werte wenn keine Telemetrie-Daten vorhanden
  const p = telemetrie?.p ?? [0, 0, 0, 0];  // Öldrücke
  const r = telemetrie?.r ?? [0, 0, 0];      // Drehzahlen K1/K2/Ausgleich
  const m = telemetrie?.m ?? [0, 0, 0];      // Antriebmotor, KWB1, KWB2
  const l = telemetrie?.l ?? [0, 0, 0];      // Temperaturen, Auslastung

  return (
    <div className={`gauge-grid ${isCompact ? 'compact' : 'expanded'}`}>
      
      {/* ============================================
          LINKE SPALTE: Öldrücke + Temperaturen
          3 Gauges pro Reihe für breiteres Layout
          ============================================ */}
      <section className="gauge-section gauge-section--left">
        <div className="gauge-row gauge-row--triple">
          <OilPressureGauge
            value={p[0]}
            size={gaugeSize}
            sensorId={1}
            label="K1 Öldruck"
          />
          <OilPressureGauge
            value={p[1]}
            size={gaugeSize}
            sensorId={2}
            label="K2 Öldruck"
          />
          <OilPressureGauge
            value={p[2]}
            size={gaugeSize}
            sensorId={3}
            label="System Öldruck"
          />
        </div>
        <div className="gauge-row gauge-row--triple">
          <OilPressureGauge
            value={p[3]}
            size={gaugeSize}
            sensorId={4}
            label="EDiff Öldruck"
          />
          <OilTemperatureGauge
            value={l[0]}
            size={gaugeSize}
            sensorId={1}
            label="Öltemp Hydraul."
          />
          <OilTemperatureGauge
            value={l[1]}
            size={gaugeSize}
            sensorId={2}
            label="Öltemp Radsatz"
          />
        </div>
      </section>

      {/* ============================================
          MITTLERE SPALTE: Antriebmotor + Bremsen
          Antriebmotor groß, Bremsen als horizontale Balken
          ============================================ */}
      <section className="gauge-section gauge-section--center">
        <div className="gauge-center-motor">
          <RPMGauge
            value={m[0]}
            size={rpmSize}
            gear={activeGear}
            label="Antriebmotor"
          />
        </div>
        
        {/* Bremsen als horizontale Balken (Equalizer-Style) */}
        <div className="gauge-bremsen-row">
          <BremseBalken
            wert={Math.abs(m[1])}
            label="KWB1"
            size={bremseSize}
          />
          <BremseBalken
            wert={Math.abs(m[2])}
            label="KWB2"
            size={bremseSize}
          />
        </div>
      </section>

      {/* ============================================
          RECHTE SPALTE: Drehzahlen + Auslastung
          K1, K2, Ausgleich Drehzahlen + Prüfstand Auslastung
          ============================================ */}
      <section className="gauge-section gauge-section--right">
        <div className="gauge-row">
          <DrehzahlKGauge
            value={r[0]}
            size={gaugeSize}
            typ="K1"
          />
          <DrehzahlKGauge
            value={r[1]}
            size={gaugeSize}
            typ="K2"
          />
        </div>
        <div className="gauge-row">
          <DrehzahlKGauge
            value={Math.abs(r[2])}
            size={gaugeSize}
            typ="Ausgleich"
          />
          <AuslastungGauge
            value={l[2]}
            size={gaugeSize}
          />
        </div>
      </section>
    </div>
  );
};

export default GaugeGrid;
