// ============================================
// GearSelectionPanel - Gangauswahl & Drehzahlsteuerung
// ============================================

import React from 'react';
import type { GearPosition } from '../../types/dashboard.types';
import { GAUGE_CONSTANTS } from '../../types/dashboard.types';
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
}

const gears: { value: GearPosition; label: string }[] = [
  { value: 'R', label: 'Rückwärts' },
  { value: 'N', label: 'Neutral' },
  { value: '1', label: '1. Gang' },
  { value: '2', label: '2. Gang' },
  { value: '3', label: '3. Gang' },
  { value: '4', label: '4. Gang' },
  { value: '5', label: '5. Gang' },
  { value: '6', label: '6. Gang' },
  { value: '7', label: '7. Gang' },
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
}) => {
  const rpmPercent = (manualRPM / GAUGE_CONSTANTS.RPM.MAX) * 100;

  return (
    <div className="gear-panel">
      <div className="gear-panel-section">
        <div className="gear-panel-section-title">Gang auswählen</div>
        <div className="gear-grid">
          {gears.map(({ value, label }) => (
            <button
              key={value}
              className={`gear-btn ${selectedGear === value ? 'active' : ''}`}
              onClick={() => onGearSelect(value)}
              disabled={isAutoRunning}
            >
              <span className="gear-num">{value}</span>
              <span className="gear-label">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="gear-panel-section">
        <div className="gear-panel-section-title">Manuelle Drehzahl</div>
        <div className="rpm-control">
          <div className="rpm-slider-container">
            <div className="rpm-slider-track">
              <div 
                className="rpm-slider-fill" 
                style={{ width: `${rpmPercent}%` }}
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
            <span className="rpm-value">{manualRPM.toLocaleString('de-DE')}</span>
            <span>{GAUGE_CONSTANTS.RPM.MAX.toLocaleString('de-DE')}</span>
          </div>
        </div>

        <div className="gear-panel-section-title" style={{ marginTop: '20px' }}>
          Automatischer Durchlauf
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
            {isAutoRunning ? '⏹️ Stoppen' : '🔄 Alle Gänge durchfahren'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GearSelectionPanel;
