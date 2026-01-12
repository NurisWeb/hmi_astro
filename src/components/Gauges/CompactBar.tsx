// ============================================
// CompactBar - Generische horizontale Balken-Anzeige
// Für kompakte Darstellung auf kleinen Bildschirmen
// Basiert auf BremseBalken-Design
// ============================================

import React from 'react';
import './CompactBar.css';

interface CompactBarProps {
  value: number;
  label: string;
  unit: string;
  min?: number;
  max: number;
  warningThreshold?: number;
  dangerThreshold?: number;
  decimals?: number;
  color?: 'cyan' | 'green' | 'orange' | 'purple' | 'blue';
}

const CompactBar: React.FC<CompactBarProps> = ({
  value,
  label,
  unit,
  min = 0,
  max,
  warningThreshold,
  dangerThreshold,
  decimals = 0,
  color = 'cyan',
}) => {
  // Prozent für Breite
  const range = max - min;
  const prozent = Math.min(100, Math.max(0, ((value - min) / range) * 100));
  
  // Status basierend auf Schwellwerten
  const getStatus = (): 'normal' | 'warning' | 'danger' => {
    if (dangerThreshold !== undefined && value >= dangerThreshold) return 'danger';
    if (warningThreshold !== undefined && value >= warningThreshold) return 'warning';
    return 'normal';
  };
  
  const status = getStatus();
  
  // Farbe basierend auf Status oder festgelegter Farbe
  const getBarColor = (): string => {
    if (status === 'danger') return 'var(--color-red)';
    if (status === 'warning') return 'var(--color-orange)';
    
    switch (color) {
      case 'green': return 'var(--color-green)';
      case 'orange': return 'var(--color-orange)';
      case 'purple': return 'var(--color-purple)';
      case 'blue': return 'var(--color-blue)';
      default: return 'var(--color-cyan)';
    }
  };
  
  const displayValue = value.toFixed(decimals);
  
  return (
    <div className={`compact-bar compact-bar--${status}`}>
      <div className="compact-bar-header">
        <span className="compact-bar-label">{label}</span>
        <span 
          className={`compact-bar-value compact-bar-value--${status}`}
          style={{ color: getBarColor() }}
        >
          {displayValue}
          <span className="compact-bar-unit">{unit}</span>
        </span>
      </div>
      
      <div className="compact-bar-track">
        <div 
          className={`compact-bar-fill compact-bar-fill--${status}`}
          style={{ 
            width: `${prozent}%`,
            background: `linear-gradient(to right, ${getBarColor()}, ${getBarColor()}cc)`,
          }}
        />
        
        {/* Schwellwert-Markierungen */}
        {warningThreshold !== undefined && (
          <div 
            className="compact-bar-threshold"
            style={{ left: `${((warningThreshold - min) / range) * 100}%` }}
          />
        )}
        {dangerThreshold !== undefined && (
          <div 
            className="compact-bar-threshold compact-bar-threshold--danger"
            style={{ left: `${((dangerThreshold - min) / range) * 100}%` }}
          />
        )}
      </div>
    </div>
  );
};

export default CompactBar;
