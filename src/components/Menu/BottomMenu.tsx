// ============================================
// BottomMenu - Ausklappbares Menü mit DSG-Support
// Mit StatusBar-Integration für Gang- und Prüfpläne-Panel
// ============================================

import React from 'react';
import type { MenuPanel, MockDataMode, DSGState } from '../../types/dashboard.types';
import { StatusBar } from '../StatusLog';
import type { StatusTyp } from '../StatusLog';
import GearSelectionPanel from './GearSelectionPanel';
import PruefplaenePanel from './PruefplaenePanel';
import SensorPanel from './SensorPanel';
import DSGPanel from './DSGPanel';
import './menu.css';

// Status-Log State Interface
interface StatusLogState {
  nachricht: string;
  typ: StatusTyp;
}

interface BottomMenuProps {
  activePanel: MenuPanel;
  onPanelChange: (panel: MenuPanel) => void;
  onEmergencyStop: () => void;
  selectedGear: string;
  onGearSelect: (gear: string) => void;
  manualRPM: number;
  onRPMChange: (rpm: number) => void;
  isAutoRunning: boolean;
  onAutoRunToggle: () => void;
  autoSpeed: 'slow' | 'normal' | 'fast';
  onAutoSpeedChange: (speed: 'slow' | 'normal' | 'fast') => void;
  sensorData: { name: string; value: number; unit: string; status: 'normal' | 'warning' | 'danger' }[];
  mockMode: MockDataMode;
  onMockModeChange: (mode: MockDataMode) => void;
  // DSG Props
  dsgState?: DSGState;
  load?: number;
  onLoadChange?: (load: number) => void;
  // Status-Log Props
  statusLog?: StatusLogState | null;
  setzeStatus?: (nachricht: string, typ?: StatusTyp) => void;
}

const BottomMenu: React.FC<BottomMenuProps> = ({
  activePanel,
  onPanelChange,
  onEmergencyStop,
  selectedGear,
  onGearSelect,
  manualRPM,
  onRPMChange,
  isAutoRunning,
  onAutoRunToggle,
  autoSpeed,
  onAutoSpeedChange,
  sensorData,
  mockMode,
  onMockModeChange,
  dsgState,
  load = 0,
  onLoadChange,
  statusLog,
  setzeStatus,
}) => {
  const getPanelTitle = () => {
    switch (activePanel) {
      case 'gear': return '◀ Manuelle Gangauswahl vom SIM-Gang DSG';
      case 'program': return '▶️ Prüfpläne';
      case 'sensors': return '📊 Sensorwerte';
      case 'regelung': return '🎛️ Regelungslauf';
      case 'config': return '⚡ Konfiguration';
      case 'dsg': return '🔀 DSG-7 Doppelkupplungsgetriebe';
      default: return '';
    }
  };

  // Status-Bar nur bei Gang- oder Prüfpläne-Panel anzeigen
  const sollStatusBarAnzeigen = activePanel === 'gear' || activePanel === 'program';

  const renderPanelContent = () => {
    switch (activePanel) {
      case 'gear':
        return (
          <GearSelectionPanel
            onPanelSchliessen={() => onPanelChange('none')}
            onGangGeaendert={onGearSelect}
          />
        );
      case 'program':
        return <PruefplaenePanel setzeStatus={setzeStatus} />;
      case 'sensors':
        return <SensorPanel sensors={sensorData} />;
      case 'config':
        return (
          <div className="config-section">
            <div className="config-section-title">Simulationsmodus</div>
            <div className="mode-toggle">
              <button
                className={`mode-toggle-btn ${mockMode === 'random' ? 'active' : ''}`}
                onClick={() => onMockModeChange('random')}
              >
                Manuell
              </button>
              <button
                className={`mode-toggle-btn ${mockMode === 'realistic' ? 'active' : ''}`}
                onClick={() => onMockModeChange('realistic')}
              >
                Automatik
              </button>
            </div>
            <p style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-dim)' }}>
              <strong>Manuell:</strong> Manuelle Steuerung von Gang, Drehzahl und Last<br/>
              <strong>Automatik:</strong> Automatischer Prüflauf mit realistischen Phasen
            </p>
          </div>
        );
      case 'dsg':
        return (
          <DSGPanel 
            dsgState={dsgState}
            currentGear={selectedGear as any}
          />
        );
      case 'regelung':
        return (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: 'var(--text-dim)',
            fontSize: '12px' 
          }}>
            Regelungslauf wird noch implementiert...
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bottom-menu pt-8">
      <div className={`bottom-menu-panel w-full mb-4 ${activePanel !== 'none' ? 'open' : ''}`}>
        {activePanel !== 'none' && (
          <>
            <div className="bottom-menu-panel-header">
              <span className="bottom-menu-panel-title">{getPanelTitle()}</span>
              <button 
                className="bottom-menu-panel-close"
                onClick={() => onPanelChange('none')}
              >
                ✕
              </button>
            </div>
            
            {/* StatusBar - Nur bei Gang und Prüfpläne */}
            {sollStatusBarAnzeigen && statusLog && (
              <StatusBar
                nachricht={statusLog.nachricht}
                typ={statusLog.typ}
                sichtbar={true}
              />
            )}
            
            <div className="bottom-menu-panel-content">
              {renderPanelContent()}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BottomMenu;
