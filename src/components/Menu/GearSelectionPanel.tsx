// ============================================
// GearSelectionPanel - Manuelle Gangauswahl vom SIM-Gang DSG
// Mit API-Integration und Fehlerbehandlung
// ============================================

import React, { useState, useEffect } from 'react';
import './menu.css';
import {
  startManual,
  stopManual,
  setGear,
  setMotorFrequenz,
  cmdStop,
  pruefeAntwort,
} from '../../services/ManuelleSteuerungApi';

// Types
type Gang = 'N' | 'R' | 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface GearSelectionPanelProps {
  onPanelSchliessen?: () => void;
  onGangGeaendert?: (gang: string) => void; // Callback für dsgState-Synchronisation
}

// ============================================
// Drehzahl-Regler Komponente
// ============================================
interface DrehzahlReglerProps {
  wert: number;
  onChange: (neuerWert: number) => void;
  onFertig: () => void;
  disabled: boolean;
}

const DrehzahlRegler = ({ wert, onChange, onFertig, disabled }: DrehzahlReglerProps) => {
  const prozent = (wert / 3530) * 100;
  const markierungen = [0, 1000, 2000, 3000, 3530];
  
  return (
    <div className="drehzahl-regler-section">
      <div className="manuell-section-title">Drehzahl</div>
      
      <div className="drehzahl-slider-container">
        <div className="drehzahl-slider-track">
          <div 
            className="drehzahl-slider-fill" 
            style={{ width: `${prozent}%` }}
          />
        </div>
        
        <input
          type="range"
          className="drehzahl-slider"
          min={0}
          max={3530}
          step={10}
          value={wert}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseUp={onFertig}
          onTouchEnd={onFertig}
          disabled={disabled}
        />
        
        <div className="drehzahl-markierungen">
          {markierungen.map((mark) => (
            <span 
              key={mark} 
              className={`drehzahl-mark ${wert >= mark ? 'aktiv' : ''}`}
              style={{ left: `${(mark / 3530) * 100}%` }}
            >
              {mark}
            </span>
          ))}
        </div>
      </div>
      
      <div className="drehzahl-anzeige">
        <span className="drehzahl-wert">{wert}</span>
        <span>U/min</span>
      </div>
    </div>
  );
};

// ============================================
// Gang-Button Komponente
// ============================================
interface GangButtonProps {
  gang: Gang;
  ausgewaehlt: boolean;
  disabled: boolean;
  onClick: () => void;
}

const GangButton = ({ gang, ausgewaehlt, disabled, onClick }: GangButtonProps) => {
  const klassen = [
    'manuell-gang-btn',
    ausgewaehlt ? 'aktiv' : '',
    disabled ? 'disabled' : '',
  ].filter(Boolean).join(' ');
  
  return (
    <button
      className={klassen}
      onClick={onClick}
      disabled={disabled}
    >
      {gang}
    </button>
  );
};

// ============================================
// Gang-Buttons Container
// ============================================
interface GangButtonsProps {
  ausgewaehlterGang: Gang | null;
  onGangWaehlen: (gang: Gang) => void;
  disabled: boolean;
}

