// ============================================
// GaugeGrid - Container für alle Gauges
// Struktur EXAKT nach Main_Doku.json:
// 
// LAYOUT OPTIMIERT (>= 1024px):
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │  LINKS (6 Gauges)       │   MITTE (Motor+Balken)   │  RECHTS (2 Gauges)    │
// │  ┌─────┬─────┬─────┐    │  ┌─────────────────┐     │  ┌─────────────────┐  │
// │  │ K1  │ K2  │ Sys │    │  │   ANTRIEBMOTOR  │     │  │ Drehz. Ausgleich│  │
// │  │Öldr.│Öldr.│Öldr.│    │  │    (medium)     │     │  ├─────────────────┤  │
// │  ├─────┼─────┼─────┤    │  ├────────┬────────┤     │  │ Prüfst. Auslast.│  │
// │  │EDiff│T.Hyd│T.Rad│    │  │  KWB1  │  KWB2  │     │  └─────────────────┘  │
// │  │Öldr.│     │     │    │  ├────────┼────────┤     │                       │
// │  └─────┴─────┴─────┘    │  │Drehz K1│Drehz K2│     │                       │
// │                         │  └────────┴────────┘     │                       │
// └─────────────────────────────────────────────────────────────────────────────┘
// 
// LAYOUT COMPACT (kleine Bildschirmhöhe < 750px):
// ┌────────────┬─────────────┬─────────────┬─────────────┐
// │            │ K1    24.0  │ T.Hyd  64°  │ DK1   342   │
// │   MOTOR    │ K2    25.9  │ T.Rad  63°  │ DK2   340   │   
// │   [Gauge]  │ Sys   28.2  │ KWB1  1.4   │ DAus   12   │
// │            │ EDiff 19.7  │ KWB2  1.3   │ Last   44%  │
// └────────────┴─────────────┴─────────────┴─────────────┘
// 
// Daten-Mapping (Main_Doku.json):
// p: [K1 Öldruck, K2 Öldruck, System Öldruck, EDiff Öldruck]
// r: [Drehzahl K1, Drehzahl K2, Drehzahl Ausgleich]
// m: [Drehzahl Antriebmotor, KWB1, KWB2]
// l: [Öltemp Hydraulik, Öltemp Radsatz, Prüfstand Auslastung]
// ============================================

import React, { useState, useEffect } from 'react';
import RPMGauge from './RPMGauge';
import OilPressureGauge from './OilPressureGauge';
import OilTemperatureGauge from './OilTemperatureGauge';
import DrehzahlKGauge from './DrehzahlKGauge';
import AuslastungGauge from './AuslastungGauge';
import BremseBalken from './BremseBalken';
import DrehzahlBalken from './DrehzahlBalken';
import CompactBar from './CompactBar';
import { useTheme } from '../../hooks/useTheme';
import type { TelemetrieResponse } from '../../services/mockBackend/types';
import type { GaugeSize, GearPosition } from '../../types/dashboard.types';
import './GaugeGrid.css';

// Schwellenwert für kompakte Höhe
const HEIGHT_COMPACT_THRESHOLD = 900;

interface GaugeGridProps {
  telemetrie: TelemetrieResponse | null;
  isCompact: boolean;
  activeGear?: GearPosition;
}

