// ============================================
// FlowRateGauge - Durchflussanzeige (0-50 L/min)
// ============================================

import React from 'react';
import BaseGauge from './BaseGauge';
import type { GaugeSize } from '../../types/dashboard.types';
import { GAUGE_CONSTANTS, COLORS } from '../../types/dashboard.types';

interface FlowRateGaugeProps {
  value: number;
  size: GaugeSize;
  sensorId?: number;
  label?: string;
}

const FlowRateGauge: React.FC<FlowRateGaugeProps> = ({
  value,
  size,
  sensorId = 1,
  label,
}) => {
  const displayLabel = label || `Durchfluss${sensorId > 1 ? ` F${sensorId}` : ''}`;
  
  // Durchfluss-Status
  const isLow = value < GAUGE_CONSTANTS.FLOW_RATE.LOW;
  const isWarning = value >= GAUGE_CONSTANTS.FLOW_RATE.WARNING;
  const isDanger = value >= GAUGE_CONSTANTS.FLOW_RATE.DANGER;

  // Farbe basierend auf Durchfluss
  const getFlowColor = () => {
    if (isLow) return COLORS.AMBER; // Zu niedriger Durchfluss ist auch problematisch
    if (isDanger) return COLORS.RED;
    if (isWarning) return COLORS.ORANGE;
    return COLORS.CYAN;
  };

  return (
    <BaseGauge
      value={value}
      maxValue={GAUGE_CONSTANTS.FLOW_RATE.MAX}
      minValue={0}
      warningThreshold={GAUGE_CONSTANTS.FLOW_RATE.WARNING}
      dangerThreshold={GAUGE_CONSTANTS.FLOW_RATE.DANGER}
      unit="L/min"
      label={displayLabel}
      size={size}
      accentColor={getFlowColor()}
      warningColor={COLORS.ORANGE}
      dangerColor={COLORS.RED}
      showNeedle={true}
      showTicks={true}
      tickInterval={{ major: 10, minor: 5 }}
      formatValue={(v) => v.toFixed(1)}
      className="flow-rate-gauge"
    >
      {/* Sensor Badge */}
      {sensorId > 1 && (
        <div className="gauge-sensor-badge">F{sensorId}</div>
      )}
      
      {/* Flow Icon */}
      <div 
        className="gauge-motor-badge" 
        style={{ 
          color: getFlowColor(),
          fontSize: size === 'small' ? '12px' : size === 'medium' ? '16px' : '20px',
        }}
      >
        💧
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
          <span style={{ color: isLow ? COLORS.AMBER : isDanger ? COLORS.RED : 'inherit' }}>
            {isLow ? 'NIEDRIG' : isDanger ? 'HOCH' : 'NORMAL'}
          </span>
        </div>
      )}
    </BaseGauge>
  );
};

export default FlowRateGauge;





