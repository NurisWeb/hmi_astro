// ============================================
// DrehzahlKGauge - Drehzahlanzeige für K1/K2/Ausgleich
// Main_Doku.json: 0-1000 U/min (grün 0-400, orange 400-800, rot 800-1000)
// ============================================

import React from 'react';
import BaseGauge from './BaseGauge';
import type { GaugeSize } from '../../types/dashboard.types';
import { GAUGE_CONSTANTS, COLORS } from '../../types/dashboard.types';

interface DrehzahlKGaugeProps {
  value: number;
  size: GaugeSize;
  typ: 'K1' | 'K2' | '';
  label?: string;
}

const DrehzahlKGauge: React.FC<DrehzahlKGaugeProps> = ({
  value,
  size,
  typ,
  label,
}) => {
  // Labels exakt wie in Main_Doku.json
  const displayLabel = label || `Drehzahl ${typ}`;

  // Farbe basierend auf Wert (Main_Doku.json Bereiche)
  const getColor = () => {
    if (value >= GAUGE_CONSTANTS.DREHZAHL_K.DANGER) return COLORS.RED;
    if (value >= GAUGE_CONSTANTS.DREHZAHL_K.WARNING) return COLORS.ORANGE;
    return COLORS.GREEN;
  };

  // Typ-spezifische Akzentfarbe
  const getAccentColor = () => {
    switch (typ) {
      case 'K1': return COLORS.CYAN;
      case 'K2': return COLORS.PURPLE;
      case '': return COLORS.BLUE;
    }
  };

  return (
    <BaseGauge
      value={value}
      maxValue={GAUGE_CONSTANTS.DREHZAHL_K.MAX}
      minValue={0}
      warningThreshold={GAUGE_CONSTANTS.DREHZAHL_K.WARNING}
      dangerThreshold={GAUGE_CONSTANTS.DREHZAHL_K.DANGER}
      unit="U/min"
      label={displayLabel}
      size={size}
      accentColor={getColor()}
      warningColor={COLORS.ORANGE}
      dangerColor={COLORS.RED}
      showNeedle={true}
      showTicks={true}
      tickInterval={{ major: 200, minor: 100 }}
      formatValue={(v) => v.toFixed(0)}
      className="drehzahl-k-gauge"
    >
      <div 
        className="gauge-motor-badge" 
        style={{ 
          color: getAccentColor(),
          fontSize: size === 'small' ? '12px' : size === 'medium' ? '14px' : '18px',
        }}
      >
        {typ}
      </div>
    </BaseGauge>
  );
};

export default DrehzahlKGauge;
