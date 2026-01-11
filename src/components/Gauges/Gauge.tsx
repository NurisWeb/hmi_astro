// ============================================
// Gauge - Einfache Gauge mit green/orange/red Bereichen
// Verwendet die Konfiguration aus Main_Doku.json
// ============================================

import React from 'react';
import BaseGauge from './BaseGauge';
import type { GaugeSize } from '../../types/dashboard.types';
import type { ParameterConfig } from '../../services/mockBackend/data/telemetrieData';

interface GaugeProps {
  wert: number;
  config: ParameterConfig;
  size?: GaugeSize;
  showTicks?: boolean;
}

// Farben
const COLORS = {
  green: '#4CAF50',
  orange: '#FF9800',
  red: '#F44336',
  cyan: '#00BCD4',
  purple: '#9C27B0',
};

// Farben basierend auf Parameter-ID
const getAccentColor = (id: string): string => {
  if (id.includes('oeldruck')) return COLORS.cyan;
  if (id.includes('drehzahl') || id.includes('antrieb')) return COLORS.green;
  if (id.includes('temp')) return COLORS.orange;
  if (id.includes('auslastung')) return COLORS.purple;
  return COLORS.cyan;
};

// Tick-Intervalle basierend auf Bereich
const getTickInterval = (max: number): { major: number; minor: number } => {
  if (max <= 10) return { major: 2, minor: 1 };
  if (max <= 100) return { major: 20, minor: 10 };
  if (max <= 200) return { major: 50, minor: 25 };
  if (max <= 1000) return { major: 200, minor: 100 };
  if (max <= 4000) return { major: 1000, minor: 500 };
  return { major: 1000, minor: 500 };
};

const Gauge: React.FC<GaugeProps> = ({ 
  wert, 
  config,
  size = 'medium',
  showTicks = true,
}) => {
  const { min, max, orange, red, name, unit } = config;
  
  // Warning = Beginn des Orange-Bereichs
  // Danger = Beginn des Rot-Bereichs
  const warningThreshold = orange[0];
  const dangerThreshold = red[0];
  
  const accentColor = getAccentColor(config.id);
  const tickInterval = getTickInterval(max);
  
  return (
    <BaseGauge
      value={wert}
      maxValue={max}
      minValue={min}
      warningThreshold={warningThreshold}
      dangerThreshold={dangerThreshold}
      unit={unit}
      label={name}
      size={size}
      accentColor={accentColor}
      warningColor={COLORS.orange}
      dangerColor={COLORS.red}
      showNeedle={true}
      showTicks={showTicks}
      tickInterval={tickInterval}
      formatValue={(v) => v >= 100 ? Math.round(v).toString() : v.toFixed(1)}
    />
  );
};

export default Gauge;
