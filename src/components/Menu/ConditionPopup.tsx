// ============================================
// ConditionPopup - Modal für Condition-Nachrichten
// Blockiert Hintergrund, nur ein Button zum Bestätigen
// ============================================

import React from 'react';
import './menu.css';

interface ConditionPopupProps {
  sichtbar: boolean;
  nachricht: string;
  onBestaetigen: () => void;
}

const ConditionPopup: React.FC<ConditionPopupProps> = ({
  sichtbar,
  nachricht,
  onBestaetigen,
}) => {
  if (!sichtbar) return null;

  return (
    <div className="condition-overlay">
      <div className="condition-popup">
        <div className="condition-header">
          <span className="condition-icon">⚠️</span>
          <span className="condition-titel">Hinweis</span>
        </div>
        
        <div className="condition-nachricht">
          {nachricht}
        </div>
        
        <button 
          className="condition-btn"
          onClick={onBestaetigen}
        >
          Zur Kenntnis genommen
        </button>
      </div>
    </div>
  );
};

export default ConditionPopup;
