// ============================================
// RPMGauge - Drehzahlanzeige (0-12000 U/min)
// ============================================

import React from 'react';
import BaseGauge from './BaseGauge';
import type { GaugeSize, GearPosition } from '../../types/dashboard.types';
import { GAUGE_CONSTANTS, COLORS } from '../../types/dashboard.types';

interface RPMGaugeProps {
  value: number;
  size: GaugeSize;
  gear?: GearPosition;
  redlineRPM?: number;
  label?: string;
}

const RPMGauge: React.FC<RPMGaugeProps> = ({
  value,
  size,
  gear = 'N',
  redlineRPM = GAUGE_CONSTANTS.RPM.REDLINE,
  label = 'Drehzahl',
}) => {
  const formatRPM = (rpm: number) => {
    return (rpm / 1000).toFixed(1);
  };

  return (
    <BaseGauge
      value={value}
      maxValue={GAUGE_CONSTANTS.RPM.MAX}
      minValue={0}
      warningThreshold={redlineRPM - 1000}
      dangerThreshold={redlineRPM}
      unit="× 1000 U/min"
      label={label}
      size={size}
      accentColor={COLORS.BLUE}
      warningColor={COLORS.ORANGE}
      dangerColor={COLORS.RED}
      showNeedle={true}
      showTicks={true}
      tickInterval={{ major: 1000, minor: 500 }}
      formatValue={formatRPM}
      className="rpm-gauge"
    >
      <div 
        className="gauge-motor-badge" 
        style={{ 
          color: value >= redlineRPM ? COLORS.RED : COLORS.BLUE,
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
