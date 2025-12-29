// ============================================
// OilTemperatureGauge - Öltemperaturanzeige (0-150°C)
// ============================================

import React from 'react';
import BaseGauge from './BaseGauge';
import type { GaugeSize } from '../../types/dashboard.types';
import { GAUGE_CONSTANTS, COLORS } from '../../types/dashboard.types';

interface OilTemperatureGaugeProps {
  value: number;
  size: GaugeSize;
  sensorId?: number;
  label?: string;
}

const OilTemperatureGauge: React.FC<OilTemperatureGaugeProps> = ({
  value,
  size,
  sensorId = 1,
  label,
}) => {
  const displayLabel = label || `Öltemperatur${sensorId > 1 ? ` T${sensorId}` : ''}`;
  
  // Temperatur-spezifische Farben: Blau (kalt) -> Orange (warm) -> Rot (heiß)
  const getTemperatureColor = () => {
    if (value < GAUGE_CONSTANTS.OIL_TEMPERATURE.COLD) return COLORS.BLUE;
    if (value < GAUGE_CONSTANTS.OIL_TEMPERATURE.WARNING) return COLORS.AMBER;
    if (value < GAUGE_CONSTANTS.OIL_TEMPERATURE.DANGER) return COLORS.ORANGE;
    return COLORS.RED;
  };

  const currentColor = getTemperatureColor();
  const isCold = value < GAUGE_CONSTANTS.OIL_TEMPERATURE.COLD;

  return (
    <BaseGauge
      value={value}
      maxValue={GAUGE_CONSTANTS.OIL_TEMPERATURE.MAX}
      minValue={GAUGE_CONSTANTS.OIL_TEMPERATURE.MIN}
      warningThreshold={GAUGE_CONSTANTS.OIL_TEMPERATURE.WARNING}
      dangerThreshold={GAUGE_CONSTANTS.OIL_TEMPERATURE.DANGER}
      unit="°C"
      label={displayLabel}
      size={size}
      accentColor={currentColor}
      warningColor={COLORS.ORANGE}
      dangerColor={COLORS.RED}
      showNeedle={true}
      showTicks={true}
      tickInterval={{ major: 30, minor: 10 }}
      formatValue={(v) => v.toFixed(0)}
      className="oil-temperature-gauge"
    >
      {/* Sensor Badge */}
      {sensorId > 1 && (
        <div className="gauge-sensor-badge">T{sensorId}</div>
      )}
      
      {/* Temperatur Icon */}
      <div 
        className="gauge-motor-badge" 
        style={{ 
          color: currentColor,
          fontSize: size === 'small' ? '12px' : size === 'medium' ? '16px' : '20px',
        }}
      >
        {isCold ? '❄️' : value >= GAUGE_CONSTANTS.OIL_TEMPERATURE.DANGER ? '🔥' : '🌡️'}
      </div>

      {/* Zusatzinfo für größere Gauges */}
      {size !== 'small' && (
        <div 
          style={{
            position: 'absolute',
            bottom: size === 'large' ? '45px' : '35px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: size === 'large' ? '12px' : '8px',
            fontSize: size === 'large' ? '10px' : '8px',
            color: 'var(--text-dim)',
          }}
        >
          <span style={{ color: isCold ? COLORS.BLUE : 'inherit' }}>
            {isCold ? 'KALT' : value >= GAUGE_CONSTANTS.OIL_TEMPERATURE.WARNING ? 'HEISS' : 'OK'}
          </span>
        </div>
      )}
    </BaseGauge>
  );
};

export default OilTemperatureGauge;


