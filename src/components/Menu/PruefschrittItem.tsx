// ============================================
// PruefschrittItem - Einzelner Prüfschritt mit Animation
// ============================================

import React from 'react';
import type { Pruefschritt } from '../../types/menu.types';
import LoadingDots from './LoadingDots';
import './menu.css';

interface PruefschrittItemProps {
  schritt: Pruefschritt;
  istAktiv: boolean;
  index: number;
  onClick?: () => void;
}

const PruefschrittItem: React.FC<PruefschrittItemProps> = ({
  schritt,
  istAktiv,
  index,
  onClick,
}) => {
  const getStatusKlasse = () => {
    if (istAktiv) return 'aktiv';
    switch (schritt.status) {
      case 'abgeschlossen': return 'abgeschlossen';
      case 'aktiv': return 'aktiv';
      default: return 'wartend';
    }
  };

  const getStatusText = () => {
    if (istAktiv) return 'Aktiv';
    switch (schritt.status) {
      case 'abgeschlossen': return '✓';
      case 'aktiv': return 'Aktiv';
      default: return '';
    }
  };

  // Animation delay basierend auf Index (gestaffeltes Einblenden)
  const animationDelay = `${index * 50}ms`;

  return (
    <div
      className={`pruefschritt-item ${getStatusKlasse()}`}
      onClick={onClick}
      style={{ animationDelay }}
    >
      <div className="pruefschritt-nummer">{schritt.nummer}</div>
      <div className="pruefschritt-bezeichnung">
        {istAktiv && <span className="pruefschritt-marker">▶</span>}
        {schritt.bezeichnung}
        {istAktiv && <LoadingDots />}
      </div>
      <div className="pruefschritt-status">{getStatusText()}</div>
    </div>
  );
};

export default PruefschrittItem;
