// ============================================
// StatusLog - Log-Anzeige mit neueste oben
// ============================================

import React from 'react';
import type { LogEntry } from '../../types/dashboard.types';
import './StatusLog.css';

interface StatusLogProps {
  logs: LogEntry[];
  maxVisible?: number;
  onClear?: () => void;
}

const StatusLog: React.FC<StatusLogProps> = ({
  logs,
  maxVisible = 5,
  onClear,
}) => {
  const visibleLogs = logs.slice(0, maxVisible);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getTypeIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
    }
  };

  return (
    <div className="status-log">
      <div className="status-log-header">
        <span className="status-log-title">📋 Status Log</span>
        <div className="status-log-actions">
          <span className="status-log-count">
            {logs.length} Einträge
          </span>
          {onClear && (
            <button className="status-log-clear" onClick={onClear}>
              Löschen
            </button>
          )}
        </div>
      </div>

      <div className="status-log-content">
        {visibleLogs.length === 0 ? (
          <div className="status-log-empty">
            Keine Log-Einträge vorhanden
          </div>
        ) : (
          visibleLogs.map((log, index) => (
            <div
              key={log.id}
              className={`status-log-entry ${log.type}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="status-log-icon">{getTypeIcon(log.type)}</span>
              <span className="status-log-time">{formatTime(log.timestamp)}</span>
              <span className="status-log-message">{log.message}</span>
            </div>
          ))
        )}
      </div>

      {logs.length > maxVisible && (
        <div className="status-log-more">
          +{logs.length - maxVisible} weitere Einträge
        </div>
      )}
    </div>
  );
};

export default StatusLog;
