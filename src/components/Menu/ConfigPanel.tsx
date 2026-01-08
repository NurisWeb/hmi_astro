// ============================================
// ConfigPanel - Konfiguration / Einstellungen
// ============================================

import React from 'react';
import { MockDataMode } from '../../types/dashboard.types';
import './menu.css';

interface ConfigPanelProps {
  mockMode: MockDataMode;
  onMockModeChange: (mode: MockDataMode) => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({
  mockMode,
  onMockModeChange,
}) => {
  return (
    <div className="config-panel">
      {/* Mock-Modus */}
      <div className="config-section">
        <div className="config-section-title">Mock-Modus</div>
        <div className="mode-toggle">
          <button
            className={`mode-toggle-btn ${mockMode === 'random' ? 'active' : ''}`}
            onClick={() => onMockModeChange('random')}
          >
            🎲 Zufällig
          </button>
          <button
            className={`mode-toggle-btn ${mockMode === 'realistic' ? 'active' : ''}`}
            onClick={() => onMockModeChange('realistic')}
          >
            📊 Realistisch
          </button>
        </div>
        <p className="config-hint">
          {mockMode === 'random' 
            ? 'Zufällige Werte mit sanften Übergängen' 
            : 'Simuliert echten Prüfstandslauf mit Phasen'}
        </p>
      </div>

      {/* Weitere Einstellungen */}
      <div className="config-section">
        <div className="config-section-title">Anzeige</div>
        <div className="config-row">
          <span className="config-label">Update-Intervall</span>
          <span className="config-value">50 ms</span>
        </div>
        <div className="config-row">
          <span className="config-label">Max. Log-Einträge</span>
          <span className="config-value">100</span>
        </div>
      </div>

      {/* System-Info */}
      <div className="config-section">
        <div className="config-section-title">System</div>
        <div className="config-row">
          <span className="config-label">Version</span>
          <span className="config-value">2.0.0</span>
        </div>
        <div className="config-row">
          <span className="config-label">Build</span>
          <span className="config-value">Astro + React</span>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;




