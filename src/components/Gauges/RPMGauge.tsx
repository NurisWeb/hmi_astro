// ============================================
// RPMGauge - Drehzahlanzeige Eingangsmotor
// Main_Doku.json: 0-3530 (grün 0-2000, orange 2000-3000, rot 3000-3530)
// ============================================

import React from 'react';
import BaseGauge from './BaseGauge';
import type { GaugeSize, GearPosition } from '../../types/dashboard.types';
import { GAUGE_CONSTANTS, COLORS } from '../../types/dashboard.types';

interface RPMGaugeProps {
  value: number;
  size: GaugeSize;
  gear?: GearPosition;
  label?: string;
}

const RPMGauge: React.FC<RPMGaugeProps> = ({
  value,
  size,
  gear = 'N',
  label = 'Drehzahl',
}) => {
  const formatRPM = (rpm: number) => {
    return (rpm / 1000).toFixed(1);
  };

  // Farbe basierend auf Wert (Main_Doku.json Bereiche)
  const getColor = () => {
    if (value >= GAUGE_CONSTANTS.RPM.REDLINE) return COLORS.RED;
    if (value >= GAUGE_CONSTANTS.RPM.WARNING) return COLORS.ORANGE;
    return COLORS.GREEN;
  };

  return (
    <BaseGauge
      value={value}
      maxValue={GAUGE_CONSTANTS.RPM.MAX}
      minValue={0}
      warningThreshold={GAUGE_CONSTANTS.RPM.WARNING}
      dangerThreshold={GAUGE_CONSTANTS.RPM.REDLINE}
      unit="× 1000 U/min"
      label={label}
      size={size}
      accentColor={COLORS.GREEN}
      warningColor={COLORS.ORANGE}
      dangerColor={COLORS.RED}
      showNeedle={true}
      showTicks={true}
      tickInterval={{ major: 500, minor: 100 }}
      formatValue={formatRPM}
      className="rpm-gauge"
    >
      <div 
        className="gauge-motor-badge" 
        style={{ 
          color: getColor(),
          fontSize: size === 'small' ? '14px' : size === 'medium' ? '18px' : '24px',
          fontWeight: 300,
        }}
      >
        {gear}
      </div>
    </BaseGauge>
  );
};

export default RPMGauge;
