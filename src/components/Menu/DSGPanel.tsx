// ============================================
// DSGPanel - DSG-Getriebe Statusanzeige
// 7-Gang Doppelkupplungsgetriebe Visualisierung
// ============================================

import React from 'react';
import type { GearPosition, DSGState } from '../../types/dashboard.types';
import { DSG_CONSTANTS } from '../../types/dashboard.types';
import './menu.css';

interface DSGPanelProps {
  dsgState?: DSGState;
  currentGear?: GearPosition;
  clutch1Status?: number;
  clutch2Status?: number;
  shiftTime?: number;
}

// Initiales DSG-State für Fallback
const getDefaultDSGState = (): DSGState => ({
  activeGear: 'N',
  preselectedGear: '1',
  clutch1: {
    engagement: 0,
    pressure: 0,
    temperature: 25,
    gears: ['1', '3', '5', '7'],
    isActive: false,
  },
  clutch2: {
    engagement: 0,
    pressure: 0,
    temperature: 25,
    gears: ['R', '2', '4', '6'],
    isActive: false,
  },
  shiftPhase: 'idle',
  shiftTimeMs: 0,
  isShifting: false,
  targetRPM: 800,
  load: 0,
});

const DSGPanel: React.FC<DSGPanelProps> = ({
  dsgState,
  currentGear,
  clutch1Status,
  clutch2Status,
  shiftTime,
}) => {
  // Verwende entweder das vollständige DSGState oder die alten Props
  const state = dsgState || getDefaultDSGState();
  const activeGear = currentGear || state.activeGear;
  const c1Engagement = clutch1Status ?? state.clutch1.engagement;
  const c2Engagement = clutch2Status ?? state.clutch2.engagement;
  const lastShiftTime = shiftTime ?? state.shiftTimeMs;

  const getClutchColor = (engagement: number, isActive: boolean) => {
    if (isActive && engagement > 80) return 'var(--color-green)';
    if (engagement > 50) return 'var(--color-orange)';
    if (engagement > 0) return 'var(--color-cyan)';
    return 'var(--text-dim)';
  };

  const getTempColor = (temp: number) => {
    if (temp > DSG_CONSTANTS.CLUTCH.WARNING_TEMP) return 'var(--color-red)';
    if (temp > DSG_CONSTANTS.CLUTCH.WARNING_TEMP * 0.8) return 'var(--color-orange)';
    return 'var(--color-cyan)';
  };

  const getShiftPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'idle': return 'Bereit';
      case 'preselect': return 'Vorwahl';
      case 'overlap': return 'Schalten';
      case 'complete': return 'Abschluss';
      default: return phase;
    }
  };

  const isGearActive = (gear: string) => activeGear === gear;
  const isGearPreselected = (gear: string) => state.preselectedGear === gear && !isGearActive(gear);

  return (
    <div className="dsg-panel">
      {/* Aktuelle Gang-Position */}
      <div className="dsg-section">
        <div className="dsg-section-title">Aktueller Gang</div>
        <div className="dsg-gear-main">
          <div className="dsg-gear-display">
            <span className={`dsg-gear-value ${state.isShifting ? 'shifting' : ''}`}>
              {activeGear}
            </span>
            {state.isShifting && (
              <span className="dsg-shifting-indicator">⚡</span>
            )}
          </div>
          {state.preselectedGear && (
            <div className="dsg-preselected">
              <span className="dsg-preselected-label">Vorgewählt:</span>
              <span className="dsg-preselected-value">{state.preselectedGear}</span>
            </div>
          )}
        </div>
      </div>

      {/* Kupplungen - Dual-Anzeige */}
      <div className="dsg-section">
        <div className="dsg-section-title">Kupplungsstatus</div>
        <div className="dsg-clutches-dual">
          {/* Kupplung 1 */}
          <div className={`dsg-clutch-box ${state.clutch1.isActive ? 'active' : ''}`}>
            <div className="dsg-clutch-header">
              <span className="dsg-clutch-name">K1</span>
              <span className="dsg-clutch-gears">1 · 3 · 5 · 7</span>
            </div>
            <div className="dsg-clutch-engagement">
              <div className="dsg-clutch-ring">
                <svg viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="var(--metal-dark)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={getClutchColor(c1Engagement, state.clutch1.isActive)}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${c1Engagement * 2.64} 264`}
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dasharray 0.1s ease' }}
                  />
                </svg>
                <div className="dsg-clutch-percent">{Math.round(c1Engagement)}%</div>
              </div>
            </div>
            <div className="dsg-clutch-details">
              <div className="dsg-clutch-stat">
                <span className="dsg-clutch-stat-label">Druck</span>
                <span className="dsg-clutch-stat-value">
                  {state.clutch1.pressure.toFixed(1)} bar
                </span>
              </div>
              <div className="dsg-clutch-stat">
                <span className="dsg-clutch-stat-label">Temp</span>
                <span 
                  className="dsg-clutch-stat-value"
                  style={{ color: getTempColor(state.clutch1.temperature) }}
                >
                  {Math.round(state.clutch1.temperature)}°C
                </span>
              </div>
            </div>
          </div>

          {/* Kupplung 2 */}
          <div className={`dsg-clutch-box ${state.clutch2.isActive ? 'active' : ''}`}>
            <div className="dsg-clutch-header">
              <span className="dsg-clutch-name">K2</span>
              <span className="dsg-clutch-gears">R · 2 · 4 · 6</span>
            </div>
            <div className="dsg-clutch-engagement">
              <div className="dsg-clutch-ring">
                <svg viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="var(--metal-dark)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={getClutchColor(c2Engagement, state.clutch2.isActive)}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${c2Engagement * 2.64} 264`}
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dasharray 0.1s ease' }}
                  />
                </svg>
                <div className="dsg-clutch-percent">{Math.round(c2Engagement)}%</div>
              </div>
            </div>
            <div className="dsg-clutch-details">
              <div className="dsg-clutch-stat">
                <span className="dsg-clutch-stat-label">Druck</span>
                <span className="dsg-clutch-stat-value">
                  {state.clutch2.pressure.toFixed(1)} bar
                </span>
              </div>
              <div className="dsg-clutch-stat">
                <span className="dsg-clutch-stat-label">Temp</span>
                <span 
                  className="dsg-clutch-stat-value"
                  style={{ color: getTempColor(state.clutch2.temperature) }}
                >
                  {Math.round(state.clutch2.temperature)}°C
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schaltinfo */}
      <div className="dsg-section">
        <div className="dsg-section-title">Schaltvorgang</div>
        <div className="dsg-shift-info">
          <div className="dsg-shift-stat">
            <span className="dsg-shift-label">Status</span>
            <span className={`dsg-shift-value ${state.isShifting ? 'active' : ''}`}>
              {getShiftPhaseLabel(state.shiftPhase)}
            </span>
          </div>
          <div className="dsg-shift-stat">
            <span className="dsg-shift-label">Letzte Schaltzeit</span>
            <span className="dsg-shift-value dsg-shifttime">
              {lastShiftTime} <span className="dsg-unit">ms</span>
            </span>
          </div>
          <div className="dsg-shift-stat">
            <span className="dsg-shift-label">Last</span>
            <span className="dsg-shift-value">
              {Math.round(state.load)}%
            </span>
          </div>
        </div>
      </div>

      {/* Gang-Schema mit Vorwahlanzeige */}
      <div className="dsg-section">
        <div className="dsg-section-title">Gangschema DSG-7</div>
        <div className="dsg-schema-visual">
          <div className="dsg-schema-row dsg-schema-special">
            <div 
              className={`dsg-schema-gear-box ${isGearActive('R') ? 'active' : ''} ${isGearPreselected('R') ? 'preselected' : ''}`}
            >
              <span className="dsg-schema-gear">R</span>
              <span className="dsg-schema-clutch">K2</span>
            </div>
            <div 
              className={`dsg-schema-gear-box ${isGearActive('N') ? 'active' : ''}`}
            >
              <span className="dsg-schema-gear">N</span>
              <span className="dsg-schema-clutch">—</span>
            </div>
          </div>
          <div className="dsg-schema-row dsg-schema-drive">
            {(['1', '2', '3', '4', '5', '6', '7'] as GearPosition[]).map(gear => (
              <div 
                key={gear}
                className={`dsg-schema-gear-box ${isGearActive(gear) ? 'active' : ''} ${isGearPreselected(gear) ? 'preselected' : ''}`}
              >
                <span className="dsg-schema-gear">{gear}</span>
                <span className="dsg-schema-clutch">
                  {DSG_CONSTANTS.CLUTCH1_GEARS.includes(gear) ? 'K1' : 'K2'}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="dsg-legend">
          <div className="dsg-legend-item">
            <span className="dsg-legend-dot active"></span>
            <span>Aktiv</span>
          </div>
          <div className="dsg-legend-item">
            <span className="dsg-legend-dot preselected"></span>
            <span>Vorgewählt</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DSGPanel;
