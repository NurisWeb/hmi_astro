// ============================================
// BlankState - Ansicht wenn nicht verbunden
// Großer CTA-Button zentriert auf dem Dashboard
// ============================================

import React from 'react';
import type { BlankStateProps } from './types';

/**
 * BlankState wird angezeigt wenn keine Verbindung besteht
 * 
 * - Zentrierter, großer Button (touch-freundlich)
 * - Während Verbindung: Ladeanimation
 * - Bei Fehler: Fehlermeldung mit Retry
 */
const BlankState: React.FC<BlankStateProps> = ({
  status,
  onVerbinden,
  fortschritt,
  fehler,
}) => {
  // Render: Nicht verbunden - CTA Button
  const renderGetrennt = () => (
    <div className="blankstate-content">
      <div className="blankstate-icon">📶</div>
      <h2 className="blankstate-title">Verbindung aufbauen</h2>
      <p className="blankstate-subtitle">
        Klicken um Prüfstand zu verbinden
      </p>
      <button 
        className="blankstate-button"
        onClick={onVerbinden}
      >
        <span className="blankstate-button-text">Jetzt verbinden</span>
      </button>
    </div>
  );

  // Render: Verbindung wird hergestellt
  const renderVerbindet = () => (
    <div className="blankstate-content blankstate-content--loading">
      <div className="blankstate-icon blankstate-icon--loading">
        <div className="blankstate-spinner"></div>
      </div>
      <h2 className="blankstate-title">Verbindung wird hergestellt</h2>
      <p className="blankstate-subtitle blankstate-subtitle--loading">
        Bitte warten<span className="loading-dots"></span>
      </p>
      
      {/* Fortschrittsbalken wenn vorhanden */}
      {typeof fortschritt === 'number' && (
        <div className="blankstate-progress">
          <div className="blankstate-progress-bar">
            <div 
              className="blankstate-progress-fill"
              style={{ width: `${fortschritt}%` }}
            />
          </div>
          <span className="blankstate-progress-text">{fortschritt}%</span>
        </div>
      )}
    </div>
  );

  // Render: Fehler aufgetreten
  const renderFehler = () => (
    <div className="blankstate-content blankstate-content--error">
      <div className="blankstate-icon blankstate-icon--error">⚠️</div>
      <h2 className="blankstate-title blankstate-title--error">Verbindung fehlgeschlagen</h2>
      <p className="blankstate-subtitle blankstate-subtitle--error">
        {fehler || 'Unbekannter Fehler'}
      </p>
      <button 
        className="blankstate-button blankstate-button--retry"
        onClick={onVerbinden}
      >
        <span className="blankstate-button-icon">🔄</span>
        <span className="blankstate-button-text">Erneut versuchen</span>
      </button>
    </div>
  );

  // Status === 'verbunden' sollte BlankState nicht angezeigt werden
  // Das wird durch das Parent-Component gesteuert
  
  return (
    <div className="blankstate">
      {fehler 
        ? renderFehler() 
        : status === 'verbindet' 
        ? renderVerbindet() 
        : renderGetrennt()
      }
    </div>
  );
};

export default BlankState;
