// ============================================
// GearSelectionPanel - DSG-Gangauswahl & Drehzahlsteuerung
// Mit Vorwahl-Anzeige und Last-Steuerung
// ============================================

import React from 'react';
import type { GearPosition, DSGState } from '../../types/dashboard.types';
import { GAUGE_CONSTANTS, DSG_CONSTANTS } from '../../types/dashboard.types';
import './menu.css';

interface GearSelectionPanelProps {
  selectedGear: string;
  onGearSelect: (gear: string) => void;
  manualRPM: number;
  onRPMChange: (rpm: number) => void;
  isAutoRunning: boolean;
  onAutoRunToggle: () => void;
  autoSpeed: 'slow' | 'normal' | 'fast';
  onAutoSpeedChange: (speed: 'slow' | 'normal' | 'fast') => void;
  // Neue DSG-Props
  dsgState?: DSGState;
  load?: number;
  onLoadChange?: (load: number) => void;
}

const gears: { value: GearPosition; label: string; clutch: 'K1' | 'K2' | '-' }[] = [
  { value: 'R', label: 'Rückwärts', clutch: 'K2' },
  { value: 'N', label: 'Neutral', clutch: '-' },
  { value: '1', label: '1. Gang', clutch: 'K1' },
  { value: '2', label: '2. Gang', clutch: 'K2' },
  { value: '3', label: '3. Gang', clutch: 'K1' },
  { value: '4', label: '4. Gang', clutch: 'K2' },
  { value: '5', label: '5. Gang', clutch: 'K1' },
  { value: '6', label: '6. Gang', clutch: 'K2' },
  { value: '7', label: '7. Gang', clutch: 'K1' },
];

