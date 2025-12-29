// ============================================
// DashboardFooter - Footer mit Stats und Version
// ============================================

import React from 'react';
import { GAUGE_CONSTANTS } from '../../types/dashboard.types';

interface DashboardFooterProps {
  runtime: number;
  cycles: number;
  isConnected: boolean;
}

const DashboardFooter: React.FC<DashboardFooterProps> = ({
  runtime,
  cycles,
  isConnected,
}) => {
  // Format runtime
  const formatRuntime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <footer className="dashboard-footer">
      <div className="footer-stats">
        <div className="footer-stat">
          <span>Laufzeit:</span>
          <span className="footer-stat-value">{formatRuntime(runtime)}</span>
        </div>
        <div className="footer-stat">
          <span>Zyklen:</span>
          <span className="footer-stat-value">{cycles}</span>
        </div>
        <div className="footer-stat">
          <span>Max RPM:</span>
          <span className="footer-stat-value">{GAUGE_CONSTANTS.RPM.MAX.toLocaleString('de-DE')}</span>
        </div>
      </div>
      <span>Prüfstand v2.0 | {isConnected ? 'Mock Data Active' : 'Disconnected'}</span>
    </footer>
  );
};

export default DashboardFooter;


