// ============================================
// BrakeMotorGauge - Bremsleistung
// Main_Doku.json: 0-6 KW (grün 0-2, orange 2-4, rot 4-6)
// ============================================

import React from 'react';
import BaseGauge from './BaseGauge';
import type { GaugeSize } from '../../types/dashboard.types';
import { GAUGE_CONSTANTS, COLORS } from '../../types/dashboard.types';

interface BrakeMotorGaugeProps {
  value: number;  // Wert in KW
  size: GaugeSize;
  motorId: 1 | 2;
  label?: string;
}

const BrakeMotorGauge: React.FC<BrakeMotorGaugeProps> = ({
  value,
  size,
  motorId,
  label,
}) => {
  const displayLabel = label || `Bremsmotor M${motorId}`;
  
  const accentColor = motorId === 1 ? COLORS.CYAN : COLORS.PURPLE;

  // Farbe basierend auf Wert (Main_Doku.json Bereiche)
  const getColor = () => {
    if (value >= GAUGE_CONSTANTS.BRAKE_KW.DANGER) return COLORS.RED;
    if (value >= GAUGE_CONSTANTS.BRAKE_KW.WARNING) return COLORS.ORANGE;
    return COLORS.GREEN;
  };

  const loadPercent = (value / GAUGE_CONSTANTS.BRAKE_KW.MAX) * 100;

  return (
    <BaseGauge
      value={value}
      maxValue={GAUGE_CONSTANTS.BRAKE_KW.MAX}
      minValue={0}
      warningThreshold={GAUGE_CONSTANTS.BRAKE_KW.WARNING}
      dangerThreshold={GAUGE_CONSTANTS.BRAKE_KW.DANGER}
      unit="kW"
      label={displayLabel}
      size={size}
      accentColor={getColor()}
      warningColor={COLORS.ORANGE}
      dangerColor={COLORS.RED}
      showNeedle={true}
      showTicks={true}
      tickInterval={{ major: 2, minor: 1 }}
      formatValue={(v) => v.toFixed(1)}
      className="brake-motor-gauge"
    >
      <div 
        className="gauge-motor-badge" 
        style={{ 
          color: getColor()
        }}
      >
        M{motorId}
      </div>

      {size !== 'small' && (
        <div 
          style={{
            position: 'absolute',
            bottom: size === 'large' ? '45px' : '35px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: size === 'large' ? '16px' : '10px',
            fontSize: size === 'large' ? '11px' : '9px',
            color: 'var(--text-dim)',
          }}
        >
          <span>
            <strong style={{ color: getColor() }}>{value.toFixed(1)}</strong> kW
          </span>
          <span>
            <strong style={{ color: 'var(--text-secondary)' }}>{loadPercent.toFixed(0)}</strong>%
          </span>
        </div>
      )}
    </BaseGauge>
  );
};

export default BrakeMotorGauge;
