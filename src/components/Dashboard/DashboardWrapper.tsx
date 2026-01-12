// ============================================
// DashboardWrapper - Haupt-Container mit DSG-Integration
// Layout: Header → Parameter-Leiste → Hauptbereich → Footer
// Telemetrie-Daten nach Main_Doku.json Struktur
// ============================================

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GaugeGrid } from '../Gauges';
import { BottomMenu } from '../Menu';
import { VerbindungsButton, BlankState, VerbindungsProvider, useVerbindung } from '../Verbindung';
import { useMockData } from '../../hooks/useMockData';
import { useTelemetrie } from '../../hooks/useTelemetrie';
import { useTheme } from '../../hooks/useTheme';
import type { 
  MenuPanel, 
  LogEntry, 
  GearPosition,
  MockDataMode,
} from '../../types/dashboard.types';
import type { StatusTyp } from '../StatusLog';
import { GAUGE_CONSTANTS } from '../../types/dashboard.types';
import './DashboardWrapper.css';
import '../Verbindung/verbindung.css';

// ============================================
// Status-Log State Interface
// ============================================
export interface StatusLogState {
  nachricht: string;
  typ: StatusTyp;
}

// ============================================
// DashboardContent - Innere Komponente mit Context-Zugriff
// ============================================
const DashboardContent: React.FC = () => {
  const [activePanel, setActivePanel] = useState<MenuPanel>('none');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [manualRPM, setManualRPM] = useState(800);
  const [load, setLoad] = useState(0);
  const [autoSpeed, setAutoSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [mockMode, setMockMode] = useState<MockDataMode>('random');
  const [isEmergencyStop, setIsEmergencyStop] = useState(false);
  // SSR-sicher: null initial, wird nach Hydration gesetzt
  const [datetime, setDatetime] = useState<Date | null>(null);
  
  // ============================================
  // Verbindungs-Context nutzen
  // ============================================
  const {
    verbindung,
    laufzeit,
    fortschritt,
    istVerbunden,
    verbindungAufbauen,
    verbindungTrennen,
    fehlerZuruecksetzen,
  } = useVerbindung();
  
  // Status-Log State für Panels (Gang, Prüfpläne)
  const [statusLog, setStatusLog] = useState<StatusLogState | null>(null);
  const prevGearRef = useRef<string>('N');

  const { isDark, toggleTheme } = useTheme();

  // ============================================
  // Telemetrie-Daten nach Main_Doku.json
  // ============================================
  const { daten: telemetrie } = useTelemetrie(100);

  const { 
    data, 
    dsgState,
    isConnected, 
    isAutoModeActive,
    setMode, 
    setGear, 
    setTargetRPM, 
    setLoad: setServiceLoad,
    startAutoMode,
    stopAutoMode,
    reset 
  } = useMockData({
    mode: mockMode,
    updateInterval: 50,
  });

  // ============================================
  // Status-Log Funktionen
  // ============================================
  const setzeStatus = useCallback((nachricht: string, typ: StatusTyp = 'info') => {
    setStatusLog({ nachricht, typ });
  }, []);

  const loescheStatus = useCallback(() => {
    setStatusLog(null);
  }, []);

  // Datum/Uhrzeit aktualisieren (SSR-sicher)
  useEffect(() => {
    // Initial setzen nach Hydration
    setDatetime(new Date());
    const interval = setInterval(() => setDatetime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    const newEntry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      message,
    };
    setLogs(prev => [newEntry, ...prev].slice(0, 100));
  }, []);

  // ============================================
  // Verbindungs-Handler (Wrapper für Context + lokale Actions)
  // ============================================
  const handleVerbinden = useCallback(() => {
    addLog('info', '🔌 Verbindung wird aufgebaut...');
    verbindungAufbauen();
  }, [addLog, verbindungAufbauen]);

  const handleTrennen = useCallback(() => {
    // 1. Context-Verbindung trennen
    verbindungTrennen();
    
    // 2. Alle laufenden Prozesse stoppen
    stopAutoMode();
    reset();
    
    // 3. Alle offenen Panels schließen
    setActivePanel('none');
    
    // 4. Status-Log löschen
    loescheStatus();
    
    // 5. Manuelle Werte zurücksetzen
    setManualRPM(800);
    setLoad(0);
    setAutoSpeed('normal');
    
    // 6. Log-Eintrag
    addLog('warning', '🔌 Verbindung getrennt');
  }, [addLog, verbindungTrennen, stopAutoMode, reset, loescheStatus]);

  // Log wenn Verbindung hergestellt wurde
  useEffect(() => {
    if (istVerbunden) {
      addLog('success', '✅ Verbindung hergestellt');
    }
  }, [istVerbunden, addLog]);

  // Log bei Verbindungsfehler
  useEffect(() => {
    if (verbindung.letzterFehler) {
      addLog('error', `❌ ${verbindung.letzterFehler}`);
    }
  }, [verbindung.letzterFehler, addLog]);

  // Panel-Wechsel mit Status-Reset
  const handlePanelChange = useCallback((panel: MenuPanel) => {
    // Status löschen wenn Panel geschlossen wird
    if (panel === 'none') {
      loescheStatus();
    } else if (panel === 'gear') {
      // Initial-Status für Gang-Panel
      setzeStatus('Bereit für Gangwechsel', 'info');
    } else if (panel === 'program') {
      // Initial-Status für Prüfpläne-Panel
      setzeStatus('Prüfplan auswählen', 'info');
    } else {
      // Andere Panels: kein Status
      loescheStatus();
    }
    
    setActivePanel(panel);
    if (panel !== 'none') {
      const panelName = panel === 'program' ? 'Prüfplan' : panel.charAt(0).toUpperCase() + panel.slice(1);
      addLog('info', `${panelName} geöffnet`);
    }
  }, [addLog, setzeStatus, loescheStatus]);

  // Gang-Auswahl mit Status-Feedback
  const handleGearSelect = useCallback((gear: string) => {
    prevGearRef.current = dsgState.activeGear;
    setGear(gear as GearPosition);
    
    // Status während des Schaltvorgangs
    setzeStatus(`Gang ${gear} wird eingelegt...`, 'info');
    addLog('success', `Gang ${gear} angefordert`);
  }, [addLog, setGear, setzeStatus, dsgState.activeGear]);

  // Status aktualisieren wenn Gang gewechselt wurde
  useEffect(() => {
    if (activePanel === 'gear' && !dsgState.isShifting && dsgState.activeGear !== 'N') {
      // Schaltvorgang beendet
      if (prevGearRef.current !== dsgState.activeGear) {
        setzeStatus(`Gang ${dsgState.activeGear} eingelegt`, 'erfolg');
        prevGearRef.current = dsgState.activeGear;
      }
    }
  }, [dsgState.activeGear, dsgState.isShifting, activePanel, setzeStatus]);

  const handleRPMChange = useCallback((rpm: number) => {
    setManualRPM(rpm);
    setTargetRPM(rpm);
  }, [setTargetRPM]);

  const handleLoadChange = useCallback((newLoad: number) => {
    setLoad(newLoad);
    setServiceLoad(newLoad);
  }, [setServiceLoad]);

  const handleAutoRunToggle = useCallback(() => {
    if (isAutoModeActive) {
      stopAutoMode();
      setzeStatus('DSG-Prüflauf gestoppt', 'info');
      addLog('info', 'DSG-Prüflauf gestoppt');
    } else {
      startAutoMode(autoSpeed);
      setzeStatus('DSG-Prüflauf läuft...', 'info');
      addLog('info', `DSG-Prüflauf gestartet (${autoSpeed === 'slow' ? 'Langsam' : autoSpeed === 'normal' ? 'Normal' : 'Schnell'})`);
    }
  }, [isAutoModeActive, autoSpeed, addLog, startAutoMode, stopAutoMode, setzeStatus]);

  // Log DSG-Schaltvorgänge
  useEffect(() => {
    if (dsgState.isShifting && activePanel === 'gear') {
      setzeStatus(`Schalten: ${dsgState.activeGear} → ${dsgState.preselectedGear}`, 'info');
      addLog('info', `⚡ Schalten: ${dsgState.activeGear} → ${dsgState.preselectedGear}`);
    }
  }, [dsgState.isShifting, dsgState.activeGear, dsgState.preselectedGear, addLog, activePanel, setzeStatus]);

  const handleMockModeChange = useCallback((mode: MockDataMode) => {
    setMockMode(mode);
    setMode(mode);
    addLog('info', `Modus: ${mode === 'random' ? 'Manuell' : 'Automatik'}`);
  }, [addLog, setMode]);

  const handleEmergencyStop = useCallback(() => {
    setIsEmergencyStop(true);
    stopAutoMode();
    reset();
    setzeStatus('NOT-AUS AKTIVIERT!', 'fehler');
    addLog('error', '🛑 NOT-AUS AKTIVIERT!');
    addLog('error', 'Alle Systeme werden gestoppt...');
  }, [addLog, reset, stopAutoMode, setzeStatus]);

  const handleEmergencyReset = useCallback(() => {
    setIsEmergencyStop(false);
    loescheStatus();
    addLog('warning', 'System wird zurückgesetzt...');
    setTimeout(() => {
      addLog('success', 'System bereit');
    }, 1000);
  }, [addLog, loescheStatus]);

  // Sensor-Daten für Panel (basierend auf Telemetrie nach Main_Doku.json)
  type SensorStatus = 'normal' | 'warning' | 'danger';
  const p = telemetrie?.p ?? [0, 0, 0, 0];  // Öldrücke
  const m = telemetrie?.m ?? [0, 0, 0];      // Antriebmotor, KWB1, KWB2
  const l = telemetrie?.l ?? [0, 0, 0];      // Temperaturen, Auslastung
  
  const sensorData: { name: string; value: number; unit: string; status: SensorStatus }[] = [
    { 
      name: 'Antriebmotor', 
      value: m[0], 
      unit: 'U/min', 
      status: (m[0] > GAUGE_CONSTANTS.RPM.REDLINE ? 'danger' : m[0] > GAUGE_CONSTANTS.RPM.WARNING ? 'warning' : 'normal') as SensorStatus 
    },
    { 
      name: 'K1 Öldruck', 
      value: p[0], 
      unit: 'bar', 
      status: (p[0] > GAUGE_CONSTANTS.OIL_PRESSURE.DANGER ? 'danger' : p[0] > GAUGE_CONSTANTS.OIL_PRESSURE.WARNING ? 'warning' : 'normal') as SensorStatus 
    },
    { 
      name: 'K2 Öldruck', 
      value: p[1], 
      unit: 'bar', 
      status: (p[1] > GAUGE_CONSTANTS.OIL_PRESSURE.DANGER ? 'danger' : p[1] > GAUGE_CONSTANTS.OIL_PRESSURE.WARNING ? 'warning' : 'normal') as SensorStatus 
    },
    { 
      name: 'KWB1', 
      value: m[1], 
      unit: 'kW', 
      status: (m[1] > GAUGE_CONSTANTS.BRAKE_KW.DANGER ? 'danger' : m[1] > GAUGE_CONSTANTS.BRAKE_KW.WARNING ? 'warning' : 'normal') as SensorStatus 
    },
    { 
      name: 'KWB2', 
      value: m[2], 
      unit: 'kW', 
      status: (m[2] > GAUGE_CONSTANTS.BRAKE_KW.DANGER ? 'danger' : m[2] > GAUGE_CONSTANTS.BRAKE_KW.WARNING ? 'warning' : 'normal') as SensorStatus 
    },
    { 
      name: 'Öltemp Hydraulik', 
      value: l[0], 
      unit: '°C', 
      status: (l[0] > GAUGE_CONSTANTS.OIL_TEMPERATURE.DANGER ? 'danger' : l[0] > GAUGE_CONSTANTS.OIL_TEMPERATURE.WARNING ? 'warning' : 'normal') as SensorStatus 
    },
  ];

  // Datum formatieren: DD.MM.YYYY
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Uhrzeit formatieren: HH:MM
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isCompact = activePanel !== 'none';

  // Öl-Temperatur Status für Farbgebung im Header
  const getTemperatureStatus = (temp: number): 'cold' | 'normal' | 'warning' | 'danger' => {
    if (temp < 40) return 'cold';
    if (temp < 100) return 'normal';
    if (temp < 120) return 'warning';
    return 'danger';
  };

  const oilTemp = telemetrie?.l[0] ?? 0;
  const tempStatus = getTemperatureStatus(oilTemp);

  return (
    <div className={`dashboard-wrapper ${isCompact ? 'menu-open' : ''} ${!istVerbunden ? 'dashboard-wrapper--disconnected' : ''}`}>
      {/* ============================================
          HEADER - 2x2 Grid Layout
          Links oben: Titel
          Links unten: Menu-Buttons
          Rechts oben: Laufzeit, Öltemp, Gang
          Rechts unten: VerbindungsButton, Datum/Zeit, Theme-Toggle
          ============================================ */}
      <header className="dashboard-header">
        {/* LINKE SPALTE */}
        <div className="dashboard-header-left">
          <h1 className="dashboard-title">DSG-Prüfstand CarParts24</h1>
          {/* Menu-Buttons nur wenn verbunden */}
          {istVerbunden && (
            <div className="header-menu-buttons">
              <button
                className={`header-menu-btn ${activePanel === 'gear' ? 'active' : ''}`}
                onClick={() => handlePanelChange(activePanel === 'gear' ? 'none' : 'gear')}
              >
                <span className="header-menu-btn-icon">⚙️</span>
                <span className="header-menu-btn-label">Manuell</span>
              </button>
              <button
                className={`header-menu-btn ${activePanel === 'program' ? 'active' : ''}`}
                onClick={() => handlePanelChange(activePanel === 'program' ? 'none' : 'program')}
              >
                <span className="header-menu-btn-icon">▶️</span>
                <span className="header-menu-btn-label">Prüfpläne</span>
              </button>
            </div>
          )}
        </div>

        {/* RECHTE SPALTE */}
        <div className="dashboard-header-right">
          {/* Obere Zeile: Parameter (nur wenn verbunden) */}
          {istVerbunden && (
            <div className="header-params">
              <div className="header-param">
                <span className="header-param-label">Laufzeit</span>
                <span className="header-param-value header-param-value--runtime">{laufzeit}</span>
              </div>
              <div className="header-param">
                <span className="header-param-label">Öl-Temp</span>
                <span className={`header-param-value header-param-value--temp header-param-value--${tempStatus}`}>
                  {oilTemp.toFixed(0)}°C
                </span>
              </div>
              <div className="header-param">
                <span className="header-param-label">Gang</span>
                <span className="header-param-value header-param-value--gear">{dsgState.activeGear}</span>
              </div>
            </div>
          )}

          {/* Untere Zeile: Controls */}
          <div className="header-controls">
            <VerbindungsButton
              status={verbindung.status}
              onVerbinden={handleVerbinden}
              onTrennen={handleTrennen}
            />
            <span className="dashboard-datetime">
              {datetime ? `${formatDate(datetime)} | ${formatTime(datetime)}` : '--.--.---- | --:--:--'}
            </span>
            <button 
              className="theme-toggle" 
              onClick={toggleTheme}
              title={isDark ? 'Zum Light Mode wechseln' : 'Zum Dark Mode wechseln'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* ============================================
          CONTENT: BlankState ODER Dashboard
          ============================================ */}
      {!istVerbunden ? (
        // BLANK-STATE: Nicht verbunden
        <BlankState
          status={verbindung.status}
          onVerbinden={handleVerbinden}
          fortschritt={fortschritt}
          fehler={verbindung.letzterFehler}
        />
      ) : (
        // VERBUNDEN: Normales Dashboard
        <>
          {/* Hauptbereich - Gauges nach Main_Doku.json */}
          <main className="dashboard-main">
            <section className="dashboard-gauges">
              <GaugeGrid 
                telemetrie={telemetrie} 
                isCompact={isCompact} 
                activeGear={dsgState.activeGear}
              />
            </section>
          </main>

          {/* Bottom Menu - Navigation mit Status-Log */}
          <BottomMenu
            activePanel={activePanel}
            onPanelChange={handlePanelChange}
            onEmergencyStop={handleEmergencyStop}
            selectedGear={dsgState.activeGear}
            onGearSelect={handleGearSelect}
            manualRPM={manualRPM}
            onRPMChange={handleRPMChange}
            isAutoRunning={isAutoModeActive}
            onAutoRunToggle={handleAutoRunToggle}
            autoSpeed={autoSpeed}
            onAutoSpeedChange={setAutoSpeed}
            sensorData={sensorData}
            mockMode={mockMode}
            onMockModeChange={handleMockModeChange}
            dsgState={dsgState}
            load={load}
            onLoadChange={handleLoadChange}
            statusLog={statusLog}
            setzeStatus={setzeStatus}
          />
        </>
      )}

      {/* ============================================
          EMERGENCY OVERLAY
          ============================================ */}
      {isEmergencyStop && (
        <div className="emergency-overlay">
          <div className="emergency-content">
            <div className="emergency-icon">🛑</div>
            <h2 className="emergency-title">NOT-AUS</h2>
            <p className="emergency-text">Alle Systeme wurden gestoppt</p>
            <button className="emergency-reset-btn" onClick={handleEmergencyReset}>
              System zurücksetzen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// DashboardWrapper - Äußere Komponente mit VerbindungsProvider
// ============================================
const DashboardWrapper: React.FC = () => {
  return (
    <VerbindungsProvider>
      <DashboardContent />
    </VerbindungsProvider>
  );
};

export default DashboardWrapper;