const GearSelectionPanel: React.FC<GearSelectionPanelProps> = ({
  selectedGear,
  onGearSelect,
  manualRPM,
  onRPMChange,
  isAutoRunning,
  onAutoRunToggle,
  autoSpeed,
  onAutoSpeedChange,
  dsgState,
  load = 0,
  onLoadChange,
}) => {
  const rpmPercent = (manualRPM / GAUGE_CONSTANTS.RPM.MAX) * 100;
  const loadPercent = load;
  
  // Vorgewählter Gang aus DSG-State
  const preselectedGear = dsgState?.preselectedGear;
  const isShifting = dsgState?.isShifting ?? false;

  // Max-RPM für aktuellen Gang ermitteln
  const currentGearInfo = DSG_CONSTANTS.GEAR_RATIOS.find(g => g.gear === selectedGear);
  const maxRPMForGear = currentGearInfo?.maxRPM ?? GAUGE_CONSTANTS.RPM.MAX;

  const isGearPreselected = (gear: GearPosition) => {
    return preselectedGear === gear && selectedGear !== gear;
  };

  return (
    <div className="gear-panel">
      {/* Gang-Auswahl Sektion */}
      <div className="gear-panel-section">
        <div className="gear-panel-section-title">
          Gang auswählen (DSG-7)
          {isShifting && <span className="shifting-badge">⚡ Schalten</span>}
        </div>
        <div className="gear-grid">
          {gears.map(({ value, label, clutch }) => (
            <button
              key={value}
              className={`gear-btn ${selectedGear === value ? 'active' : ''} ${isGearPreselected(value) ? 'preselected' : ''} ${isShifting && selectedGear !== value ? 'disabled-shifting' : ''}`}
              onClick={() => onGearSelect(value)}
              disabled={isAutoRunning || isShifting}
            >
              <span className="gear-num">{value}</span>
              <span className="gear-label">{label}</span>
              <span className="gear-clutch-badge">{clutch}</span>
            </button>
          ))}
        </div>
        
        {/* DSG-Info-Box */}
        <div className="dsg-info-box">
          <div className="dsg-info-row">
            <span className="dsg-info-label">Aktiver Gang:</span>
            <span className="dsg-info-value active">{selectedGear}</span>
          </div>
          {preselectedGear && (
            <div className="dsg-info-row">
              <span className="dsg-info-label">Vorgewählt:</span>
              <span className="dsg-info-value preselected">{preselectedGear}</span>
            </div>
          )}
          <div className="dsg-info-row">
            <span className="dsg-info-label">Max. Drehzahl:</span>
            <span className="dsg-info-value">{maxRPMForGear.toLocaleString('de-DE')} U/min</span>
          </div>
        </div>
      </div>

      {/* Drehzahl & Last Sektion */}
      <div className="gear-panel-section">
        <div className="gear-panel-section-title">Drehzahl</div>
        <div className="rpm-control">
          <div className="rpm-slider-container">
            <div className="rpm-slider-track">
              <div 
                className="rpm-slider-fill" 
                style={{ width: `${rpmPercent}%` }}
              />
              {/* Redline-Markierung */}
              <div 
                className="rpm-redline-marker"
                style={{ left: `${(maxRPMForGear / GAUGE_CONSTANTS.RPM.MAX) * 100}%` }}
              />
            </div>
            <input
              type="range"
              className="rpm-slider"
              min="0"
              max={GAUGE_CONSTANTS.RPM.MAX}
              step="100"
              value={manualRPM}
              onChange={(e) => onRPMChange(parseInt(e.target.value))}
              disabled={isAutoRunning}
            />
          </div>
          <div className="rpm-value-display">
            <span>0</span>
            <span className={`rpm-value ${manualRPM > maxRPMForGear ? 'overlimit' : ''}`}>
              {manualRPM.toLocaleString('de-DE')}
            </span>
            <span>{GAUGE_CONSTANTS.RPM.MAX.toLocaleString('de-DE')}</span>
          </div>
        </div>

        {/* Last-Steuerung für Prüfstand */}
        <div className="gear-panel-section-title" style={{ marginTop: '16px' }}>
          Prüfstand-Last
        </div>
        <div className="load-control">
          <div className="load-slider-container">
            <div className="load-slider-track">
              <div 
                className="load-slider-fill" 
                style={{ 
                  width: `${loadPercent}%`,
                  background: loadPercent > 80 
                    ? 'linear-gradient(90deg, var(--color-orange), var(--color-red))'
                    : 'linear-gradient(90deg, var(--color-cyan), var(--color-green))'
                }}
              />
            </div>
            <input
              type="range"
              className="load-slider"
              min="0"
              max="100"
              step="5"
              value={load}
              onChange={(e) => onLoadChange?.(parseInt(e.target.value))}
              disabled={isAutoRunning}
            />
          </div>
          <div className="load-value-display">
            <span>0%</span>
            <span className={`load-value ${load > 80 ? 'high-load' : ''}`}>
              {load}%
            </span>
            <span>100%</span>
          </div>
          <div className="load-presets">
            {[0, 25, 50, 75, 100].map(preset => (
              <button
                key={preset}
                className={`load-preset-btn ${load === preset ? 'active' : ''}`}
                onClick={() => onLoadChange?.(preset)}
                disabled={isAutoRunning}
              >
                {preset}%
              </button>
            ))}
          </div>
        </div>

        {/* Auto-Modus */}
        <div className="gear-panel-section-title" style={{ marginTop: '16px' }}>
          Automatischer Prüflauf
        </div>
        
        <div className="speed-select">
          {(['slow', 'normal', 'fast'] as const).map((speed) => (
            <button
              key={speed}
              className={`speed-btn ${autoSpeed === speed ? 'active' : ''}`}
              onClick={() => onAutoSpeedChange(speed)}
              disabled={isAutoRunning}
            >
              {speed === 'slow' ? 'Langsam' : speed === 'normal' ? 'Normal' : 'Schnell'}
            </button>
          ))}
        </div>

        <div className="auto-mode-controls">
          <button
            className={`auto-mode-btn ${isAutoRunning ? 'running' : ''}`}
            onClick={onAutoRunToggle}
          >
            {isAutoRunning ? '⏹️ Prüflauf Stoppen' : '🔄 DSG-Prüflauf Starten'}
          </button>
        </div>
        
        {isAutoRunning && (
          <div className="auto-mode-info">
            <span className="auto-mode-info-text">
              ⚡ Automatischer Durchlauf aller 7 Gänge mit realistischer DSG-Schaltung
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GearSelectionPanel;