const GaugeGrid: React.FC<GaugeGridProps> = ({ telemetrie, isCompact, activeGear = 'N' }) => {
  // Bildschirmhöhe überwachen
  const [isHeightCompact, setIsHeightCompact] = useState(false);
  // Theme für Re-Render bei Theme-Wechsel
  const { theme } = useTheme();
  
  useEffect(() => {
    const checkHeight = () => {
      setIsHeightCompact(window.innerHeight < HEIGHT_COMPACT_THRESHOLD);
    };
    
    checkHeight();
    window.addEventListener('resize', checkHeight);
    return () => window.removeEventListener('resize', checkHeight);
  }, []);

  const gaugeSize: GaugeSize = isCompact ? 'small' : 'medium';
  // Motor ist jetzt immer medium (nicht mehr large) für bessere Platznutzung
  const rpmSize: GaugeSize = isHeightCompact ? 'small' : 'medium';
  const bremseSize: 'small' | 'medium' | 'large' = isCompact ? 'small' : 'small';

  // Fallback-Werte wenn keine Telemetrie-Daten vorhanden
  const p = telemetrie?.p ?? [0, 0, 0, 0];  // Öldrücke
  const r = telemetrie?.r ?? [0, 0, 0];      // Drehzahlen K1/K2/Ausgleich
  const m = telemetrie?.m ?? [0, 0, 0];      // Antriebmotor, KWB1, KWB2
  const l = telemetrie?.l ?? [0, 0, 0];      // Temperaturen, Auslastung

  // ============================================
  // KOMPAKTES LAYOUT FÜR KLEINE BILDSCHIRMHÖHEN
  // Motor links, 3 Spalten mit Balken untereinander
  // Alles auf einen Blick - KEIN Scrollen!
  // ============================================
  if (isHeightCompact) {
    return (
      <div key={theme} className="gauge-grid gauge-grid--height-compact">
        {/* Motor bleibt als einziger Gauge (links) */}
        <div className="gauge-compact-motor">
          <RPMGauge
            value={m[0]}
            size="small"
            gear={activeGear}
            label="Motor"
          />
        </div>
        
        {/* Spalte 1: Öldrücke (4 Stück untereinander) */}
        <div className="gauge-compact-column">
          <CompactBar value={p[0]} label="K1" unit="bar" max={60} warningThreshold={45} dangerThreshold={55} decimals={1} />
          <CompactBar value={p[1]} label="K2" unit="bar" max={60} warningThreshold={45} dangerThreshold={55} decimals={1} />
          <CompactBar value={p[2]} label="Sys" unit="bar" max={60} warningThreshold={45} dangerThreshold={55} decimals={1} />
          <CompactBar value={p[3]} label="EDiff" unit="bar" max={60} warningThreshold={45} dangerThreshold={55} decimals={1} />
        </div>
        
        {/* Spalte 2: Temperaturen + Bremsen (4 Stück untereinander) */}
        <div className="gauge-compact-column">
          <CompactBar value={l[0]} label="T.Hyd" unit="°C" max={120} warningThreshold={100} dangerThreshold={115} decimals={0} color="green" />
          <CompactBar value={l[1]} label="T.Rad" unit="°C" max={120} warningThreshold={100} dangerThreshold={115} decimals={0} color="green" />
          <CompactBar value={Math.abs(m[1])} label="KWB1" unit="kW" max={6} warningThreshold={2} dangerThreshold={4} decimals={1} color="orange" />
          <CompactBar value={Math.abs(m[2])} label="KWB2" unit="kW" max={6} warningThreshold={2} dangerThreshold={4} decimals={1} color="orange" />
        </div>
        
        {/* Spalte 3: Drehzahlen + Auslastung (4 Stück untereinander) */}
        <div className="gauge-compact-column">
          <CompactBar value={r[0]} label="DK1" unit="U/m" max={1000} decimals={0} color="blue" />
          <CompactBar value={r[1]} label="DK2" unit="U/m" max={1000} decimals={0} color="blue" />
          <CompactBar value={Math.abs(r[2])} label="DAus" unit="U/m" max={1000} decimals={0} color="blue" />
          <CompactBar value={l[2]} label="Last" unit="%" max={100} warningThreshold={70} dangerThreshold={90} decimals={0} color="purple" />
        </div>
      </div>
    );
  }

  // ============================================
  // NORMALES LAYOUT - OPTIMIERT
  // Links: 6 Gauges in 3x2 Grid
  // Mitte: Motor + Bremsen + Drehzahl-Balken
  // Rechts: 2 Gauges vertikal
  // ============================================
  return (
    <div key={theme} className={`gauge-grid ${isCompact ? 'compact' : 'expanded'}`}>
      
      {/* ============================================
          LINKE SEKTION: 6 Gauges in einem 3x2 Grid
          Reihe 1: K1 Öldruck, K2 Öldruck, System Öldruck
          Reihe 2: EDiff Öldruck, Öltemp Hydraul., Öltemp Radsatz
          ============================================ */}
      <section className="gauge-section gauge-section--left">
        <div className="gauge-grid-6">
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
          MITTLERE SEKTION: Motor + Balken
          - Antriebmotor (medium)
          - KWB1 + KWB2 (Bremse-Balken)
          - Drehzahl K1 + K2 (neue Drehzahl-Balken)
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
        <div className="gauge-balken-row">
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
        
        {/* Drehzahlen K1/K2 als horizontale Balken (blau) */}
        <div className="gauge-balken-row">
          <DrehzahlBalken
            wert={r[0]}
            label="Drehz. K1"
            size={bremseSize}
            maxWert={1000}
          />
          <DrehzahlBalken
            wert={r[1]}
            label="Drehz. K2"
            size={bremseSize}
            maxWert={1000}
          />
        </div>
      </section>

      {/* ============================================
          RECHTE SEKTION: 2 Gauges vertikal
          - Drehzahl Ausgleich
          - Prüfstand Auslastung
          ============================================ */}
      <section className="gauge-section gauge-section--right">
        <div className="gauge-row-vertical">
          <DrehzahlKGauge
            value={Math.abs(r[2])}
            size={gaugeSize}
            typ=""
            label="Drehzahl Ausgleich"
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
