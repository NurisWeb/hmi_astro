// ============================================
// BottomMenu - Ausklappbares Menü unten
// ============================================

import React from 'react';
import type { MenuPanel, MenuItem, MockDataMode } from '../../types/dashboard.types';
import GearSelectionPanel from './GearSelectionPanel';
import ProgramPanel from './ProgramPanel';
import SensorPanel from './SensorPanel';
import './menu.css';

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
}

const menuItems: MenuItem[] = [
  { id: 'gear', label: 'Gang', icon: '⚙️', subtitle: 'Gangauswahl' },
  { id: 'program', label: 'Programm', icon: '▶️', subtitle: 'Testprogramme' },
  { id: 'sensors', label: 'Sensoren', icon: '📊', subtitle: 'Live-Daten' },
  { id: 'regelung', label: 'Regelung', icon: '🎛️', subtitle: 'PID' },
  { id: 'config', label: 'Config', icon: '⚡', subtitle: 'Einstellungen' },
  { id: 'dsg', label: 'DSG', icon: '🔀', subtitle: 'Kupplung' },
];

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
}) => {
  const handlePanelToggle = (panel: MenuPanel) => {
    if (activePanel === panel) {
      onPanelChange('none');
    } else {
      onPanelChange(panel);
    }
  };

  const getPanelTitle = () => {
    switch (activePanel) {
      case 'gear': return '⚙️ Gangauswahl & Drehzahlsteuerung';
      case 'program': return '▶️ Testprogramme';
      case 'sensors': return '📊 Sensorwerte';
      case 'regelung': return '🎛️ Regelungslauf';
      case 'config': return '⚡ Konfiguration';
      case 'dsg': return '🔀 DSG Anzeige';
      default: return '';
    }
  };

  const renderPanelContent = () => {
    switch (activePanel) {
      case 'gear':
        return (
          <GearSelectionPanel
            selectedGear={selectedGear}
            onGearSelect={onGearSelect}
            manualRPM={manualRPM}
            onRPMChange={onRPMChange}
            isAutoRunning={isAutoRunning}
            onAutoRunToggle={onAutoRunToggle}
            autoSpeed={autoSpeed}
            onAutoSpeedChange={onAutoSpeedChange}
          />
        );
      case 'program':
        return <ProgramPanel />;
      case 'sensors':
        return <SensorPanel sensors={sensorData} />;
      case 'config':
        return (
          <div className="config-section">
            <div className="config-section-title">Mock-Modus</div>
            <div className="mode-toggle">
              <button
                className={`mode-toggle-btn ${mockMode === 'random' ? 'active' : ''}`}
                onClick={() => onMockModeChange('random')}
              >
                Zufällig
              </button>
              <button
                className={`mode-toggle-btn ${mockMode === 'realistic' ? 'active' : ''}`}
                onClick={() => onMockModeChange('realistic')}
              >
                Realistisch
              </button>
            </div>
          </div>
        );
      case 'regelung':
      case 'dsg':
        return (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: 'var(--text-dim)',
            fontSize: '12px' 
          }}>
            Funktion wird noch implementiert...
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bottom-menu">
      <div className={`bottom-menu-panel ${activePanel !== 'none' ? 'open' : ''}`}>
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
            <div className="bottom-menu-panel-content">
              {renderPanelContent()}
            </div>
          </>
        )}
      </div>

      <div className="bottom-menu-bar">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`menu-btn ${activePanel === item.id ? 'active' : ''}`}
            onClick={() => handlePanelToggle(item.id)}
          >
            <span className="menu-btn-icon">{item.icon}</span>
            <span className="menu-btn-label">{item.label}</span>
          </button>
        ))}
        
        <button className="menu-btn emergency" onClick={onEmergencyStop}>
          <span className="menu-btn-icon">🛑</span>
          <span className="menu-btn-label">NOT-AUS</span>
        </button>
      </div>
    </div>
  );
};

export default BottomMenu;
