// ============================================
// GaugeGrid - Container für alle Gauges
// ============================================

import React from 'react';
import RPMGauge from './RPMGauge';
import OilPressureGauge from './OilPressureGauge';
import BrakeMotorGauge from './BrakeMotorGauge';
import OilTemperatureGauge from './OilTemperatureGauge';
import FlowRateGauge from './FlowRateGauge';
import type { DashboardData, GaugeSize } from '../../types/dashboard.types';
import './GaugeGrid.css';

interface GaugeGridProps {
  data: DashboardData;
  isCompact: boolean;
}

const GaugeGrid: React.FC<GaugeGridProps> = ({ data, isCompact }) => {
  const gaugeSize: GaugeSize = isCompact ? 'small' : 'medium';
  const rpmSize: GaugeSize = isCompact ? 'small' : 'large';

  return (
    <div className={`gauge-grid ${isCompact ? 'compact' : 'expanded'}`}>
      <div className="gauge-grid-item rpm">
        <RPMGauge
          value={data.rpm}
          size={rpmSize}
          gear={data.gear}
        />
      </div>

      <div className="gauge-grid-item oil1">
        <OilPressureGauge
          value={data.oilPressures[0]}
          size={gaugeSize}
          sensorId={1}
        />
      </div>
      <div className="gauge-grid-item oil2">
        <OilPressureGauge
          value={data.oilPressures[1]}
          size={gaugeSize}
          sensorId={2}
        />
      </div>
      <div className="gauge-grid-item oil3">
        <OilPressureGauge
          value={data.oilPressures[2]}
          size={gaugeSize}
          sensorId={3}
        />
      </div>
      <div className="gauge-grid-item oil4">
        <OilPressureGauge
          value={data.oilPressures[3]}
          size={gaugeSize}
          sensorId={4}
        />
      </div>

      <div className="gauge-grid-item motor1">
        <BrakeMotorGauge
          value={data.brakeMotors.motor1.torque}
          size={gaugeSize}
          motorId={1}
        />
      </div>
      <div className="gauge-grid-item motor2">
        <BrakeMotorGauge
          value={data.brakeMotors.motor2.torque}
          size={gaugeSize}
          motorId={2}
        />
      </div>

      {/* Öltemperatur Gauge */}
      <div className="gauge-grid-item oiltemp">
        <OilTemperatureGauge
          value={data.oilTemperature}
          size={gaugeSize}
        />
      </div>
      
      {/* Durchfluss Gauge */}
      <div className="gauge-grid-item flowrate">
        <FlowRateGauge
          value={data.flowRate}
          size={gaugeSize}
        />
      </div>
    </div>
  );
};

export default GaugeGrid;
