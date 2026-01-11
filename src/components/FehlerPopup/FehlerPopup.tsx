// components/FehlerPopup/FehlerPopup.tsx
// Fehler-Anzeige Komponente

import type { FehlerTyp } from '../../services/errorHandler';
import './FehlerPopup.css';

interface FehlerPopupProps {
  sichtbar: boolean;
  nachricht: string;
  typ: FehlerTyp;
  onSchliessen: () => void;
  onRetry?: () => void;
}

export const FehlerPopup = ({ 
  sichtbar, 
  nachricht, 
  typ, 
  onSchliessen,
  onRetry,
}: FehlerPopupProps) => {
  
  if (!sichtbar) return null;
  
  const getIcon = () => {
    switch (typ) {
      case 'KRITISCH': return '🚨';
      case 'FEHLER': return '⚠️';
      case 'WARNUNG': return '⚡';
    }
  };
  
  const getTitel = () => {
    switch (typ) {
      case 'KRITISCH': return 'Kritischer Fehler';
      case 'FEHLER': return 'Fehler';
      case 'WARNUNG': return 'Warnung';
    }
  };
  
  return (
    <div className="fehler-overlay">
      <div className={`fehler-popup fehler-${typ.toLowerCase()}`}>
        <div className="fehler-icon">{getIcon()}</div>
        
        <h3 className="fehler-titel">{getTitel()}</h3>
        
        <p className="fehler-nachricht">{nachricht}</p>
        
        {typ === 'KRITISCH' && (
          <p className="fehler-hinweis">
            Das System führt einen Soft-Aus durch.
          </p>
        )}
        
        <div className="fehler-buttons">
          {onRetry && typ !== 'KRITISCH' && (
            <button className="fehler-btn retry" onClick={onRetry}>
              🔄 Erneut versuchen
            </button>
          )}
          <button className="fehler-btn schliessen" onClick={onSchliessen}>
            Verstanden
          </button>
        </div>
      </div>
    </div>
  );
};
