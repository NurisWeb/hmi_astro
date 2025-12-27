// ============================================
// SensorPanel - Sensorwerte-Anzeige
// ============================================

import React from 'react';
import './menu.css';

interface Sensor {
  name: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'danger';
}

interface SensorPanelProps {
  sensors: Sensor[];
}

const SensorPanel: React.FC<SensorPanelProps> = ({ sensors }) => {
  return (
    <div className="sensor-grid">
      {sensors.map((sensor, index) => (
        <div
          key={index}
          className={`sensor-card ${sensor.status}`}
        >
          <div className="sensor-name">{sensor.name}</div>
          <div className="sensor-value">
            {typeof sensor.value === 'number' 
              ? sensor.value.toFixed(1) 
              : sensor.value}
          </div>
          <div className="sensor-unit">{sensor.unit}</div>
        </div>
      ))}
    </div>
  );
};

export default SensorPanel;

