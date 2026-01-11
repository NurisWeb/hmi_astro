// ============================================
// ParameterBar - Subtile Parameter-Leiste unter dem Header
// Zeigt: Laufzeit, Öl-Temperatur, Gang
// ============================================

import React from 'react';
import type { GearPosition } from '../../types/dashboard.types';

interface ParameterBarProps {
  runtime?: number;              // Sekunden seit Verbindung (optional)
  runtimeFormatted?: string;     // Alternativ: bereits formatierte Laufzeit
  oilTemperature: number;        // Öl-Temperatur in °C
  activeGear: GearPosition;      // Aktuell eingelegter Gang
  isConnected: boolean;          // Verbindungsstatus
}

const ParameterBar: React.FC<ParameterBarProps> = ({
  runtime,
  runtimeFormatted,
  oilTemperature,
  activeGear,
  isConnected,
}) => {
  // Laufzeit formatieren: HH:MM:SS
  const formatRuntime = (seconds: number): string => {
    if (!isConnected) return '--:--:--';
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Laufzeit-Anzeige: formatiert hat Vorrang
  const displayRuntime = runtimeFormatted || (runtime !== undefined ? formatRuntime(runtime) : '--:--:--');

  // Öl-Temperatur Status für Farbgebung
  const getTemperatureStatus = (temp: number): 'cold' | 'normal' | 'warning' | 'danger' => {
    if (temp < 40) return 'cold';
    if (temp < 100) return 'normal';
    if (temp < 120) return 'warning';
    return 'danger';
  };

  const tempStatus = getTemperatureStatus(oilTemperature);

  return (
    <div className="parameter-bar">
      {/* Laufzeit */}
      <div className="parameter-item">
        <span className="parameter-icon">⏱</span>
        <span className="parameter-label">Laufzeit:</span>
        <span className="parameter-value parameter-value--runtime">
          {displayRuntime}
        </span>
      </div>

      <div className="parameter-divider" />

      {/* Öl-Temperatur */}
      <div className="parameter-item">
        <span className="parameter-icon">🌡</span>
        <span className="parameter-label">Öl-Temp:</span>
        <span className={`parameter-value parameter-value--temp parameter-value--${tempStatus}`}>
          {isConnected ? `${oilTemperature.toFixed(0)}°C` : '--°C'}
        </span>
      </div>

      <div className="parameter-divider" />

      {/* Gang */}
      <div className="parameter-item">
        <span className="parameter-icon">⚙</span>
        <span className="parameter-label">Gang:</span>
        <span className="parameter-value parameter-value--gear">
          {isConnected ? activeGear : '-'}
        </span>
      </div>
    </div>
  );
};

export default ParameterBar;
