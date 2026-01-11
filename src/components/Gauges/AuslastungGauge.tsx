// ============================================
// AuslastungGauge - Prüfstand Auslastung
// Main_Doku.json: 0-100% (grün 0-60, orange 60-80, rot 80-100)
// ============================================

import React from 'react';
import BaseGauge from './BaseGauge';
import type { GaugeSize } from '../../types/dashboard.types';
import { GAUGE_CONSTANTS, COLORS } from '../../types/dashboard.types';

interface AuslastungGaugeProps {
  value: number;
  size: GaugeSize;
  label?: string;
}

const AuslastungGauge: React.FC<AuslastungGaugeProps> = ({
  value,
  size,
  label = 'Prüfstand Auslastung',
}) => {
  // Farbe basierend auf Wert (Main_Doku.json Bereiche)
  const getColor = () => {
    if (value >= GAUGE_CONSTANTS.AUSLASTUNG.DANGER) return COLORS.RED;
    if (value >= GAUGE_CONSTANTS.AUSLASTUNG.WARNING) return COLORS.ORANGE;
    return COLORS.GREEN;
  };

  return (
    <BaseGauge
      value={value}
      maxValue={GAUGE_CONSTANTS.AUSLASTUNG.MAX}
      minValue={0}
      warningThreshold={GAUGE_CONSTANTS.AUSLASTUNG.WARNING}
      dangerThreshold={GAUGE_CONSTANTS.AUSLASTUNG.DANGER}
      unit="%"
      label={label}
      size={size}
      accentColor={getColor()}
      warningColor={COLORS.ORANGE}
      dangerColor={COLORS.RED}
      showNeedle={true}
      showTicks={true}
      tickInterval={{ major: 20, minor: 10 }}
      formatValue={(v) => v.toFixed(0)}
      className="auslastung-gauge"
    >
      <div 
        className="gauge-motor-badge" 
        style={{ 
          color: getColor(),
          fontSize: size === 'small' ? '14px' : size === 'medium' ? '18px' : '24px',
        }}
      >
        ⚡
      </div>
    </BaseGauge>
  );
};

export default AuslastungGauge;
