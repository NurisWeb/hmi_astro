// ============================================
// BrakeMotorGauge - Bremsmotor Drehmoment (0-1500 Nm)
// ============================================

import React from 'react';
import BaseGauge from './BaseGauge';
import type { GaugeSize } from '../../types/dashboard.types';
import { GAUGE_CONSTANTS, COLORS } from '../../types/dashboard.types';

interface BrakeMotorGaugeProps {
  value: number;
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

  const warningThreshold = GAUGE_CONSTANTS.BRAKE_MOTOR.MAX_TORQUE * 
    (GAUGE_CONSTANTS.BRAKE_MOTOR.WARNING_PERCENT / 100);
  const dangerThreshold = GAUGE_CONSTANTS.BRAKE_MOTOR.MAX_TORQUE * 
    (GAUGE_CONSTANTS.BRAKE_MOTOR.DANGER_PERCENT / 100);

  const kw = (value * GAUGE_CONSTANTS.BRAKE_MOTOR.MOTOR_RPM) / 9549;
  const loadPercent = (value / GAUGE_CONSTANTS.BRAKE_MOTOR.MAX_TORQUE) * 100;

  return (
    <BaseGauge
      value={value}
      maxValue={GAUGE_CONSTANTS.BRAKE_MOTOR.MAX_TORQUE}
      minValue={0}
      warningThreshold={warningThreshold}
      dangerThreshold={dangerThreshold}
      unit="Nm"
      label={displayLabel}
      size={size}
      accentColor={accentColor}
      warningColor={COLORS.ORANGE}
      dangerColor={COLORS.RED}
      showNeedle={true}
      showTicks={true}
      tickInterval={{ major: 300, minor: 150 }}
      formatValue={(v) => Math.round(v).toString()}
      className="brake-motor-gauge"
    >
      <div 
        className="gauge-motor-badge" 
        style={{ 
          color: value >= dangerThreshold ? COLORS.RED : 
                 value >= warningThreshold ? COLORS.ORANGE : accentColor 
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
            <strong style={{ color: accentColor }}>{kw.toFixed(1)}</strong> kW
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
