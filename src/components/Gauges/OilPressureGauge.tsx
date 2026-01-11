// ============================================
// OilPressureGauge - Öldruckanzeige
// Main_Doku.json: 0-60 bar (grün 0-35, orange 35-50, rot 50-60)
// ============================================

import React from 'react';
import BaseGauge from './BaseGauge';
import type { GaugeSize } from '../../types/dashboard.types';
import { GAUGE_CONSTANTS, COLORS } from '../../types/dashboard.types';

interface OilPressureGaugeProps {
  value: number;
  size: GaugeSize;
  sensorId: number;
  label?: string;
}

const OilPressureGauge: React.FC<OilPressureGaugeProps> = ({
  value,
  size,
  sensorId,
  label,
}) => {
  const displayLabel = label || `Öldruck S${sensorId}`;

  return (
    <BaseGauge
      value={value}
      maxValue={GAUGE_CONSTANTS.OIL_PRESSURE.MAX}
      minValue={0}
      warningThreshold={GAUGE_CONSTANTS.OIL_PRESSURE.WARNING}
      dangerThreshold={GAUGE_CONSTANTS.OIL_PRESSURE.DANGER}
      unit="bar"
      label={displayLabel}
      size={size}
      accentColor={COLORS.GREEN}
      warningColor={COLORS.ORANGE}
      dangerColor={COLORS.RED}
      showNeedle={true}
      showTicks={true}
      tickInterval={{ major: 10, minor: 5 }}
      formatValue={(v) => v.toFixed(1)}
      className="oil-pressure-gauge"
    >
      <div className="gauge-sensor-badge">S{sensorId}</div>
    </BaseGauge>
  );
};

export default OilPressureGauge;
