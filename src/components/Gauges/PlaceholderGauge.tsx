// ============================================
// PlaceholderGauge - Platzhalter für zukünftige Gauges
// ============================================

import React from 'react';
import type { GaugeSize } from '../../types/dashboard.types';
import './gauges.css';

interface PlaceholderGaugeProps {
  label: string;
  size: GaugeSize;
  id?: string;
}

const PlaceholderGauge: React.FC<PlaceholderGaugeProps> = ({
  label,
  size,
  id,
}) => {
  return (
    <div className={`gauge-container gauge-placeholder ${size}`} id={id}>
      <div className="gauge-placeholder-icon">📊</div>
      <div className="gauge-placeholder-text">{label}</div>
    </div>
  );
};

export default PlaceholderGauge;
