// ============================================
// DashboardHeader - Header mit Titel, Status, Theme-Toggle
// ============================================

import React from 'react';
import { MockDataMode } from '../../types/dashboard.types';

interface DashboardHeaderProps {
  isConnected: boolean;
  mockMode: MockDataMode;
  datetime: Date;
  isDark: boolean;
  onToggleTheme: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  isConnected,
  mockMode,
  datetime,
  isDark,
  onToggleTheme,
}) => {
  return (
    <header className="dashboard-header">
      <h1 className="dashboard-title">🔧 Prüfstand Dashboard</h1>
      <div className="dashboard-header-right">
        <div className={`mode-indicator ${mockMode === 'realistic' ? 'realistic' : ''}`}>
          {mockMode === 'random' ? '🎲 Random' : '📊 Realistic'}
        </div>
        <div className="connection-status">
          <div className={`connection-dot ${isConnected ? '' : 'disconnected'}`} />
          <span>{isConnected ? 'Verbunden' : 'Getrennt'}</span>
        </div>
        <span className="dashboard-datetime">
          {datetime.toLocaleString('de-DE')}
        </span>
        {/* Theme Toggle */}
        <button 
          className="theme-toggle" 
          onClick={onToggleTheme}
          title={isDark ? 'Zum Light Mode wechseln' : 'Zum Dark Mode wechseln'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;

