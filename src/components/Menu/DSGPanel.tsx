// ============================================
// DSGPanel - DSG/Kupplung-Anzeige
// ============================================

import React from 'react';
import { GearPosition } from '../../types/dashboard.types';
import './menu.css';

interface DSGPanelProps {
  currentGear?: GearPosition;
  clutch1Status?: number; // 0-100%
  clutch2Status?: number; // 0-100%
  shiftTime?: number; // ms
}

const DSGPanel: React.FC<DSGPanelProps> = ({
  currentGear = 'N',
  clutch1Status = 0,
  clutch2Status = 0,
  shiftTime = 0,
}) => {
  const getClutchColor = (status: number) => {
    if (status > 80) return 'var(--color-green)';
    if (status > 50) return 'var(--color-orange)';
    return 'var(--color-red)';
  };

  return (
    <div className="dsg-panel">
      {/* Aktuelle Gang-Position */}
      <div className="dsg-section">
        <div className="dsg-section-title">Aktueller Gang</div>
        <div className="dsg-gear-display">
          <span className="dsg-gear-value">{currentGear}</span>
        </div>
      </div>

      {/* Kupplungen */}
      <div className="dsg-section">
        <div className="dsg-section-title">Kupplungsstatus</div>
        <div className="dsg-clutches">
          <div className="dsg-clutch">
            <div className="dsg-clutch-label">Kupplung 1</div>
            <div className="dsg-clutch-bar">
              <div 
                className="dsg-clutch-fill"
                style={{ 
                  width: `${clutch1Status}%`,
                  background: getClutchColor(clutch1Status)
                }}
              />
            </div>
            <div className="dsg-clutch-value">{clutch1Status.toFixed(0)}%</div>
          </div>
          <div className="dsg-clutch">
            <div className="dsg-clutch-label">Kupplung 2</div>
            <div className="dsg-clutch-bar">
              <div 
                className="dsg-clutch-fill"
                style={{ 
                  width: `${clutch2Status}%`,
                  background: getClutchColor(clutch2Status)
                }}
              />
            </div>
            <div className="dsg-clutch-value">{clutch2Status.toFixed(0)}%</div>
          </div>
        </div>
      </div>

      {/* Schaltzeit */}
      <div className="dsg-section">
        <div className="dsg-section-title">Schaltzeit</div>
        <div className="dsg-shifttime">
          <span className="dsg-shifttime-value">{shiftTime}</span>
          <span className="dsg-shifttime-unit">ms</span>
        </div>
      </div>

      {/* Gang-Schema */}
      <div className="dsg-section">
        <div className="dsg-section-title">Gangschema</div>
        <div className="dsg-schema">
          <div className="dsg-schema-row">
            <span className={`dsg-schema-gear ${currentGear === 'R' ? 'active' : ''}`}>R</span>
            <span className={`dsg-schema-gear ${currentGear === 'N' ? 'active' : ''}`}>N</span>
          </div>
          <div className="dsg-schema-row">
            {['1', '2', '3', '4', '5', '6', '7'].map(g => (
              <span 
                key={g}
                className={`dsg-schema-gear ${currentGear === g ? 'active' : ''}`}
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DSGPanel;

