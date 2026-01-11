// ============================================
// RegelungPanel - PID-Regelung Interface
// ============================================

import React, { useState } from 'react';
import './menu.css';

interface PIDValues {
  p: number;
  i: number;
  d: number;
}

interface RegelungPanelProps {
  sollwert?: number;
  istwert?: number;
  onStart?: () => void;
  onStop?: () => void;
}

const RegelungPanel: React.FC<RegelungPanelProps> = ({
  sollwert = 0,
  istwert = 0,
  onStart,
  onStop,
}) => {
  const [pid, setPid] = useState<PIDValues>({ p: 1.0, i: 0.1, d: 0.05 });
  const [isRunning, setIsRunning] = useState(false);

  const handlePidChange = (key: keyof PIDValues, value: string) => {
    const numValue = parseFloat(value) || 0;
    setPid(prev => ({ ...prev, [key]: numValue }));
  };

  const handleToggle = () => {
    if (isRunning) {
      setIsRunning(false);
      onStop?.();
    } else {
      setIsRunning(true);
      onStart?.();
    }
  };

  return (
    <div className="regelung-panel">
      {/* PID Eingabefelder */}
      <div className="regelung-section">
        <div className="regelung-section-title">PID Parameter</div>
        <div className="pid-inputs">
          <div className="pid-input-group">
            <label className="pid-label">P</label>
            <input
              type="number"
              className="pid-input"
              value={pid.p}
              onChange={(e) => handlePidChange('p', e.target.value)}
              step="0.1"
              disabled={isRunning}
            />
          </div>
          <div className="pid-input-group">
            <label className="pid-label">I</label>
            <input
              type="number"
              className="pid-input"
              value={pid.i}
              onChange={(e) => handlePidChange('i', e.target.value)}
              step="0.01"
              disabled={isRunning}
            />
          </div>
          <div className="pid-input-group">
            <label className="pid-label">D</label>
            <input
              type="number"
              className="pid-input"
              value={pid.d}
              onChange={(e) => handlePidChange('d', e.target.value)}
              step="0.01"
              disabled={isRunning}
            />
          </div>
        </div>
      </div>

      {/* Soll/Ist Anzeige */}
      <div className="regelung-section">
        <div className="regelung-section-title">Regelwerte</div>
        <div className="regelung-values">
          <div className="regelung-value-item">
            <span className="regelung-value-label">Sollwert</span>
            <span className="regelung-value-number soll">{sollwert.toFixed(1)}</span>
          </div>
          <div className="regelung-value-item">
            <span className="regelung-value-label">Istwert</span>
            <span className="regelung-value-number ist">{istwert.toFixed(1)}</span>
          </div>
          <div className="regelung-value-item">
            <span className="regelung-value-label">Abweichung</span>
            <span className={`regelung-value-number ${Math.abs(sollwert - istwert) > 10 ? 'danger' : ''}`}>
              {(sollwert - istwert).toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Start/Stop Button */}
      <div className="regelung-controls">
        <button
          className={`regelung-btn ${isRunning ? 'running' : ''}`}
          onClick={handleToggle}
        >
          {isRunning ? '⏹️ Regelung stoppen' : '▶️ Regelung starten'}
        </button>
      </div>
    </div>
  );
};

export default RegelungPanel;





