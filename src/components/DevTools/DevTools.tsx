// components/DevTools/DevTools.tsx
// Developer-Tools für Testing (nur in Development)

import { useState } from 'react';
import { setSimulateConnectionError, resetIsAlive } from '../../services/mockBackend/endpoints/isalive';
import { resetHandshake } from '../../services/mockBackend/endpoints/handshake';
import { resetCommandState, getCommandState } from '../../services/mockBackend/endpoints/commands';
import { resetTelemetrie } from '../../services/mockBackend/data/telemetrieData';
import './DevTools.css';

export const DevTools = () => {
  const [sichtbar, setSichtbar] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  
  // In Production nicht anzeigen
  const isProd = typeof import.meta !== 'undefined' && import.meta.env?.PROD;
  if (isProd) return null;
  
  const toggleConnectionError = (value: boolean) => {
    setSimulateConnectionError(value);
    setConnectionError(value);
  };
  
  const resetAlles = () => {
    resetIsAlive();
    resetHandshake();
    resetCommandState();
    resetTelemetrie();
    setConnectionError(false);
  };
  
  const state = getCommandState();
  
  return (
    <>
      {/* Toggle-Button */}
      <button 
        className="devtools-toggle"
        onClick={() => setSichtbar(!sichtbar)}
        title="Developer Tools"
      >
        🛠️
      </button>
      
      {/* Panel */}
      {sichtbar && (
        <div className="devtools-panel">
          <div className="devtools-header">
            <span>🛠️ Dev Tools</span>
            <button onClick={() => setSichtbar(false)}>✕</button>
          </div>
          
          {/* Status */}
          <div className="devtools-section">
            <h4>Status</h4>
            <div className="devtools-status">
              <span>Manual Mode:</span>
              <span className={state.manualModeAktiv ? 'aktiv' : 'inaktiv'}>
                {state.manualModeAktiv ? 'Aktiv' : 'Inaktiv'}
              </span>
            </div>
            <div className="devtools-status">
              <span>Gang:</span>
              <span>{state.aktuellerGang}</span>
            </div>
            <div className="devtools-status">
              <span>Drehzahl:</span>
              <span>{state.aktuelleDrehzahl} U/min</span>
            </div>
          </div>
          
          {/* Verbindung */}
          <div className="devtools-section">
            <h4>Verbindung</h4>
            <button 
              className={connectionError ? 'active' : ''}
              onClick={() => toggleConnectionError(!connectionError)}
            >
              {connectionError ? '✅ Fehler beenden' : '⚠️ Netzwerkfehler'}
            </button>
          </div>
          
          {/* Aktionen */}
          <div className="devtools-section">
            <h4>Aktionen</h4>
            <button onClick={resetAlles}>
              🔄 Alles zurücksetzen
            </button>
            <button onClick={() => window.location.reload()}>
              🔃 Seite neu laden
            </button>
          </div>
        </div>
      )}
    </>
  );
};
