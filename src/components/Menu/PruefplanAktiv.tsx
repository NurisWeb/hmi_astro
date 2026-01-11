// ============================================
// PruefplanAktiv - Zeigt aktiven Prüfplan mit Schritten
// Mit Animationen für Einblenden der Schritte
// ============================================

import React from 'react';
import type { Pruefplan } from '../../types/menu.types';
import PruefschrittItem from './PruefschrittItem';
import './menu.css';

interface PruefplanAktivProps {
  pruefplan: Pruefplan;
  aktiverSchrittIndex: number;
  onZurueck: () => void;
  onSchrittKlick?: (schrittIndex: number) => void;
  simulationLaeuft?: boolean;
  onSimulationStarten?: () => void;
}

const PruefplanAktiv: React.FC<PruefplanAktivProps> = ({
  pruefplan,
  aktiverSchrittIndex,
  onZurueck,
  onSchrittKlick,
  simulationLaeuft = false,
  onSimulationStarten,
}) => {
  // Zähle abgeschlossene Schritte für Fortschrittsanzeige
  const abgeschlosseneSchritte = pruefplan.schritte.filter(
    (s) => s.status === 'abgeschlossen'
  ).length;

  return (
    <div className="pruefplan-aktiv animate-fade-in">
      <div className="pruefplan-aktiv-header animate-slide-down">
        <button 
          className="pruefplan-zurueck-btn"
          onClick={onZurueck}
          title="Zurück zur Übersicht"
          disabled={simulationLaeuft}
        >
          ◀
        </button>
        <div 
          className="pruefplan-aktiv-titel"
          onClick={!simulationLaeuft ? onZurueck : undefined}
          style={{ cursor: simulationLaeuft ? 'default' : 'pointer' }}
        >
          {pruefplan.name}
        </div>
        <div className="pruefplan-aktiv-fortschritt">
          {abgeschlosseneSchritte} / {pruefplan.schritte.length}
        </div>
        
        {/* Test-Button für Simulation */}
        {onSimulationStarten && (
          <button
            className="test-btn"
            onClick={onSimulationStarten}
            disabled={simulationLaeuft}
            title="Startet Test-Simulation"
          >
            {simulationLaeuft ? '⏳ Läuft...' : '▶ TEST'}
          </button>
        )}
      </div>
      
      <div className="pruefplan-schritte-liste">
        {pruefplan.schritte.map((schritt, index) => (
          <PruefschrittItem
            key={schritt.id}
            schritt={schritt}
            istAktiv={index === aktiverSchrittIndex && schritt.status === 'aktiv'}
            index={index}
            onClick={() => onSchrittKlick?.(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default PruefplanAktiv;
