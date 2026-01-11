// ============================================
// PruefplanListe - Zeigt alle verfügbaren Prüfpläne
// Mit Animationen für Einblenden
// ============================================

import React from 'react';
import type { Pruefplan } from '../../types/menu.types';
import './menu.css';

interface PruefplanListeProps {
  pruefplaene: Pruefplan[];
  onPlanAuswaehlen: (plan: Pruefplan) => void;
}

const PruefplanListe: React.FC<PruefplanListeProps> = ({
  pruefplaene,
  onPlanAuswaehlen,
}) => {
  return (
    <div className="pruefplan-liste animate-fade-in">
      {pruefplaene.map((plan, index) => (
        <div
          key={plan.id}
          className="pruefplan-liste-item"
          onClick={() => onPlanAuswaehlen(plan)}
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <div className="pruefplan-liste-info">
            <div className="pruefplan-liste-name">{plan.name}</div>
            <div className="pruefplan-liste-schritte">
              {plan.schritte.length} Schritte
            </div>
          </div>
          <div className="pruefplan-liste-pfeil">▶</div>
        </div>
      ))}
    </div>
  );
};

export default PruefplanListe;
