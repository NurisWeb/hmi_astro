// ============================================
// BremseBalken - Horizontaler Balken für KWB1/KWB2
// Bereiche aus Main_Doku.json:
// 0-6 KW (grün 0-2, orange 2-4, rot 4-6)
// 
// Horizontale Darstellung für kompaktes Layout
// Equalizer-Style mit Farbzonen
// ============================================

import React from 'react';
import './BremseBalken.css';

interface BremseBalkenProps {
  wert: number;  // 0-6 KW (immer positiv angezeigt)
  label: string;
  size?: 'small' | 'medium' | 'large';
}

// Bereiche aus Main_Doku.json
const MAX = 6;

// Farben
const COLORS = {
  green: '#4CAF50',
  orange: '#FF9800',
  red: '#F44336',
  greenDim: 'rgba(76, 175, 80, 0.15)',
  orangeDim: 'rgba(255, 152, 0, 0.15)',
  redDim: 'rgba(244, 67, 54, 0.15)',
};

const BremseBalken: React.FC<BremseBalkenProps> = ({ 
  wert, 
  label,
  size = 'medium',
}) => {
  // Immer absolute Werte anzeigen
  const absWert = Math.abs(wert);
  
  // Farbe basierend auf Wert
  const getFarbe = (): string => {
    if (absWert >= 4) return COLORS.red;
    if (absWert >= 2) return COLORS.orange;
    return COLORS.green;
  };
  
  // Status für CSS-Klasse
  const getStatus = (): string => {
    if (absWert >= 4) return 'danger';
    if (absWert >= 2) return 'warning';
    return 'normal';
  };
  
  // Prozent für Breite (von links nach rechts)
  const prozent = Math.min(100, Math.max(0, (absWert / MAX) * 100));
  
  // Wert formatieren (immer positiv)
  const displayWert = absWert.toFixed(1);
  
  return (
    <div className={`bremse-balken bremse-balken--horizontal ${size}`}>
      <div className="bremse-header">
        <span className="bremse-label">{label}</span>
        <span 
          className={`bremse-value ${getStatus()}`}
          style={{ color: getFarbe() }}
        >
          {displayWert}
          <span className="bremse-unit">kW</span>
        </span>
      </div>
      
      <div className="bremse-bar-container">
        {/* Hintergrund-Zonen (links nach rechts: grün, orange, rot) */}
        <div className="bremse-zones-horizontal">
          <div 
            className="bremse-zone-h" 
            style={{ 
              width: '33.33%', 
              background: COLORS.greenDim,
            }} 
          />
          <div 
            className="bremse-zone-h" 
            style={{ 
              width: '33.33%', 
              background: COLORS.orangeDim,
            }} 
          />
          <div 
            className="bremse-zone-h" 
            style={{ 
              width: '33.34%', 
              background: COLORS.redDim,
            }} 
          />
        </div>
        
        {/* Aktueller Wert (füllt von links) */}
        <div 
          className={`bremse-fill-h ${getStatus()}`}
          style={{ 
            width: `${prozent}%`,
            background: `linear-gradient(to right, ${getFarbe()}, ${getFarbe()}dd)`,
          }}
        />
        
        {/* Schwellwert-Linien */}
        <div className="bremse-threshold-h" style={{ left: '33.33%' }} />
        <div className="bremse-threshold-h warning" style={{ left: '66.66%' }} />
      </div>
      
      {/* Skala (optional, nur bei größeren Sizes) */}
      {size !== 'small' && (
        <div className="bremse-scale-h">
          <span>0</span>
          <span>2</span>
          <span>4</span>
          <span>6</span>
        </div>
      )}
    </div>
  );
};

export default BremseBalken;
