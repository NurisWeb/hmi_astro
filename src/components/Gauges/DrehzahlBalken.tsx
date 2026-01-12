// ============================================
// DrehzahlBalken - Horizontaler Balken für Drehzahl K1/K2
// Bereiche: 0-1000 U/min
// 
// Horizontale Darstellung für kompaktes Layout
// Equalizer-Style in Cyan/Blau
// ============================================

import React from 'react';
import './DrehzahlBalken.css';

interface DrehzahlBalkenProps {
  wert: number;  // 0-1000 U/min
  label: string;
  size?: 'small' | 'medium' | 'large';
  maxWert?: number;  // Standard: 1000
}

const DrehzahlBalken: React.FC<DrehzahlBalkenProps> = ({ 
  wert, 
  label,
  size = 'medium',
  maxWert = 1000,
}) => {
  // Farben (Cyan/Blau)
  const COLORS = {
    low: '#00BCD4',       // Cyan
    mid: '#2196F3',       // Blau
    high: '#3F51B5',      // Indigo
    lowDim: 'rgba(0, 188, 212, 0.15)',
    midDim: 'rgba(33, 150, 243, 0.15)',
    highDim: 'rgba(63, 81, 181, 0.15)',
  };

  // Prozent für Breite (von links nach rechts)
  const prozent = Math.min(100, Math.max(0, (wert / maxWert) * 100));
  
  // Farbe basierend auf Wert
  const getFarbe = (): string => {
    if (prozent >= 66) return COLORS.high;
    if (prozent >= 33) return COLORS.mid;
    return COLORS.low;
  };
  
  // Status für CSS-Klasse
  const getStatus = (): string => {
    if (prozent >= 66) return 'high';
    if (prozent >= 33) return 'mid';
    return 'low';
  };
  
  // Wert formatieren
  const displayWert = Math.round(wert);
  
  // Skala-Werte
  const skalaMax = maxWert;
  const skala1 = Math.round(maxWert / 3);
  const skala2 = Math.round((maxWert / 3) * 2);
  
  return (
    <div className={`drehzahl-balken drehzahl-balken--horizontal ${size}`}>
      <div className="drehzahl-header">
        <span className="drehzahl-label">{label}</span>
        <span 
          className={`drehzahl-value ${getStatus()}`}
          style={{ color: getFarbe() }}
        >
          {displayWert}
          <span className="drehzahl-unit">U/m</span>
        </span>
      </div>
      
      <div className="drehzahl-bar-container">
        {/* Hintergrund-Zonen (links nach rechts: low, mid, high) */}
        <div className="drehzahl-zones-horizontal">
          <div 
            className="drehzahl-zone-h" 
            style={{ 
              width: '33.33%', 
              background: COLORS.lowDim,
            }} 
          />
          <div 
            className="drehzahl-zone-h" 
            style={{ 
              width: '33.33%', 
              background: COLORS.midDim,
            }} 
          />
          <div 
            className="drehzahl-zone-h" 
            style={{ 
              width: '33.34%', 
              background: COLORS.highDim,
            }} 
          />
        </div>
        
        {/* Aktueller Wert (füllt von links) */}
        <div 
          className={`drehzahl-fill-h ${getStatus()}`}
          style={{ 
            width: `${prozent}%`,
            background: `linear-gradient(to right, ${getFarbe()}, ${getFarbe()}dd)`,
          }}
        />
        
        {/* Schwellwert-Linien */}
        <div className="drehzahl-threshold-h" style={{ left: '33.33%' }} />
        <div className="drehzahl-threshold-h mid" style={{ left: '66.66%' }} />
      </div>
      
      {/* Skala (optional, nur bei größeren Sizes) */}
      {size !== 'small' && (
        <div className="drehzahl-scale-h">
          <span>0</span>
          <span>{skala1}</span>
          <span>{skala2}</span>
          <span>{skalaMax}</span>
        </div>
      )}
    </div>
  );
};

export default DrehzahlBalken;
