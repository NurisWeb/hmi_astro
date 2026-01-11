// ============================================
// StatusBar - Kompakte einzeilige Status-Anzeige
// Nur für Panel-Kontexte (Gang, Prüfpläne)
// ============================================

import React from 'react';
import './StatusLog.css';

export type StatusTyp = 'info' | 'warnung' | 'erfolg' | 'fehler';

export interface StatusBarProps {
  nachricht: string;
  typ?: StatusTyp;
  sichtbar?: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({
  nachricht,
  typ = 'info',
  sichtbar = true,
}) => {
  if (!sichtbar || !nachricht) {
    return null;
  }

  // Icon nach Typ (IEC 60073 Farbcodierung)
  const getIcon = (): string => {
    switch (typ) {
      case 'info': return 'ℹ️';
      case 'warnung': return '⚠️';
      case 'erfolg': return '✅';
      case 'fehler': return '❌';
    }
  };

  return (
    <div className={`status-bar status-bar--${typ}`}>
      <span className="status-bar__icon">{getIcon()}</span>
      <span className="status-bar__nachricht">{nachricht}</span>
    </div>
  );
};

export default StatusBar;
