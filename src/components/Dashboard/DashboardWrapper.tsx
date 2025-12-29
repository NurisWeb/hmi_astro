// ============================================
// DashboardWrapper - Haupt-Container mit DSG-Integration
// ============================================

import React, { useState, useCallback, useEffect } from 'react';
import { GaugeGrid } from '../Gauges';
import { StatusLog } from '../StatusLog';
import { BottomMenu } from '../Menu';
import { useMockData } from '../../hooks/useMockData';
import { useTheme } from '../../hooks/useTheme';
import type { 
  MenuPanel, 
  LogEntry, 
  GearPosition,
  MockDataMode,
} from '../../types/dashboard.types';
import { GAUGE_CONSTANTS } from '../../types/dashboard.types';
import './DashboardWrapper.css';

const DashboardWrapper: React.FC = () => {
  const [activePanel, setActivePanel] = useState<MenuPanel>('none');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [manualRPM, setManualRPM] = useState(800);
  const [load, setLoad] = useState(0);
  const [autoSpeed, setAutoSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [mockMode, setMockMode] = useState<MockDataMode>('random');
  const [isEmergencyStop, setIsEmergencyStop] = useState(false);
  const [datetime, setDatetime] = useState(new Date());

  const { isDark, toggleTheme } = useTheme();

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

  useEffect(() => {
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

  const clearLogs = useCallback(() => {
    setLogs([]);
    addLog('info', 'Log gelöscht');
  }, [addLog]);

  const handlePanelChange = useCallback((panel: MenuPanel) => {
    setActivePanel(panel);
    if (panel !== 'none') {
      addLog('info', `${panel.charAt(0).toUpperCase() + panel.slice(1)} geöffnet`);
    }
  }, [addLog]);

  const handleGearSelect = useCallback((gear: string) => {
    setGear(gear as GearPosition);
    addLog('success', `Gang ${gear} angefordert`);
  }, [addLog, setGear]);

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
      addLog('info', 'DSG-Prüflauf gestoppt');
    } else {
      startAutoMode(autoSpeed);
      addLog('info', `DSG-Prüflauf gestartet (${autoSpeed === 'slow' ? 'Langsam' : autoSpeed === 'normal' ? 'Normal' : 'Schnell'})`);
    }
  }, [isAutoModeActive, autoSpeed, addLog, startAutoMode, stopAutoMode]);

  // Log DSG-Schaltvorgänge
  useEffect(() => {
    if (dsgState.isShifting) {
      addLog('info', `⚡ Schalten: ${dsgState.activeGear} → ${dsgState.preselectedGear}`);
    }
  }, [dsgState.isShifting, dsgState.activeGear, dsgState.preselectedGear, addLog]);

  const handleMockModeChange = useCallback((mode: MockDataMode) => {
    setMockMode(mode);
    setMode(mode);
    addLog('info', `Modus: ${mode === 'random' ? 'Manuell' : 'Automatik'}`);
  }, [addLog, setMode]);

  const handleEmergencyStop = useCallback(() => {
    setIsEmergencyStop(true);
    stopAutoMode();
    reset();
    addLog('error', '🛑 NOT-AUS AKTIVIERT!');
    addLog('error', 'Alle Systeme werden gestoppt...');
  }, [addLog, reset, stopAutoMode]);

  const handleEmergencyReset = useCallback(() => {
    setIsEmergencyStop(false);
    addLog('warning', 'System wird zurückgesetzt...');
    setTimeout(() => {
      addLog('success', 'System bereit');
    }, 1000);
  }, [addLog]);

  type SensorStatus = 'normal' | 'warning' | 'danger';
  const sensorData: { name: string; value: number; unit: string; status: SensorStatus }[] = [
    { name: 'Drehzahl', value: data.rpm, unit: 'U/min', status: (data.rpm > GAUGE_CONSTANTS.RPM.REDLINE ? 'danger' : 'normal') as SensorStatus },
    { name: 'Öldruck 1', value: data.oilPressures[0], unit: 'bar', status: (data.oilPressures[0] > 15 ? 'danger' : data.oilPressures[0] > 12 ? 'warning' : 'normal') as SensorStatus },
    { name: 'Öldruck 2', value: data.oilPressures[1], unit: 'bar', status: (data.oilPressures[1] > 15 ? 'danger' : data.oilPressures[1] > 12 ? 'warning' : 'normal') as SensorStatus },
    { name: 'Motor 1', value: data.brakeMotors.motor1.torque, unit: 'Nm', status: (data.brakeMotors.motor1.load > 85 ? 'danger' : data.brakeMotors.motor1.load > 70 ? 'warning' : 'normal') as SensorStatus },
    { name: 'Motor 2', value: data.brakeMotors.motor2.torque, unit: 'Nm', status: (data.brakeMotors.motor2.load > 85 ? 'danger' : data.brakeMotors.motor2.load > 70 ? 'warning' : 'normal') as SensorStatus },
    { name: 'Temperatur', value: data.temperature, unit: '°C', status: (data.temperature > 90 ? 'danger' : data.temperature > 75 ? 'warning' : 'normal') as SensorStatus },
  ];

  const formatRuntime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const isCompact = activePanel !== 'none';

  return (
    <div className={`dashboard-wrapper ${isCompact ? 'menu-open' : ''}`}>
      <header className="dashboard-header">
        <h1 className="dashboard-title">🔧 DSG-7 Prüfstand</h1>
        <div className="dashboard-header-right">
          <div className={`mode-indicator ${mockMode === 'realistic' ? 'realistic' : ''}`}>
            {mockMode === 'random' ? '🎛️ Manuell' : '🔄 Automatik'}
          </div>
          {/* DSG-Status-Anzeige */}
          <div className="dsg-status-badge">
            <span className="dsg-gear-indicator">{dsgState.activeGear}</span>
            {dsgState.preselectedGear && dsgState.activeGear !== 'N' && (
              <span className="dsg-preselect-indicator">→{dsgState.preselectedGear}</span>
            )}
          </div>
          <div className="connection-status">
            <div className={`connection-dot ${isConnected ? '' : 'disconnected'}`} />
            <span>{isConnected ? 'Verbunden' : 'Getrennt'}</span>
          </div>
          <span className="dashboard-datetime">
            {datetime.toLocaleString('de-DE')}
          </span>
          <button 
            className="theme-toggle" 
            onClick={toggleTheme}
            title={isDark ? 'Zum Light Mode wechseln' : 'Zum Dark Mode wechseln'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-gauges">
          <GaugeGrid data={data} isCompact={isCompact} />
        </section>

        <section className={`dashboard-lower ${isCompact ? 'compact' : ''}`}>
          <StatusLog
            logs={logs}
            maxVisible={5}
            onClear={clearLogs}
          />

          {!isCompact && (
            <div className="dashboard-stats">
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-value">{formatRuntime(data.runtime)}</span>
                  <span className="stat-label">Laufzeit</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{data.cycles}</span>
                  <span className="stat-label">Zyklen</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{data.oilTemperature.toFixed(0)}°C</span>
                  <span className="stat-label">Öltemp.</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value" style={{ color: 'var(--color-cyan)' }}>
                    {dsgState.activeGear}
                  </span>
                  <span className="stat-label">Gang</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value" style={{ color: 'var(--color-green)' }}>
                    {Math.round(dsgState.load)}%
                  </span>
                  <span className="stat-label">Last</span>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="dashboard-footer">
        <div className="footer-stats">
          <div className="footer-stat">
            <span>Laufzeit:</span>
            <span className="footer-stat-value">{formatRuntime(data.runtime)}</span>
          </div>
          <div className="footer-stat">
            <span>Zyklen:</span>
            <span className="footer-stat-value">{data.cycles}</span>
          </div>
          <div className="footer-stat">
            <span>K1:</span>
            <span className="footer-stat-value" style={{ color: dsgState.clutch1.isActive ? 'var(--color-green)' : 'var(--text-dim)' }}>
              {Math.round(dsgState.clutch1.engagement)}%
            </span>
          </div>
          <div className="footer-stat">
            <span>K2:</span>
            <span className="footer-stat-value" style={{ color: dsgState.clutch2.isActive ? 'var(--color-green)' : 'var(--text-dim)' }}>
              {Math.round(dsgState.clutch2.engagement)}%
            </span>
          </div>
        </div>
        <span>DSG-7 Prüfstand v2.0 | {isConnected ? 'Simulation Active' : 'Disconnected'}</span>
      </footer>

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
      />

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

export default DashboardWrapper;