const GangButtons = ({ ausgewaehlterGang, onGangWaehlen, disabled }: GangButtonsProps) => {
  // Alle Gänge auf einer Zeile: N, R, 1-7
  const alleGaenge: Gang[] = ['N', 'R', 1, 2, 3, 4, 5, 6, 7];
  
  return (
    <div className="gang-buttons-section">
      <div className="manuell-section-title">Gänge</div>
      
      <div className="gang-reihe alle">
        {alleGaenge.map((gang) => (
          <GangButton
            key={gang}
            gang={gang}
            ausgewaehlt={ausgewaehlterGang === gang}
            disabled={disabled}
            onClick={() => onGangWaehlen(gang)}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================
// Status-Anzeige Komponente
// ============================================
interface StatusAnzeigeProps {
  wartAufAntwort: boolean;
  statusLog: string;
  typ: 'info' | 'erfolg' | 'warten' | 'fehler';
}

const StatusAnzeige = ({ wartAufAntwort, statusLog, typ }: StatusAnzeigeProps) => {
  const klasse = `manuell-status-log ${typ}`;
  
  return (
    <div className={klasse}>
      {wartAufAntwort && <span className="spinner-klein" />}
      {typ === 'erfolg' && '✅ '}
      {typ === 'info' && 'ℹ️ '}
      {typ === 'warten' && '⏳ '}
      {typ === 'fehler' && '❌ '}
      {statusLog}
    </div>
  );
};

// ============================================
// Fehler-Popup Komponente
// ============================================
interface FehlerPopupProps {
  nachricht: string;
  onSchliessen: () => void;
}

const FehlerPopup = ({ nachricht, onSchliessen }: FehlerPopupProps) => {
  return (
    <div className="fehler-popup-overlay">
      <div className="fehler-popup">
        <h3>⚠️ Fehler</h3>
        <p>Manuelle Steuerung ist fehlgeschlagen.</p>
        <p className="fehler-details">{nachricht}</p>
        <p className="hinweis">Das System führt einen Soft-Aus durch.</p>
        
        <button 
          onClick={onSchliessen}
          className="fehler-popup-btn"
        >
          Verstanden
        </button>
      </div>
    </div>
  );
};

// ============================================
// Haupt-Panel Komponente
// ============================================
const GearSelectionPanel: React.FC<GearSelectionPanelProps> = ({
  onPanelSchliessen,
  onGangGeaendert,
}) => {
  // === STATE ===
  const [drehzahl, setDrehzahl] = useState<number>(0);
  const [ausgewaehlterGang, setAusgewaehlterGang] = useState<Gang | null>(null);
  
  // Sperr-State
  const [istGesperrt, setIstGesperrt] = useState<boolean>(false);
  const [wartAufAntwort, setWartAufAntwort] = useState<boolean>(false);
  
  // NEU: Gänge werden erst nach Backend-OK freigegeben
  const [gaengeFreigegebenVomBackend, setGaengeFreigegebenVomBackend] = useState<boolean>(false);
  
  // Status-Log
  const [statusLog, setStatusLog] = useState<string>('Initialisiere...');
  const [statusTyp, setStatusTyp] = useState<'info' | 'erfolg' | 'warten' | 'fehler'>('info');
  
  // Fehler-Popup
  const [zeigeFehlerPopup, setZeigeFehlerPopup] = useState<boolean>(false);
  const [fehlermeldung, setFehlermeldung] = useState<string>('');
  
  // Panel initialisiert?
  const [initialisiert, setInitialisiert] = useState<boolean>(false);
  
  // === BERECHNETE WERTE ===
  // Gänge sind nur freigegeben wenn:
  // 1. Backend hat OK gegeben UND
  // 2. Gerade keine Anfrage läuft
  const gaengeFreigegeben = gaengeFreigegebenVomBackend && !istGesperrt;
  const drehzahlFreigegeben = !istGesperrt && initialisiert;
  
  // === SPERR-FUNKTIONEN ===
  const sperreAlles = () => {
    setIstGesperrt(true);
    setWartAufAntwort(true);
  };
  
  const gebeAllesFrei = () => {
    setIstGesperrt(false);
    setWartAufAntwort(false);
  };
  
  // === PANEL LIFECYCLE ===
  
  // Bei Panel öffnen: startManual() aufrufen
  useEffect(() => {
    const initialisiere = async () => {
      setStatusLog('Verbinde mit Prüfstand...');
      setStatusTyp('warten');
      sperreAlles();
      
      const erfolg = await startManual();
      
      if (erfolg) {
        setStatusLog('Bereit für manuelle Steuerung');
        setStatusTyp('info');
        setInitialisiert(true);
        gebeAllesFrei();
      } else {
        await handleFehler('Manuelle Steuerung konnte nicht gestartet werden');
      }
    };
    
    initialisiere();
    
    // Cleanup bei Unmount - State wird beim nächsten Mount neu initialisiert
    return () => {
      stopManual();
    };
  }, []);
  
  // === FEHLERBEHANDLUNG ===
  const handleFehler = async (nachricht: string) => {
    console.error('Fehler in manueller Steuerung:', nachricht);
    
    // Soft-Aus senden
    await cmdStop();
    
    // Fehlermeldung anzeigen
    setFehlermeldung(nachricht);
    setZeigeFehlerPopup(true);
    setStatusLog(nachricht);
    setStatusTyp('fehler');
  };
  
  const handleFehlerPopupSchliessen = async () => {
    setZeigeFehlerPopup(false);
    
    // Alles zurücksetzen
    setDrehzahl(0);
    setAusgewaehlterGang(null);
    setIstGesperrt(false);
    setWartAufAntwort(false);
    setGaengeFreigegebenVomBackend(false);
    
    // Panel schließen
    await stopManual();
    onPanelSchliessen?.();
  };
  
  // === API-HANDLER ===
  
  // Drehzahl an Backend senden
  const sendeDrehzahl = async (frequenz: number) => {
    sperreAlles();
    setStatusLog('Drehzahl wird gesetzt...');
    setStatusTyp('warten');
    
    const response = await setMotorFrequenz(frequenz);
    const ergebnis = pruefeAntwort(response);
    
    if (ergebnis === 'ok') {
      setStatusLog(`Drehzahl auf ${frequenz} U/min gesetzt`);
      setStatusTyp('erfolg');
      
      // Gänge freigeben NUR wenn Drehzahl >= 300
      if (frequenz >= 300) {
        setGaengeFreigegebenVomBackend(true);
      } else {
        setGaengeFreigegebenVomBackend(false);
      }
      
      gebeAllesFrei();
      
    } else if (ergebnis === 'warten') {
      // Backend busy - nochmal versuchen nach kurzer Pause
      setTimeout(() => sendeDrehzahl(frequenz), 500);
      
    } else {
      await handleFehler('Drehzahl konnte nicht gesetzt werden');
    }
  };
  
  // Gang an Backend senden
  const sendeGang = async (gang: Gang) => {
    sperreAlles();
    setStatusLog(`Gang ${gang} wird eingelegt...`);
    setStatusTyp('warten');
    
    const response = await setGear(gang);
    const ergebnis = pruefeAntwort(response);
    
    if (ergebnis === 'ok') {
      setStatusLog(`Gang ${gang} eingelegt`);
      setStatusTyp('erfolg');
      gebeAllesFrei();
      
      // dsgState im Parent synchronisieren (ParameterBar + Gauges)
      onGangGeaendert?.(String(gang));
      
    } else if (ergebnis === 'warten') {
      // Backend busy - nochmal versuchen
      setTimeout(() => sendeGang(gang), 500);
      
    } else {
      await handleFehler('Gang konnte nicht eingelegt werden');
    }
  };
  
  // === UI-HANDLER ===
  
  // Drehzahl lokal ändern (bei jedem Slider-Move)
  const handleDrehzahlLokal = (neuerWert: number) => {
    setDrehzahl(neuerWert);
  };
  
  // Drehzahl fertig - wird bei "Loslassen" aufgerufen
  const handleDrehzahlFertig = () => {
    if (!initialisiert) return;
    sendeDrehzahl(drehzahl);
  };
  
  // Gang auswählen
  const handleGangWaehlen = (gang: Gang) => {
    if (!gaengeFreigegeben) return;
    setAusgewaehlterGang(gang);
    sendeGang(gang);
  };
  
  // === RENDER ===
  return (
    <div className={`manuell-panel ${istGesperrt ? 'gesperrt' : ''}`}>
      {/* Fehler-Popup */}
      {zeigeFehlerPopup && (
        <FehlerPopup 
          nachricht={fehlermeldung}
          onSchliessen={handleFehlerPopupSchliessen}
        />
      )}
      
      {/* Status-Anzeige */}
      <StatusAnzeige 
        wartAufAntwort={wartAufAntwort}
        statusLog={statusLog}
        typ={statusTyp}
      />
      
      {/* Drehzahl-Regler */}
      <DrehzahlRegler
        wert={drehzahl}
        onChange={handleDrehzahlLokal}
        onFertig={handleDrehzahlFertig}
        disabled={!drehzahlFreigegeben}
      />
      
      {/* Gang-Buttons */}
      <GangButtons
        ausgewaehlterGang={ausgewaehlterGang}
        onGangWaehlen={handleGangWaehlen}
        disabled={!gaengeFreigegeben}
      />
      
      {/* Hinweis-Texte */}
      {!gaengeFreigegebenVomBackend && !istGesperrt && initialisiert && (
        <div className="manuell-hinweis warnung">
          ⚠️ Drehzahl auf mindestens 300 U/min erhöhen um Gänge freizuschalten
        </div>
      )}
      
      {istGesperrt && (
        <div className="manuell-hinweis info">
          ⏳ Befehl wird ausgeführt, bitte warten...
        </div>
      )}
    </div>
  );
};

export default GearSelectionPanel;
