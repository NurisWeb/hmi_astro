// ============================================
// VerbindungsButton - Header-Button mit 3 Zuständen
// Industrial HMI Connection Control
// ============================================

import React, { useState } from 'react';
import type { VerbindungsButtonProps } from './types';

/**
 * VerbindungsButton im Header
 * 
 * Zustände:
 * - getrennt: Grau, "Verbindung aufbauen"
 * - verbindet: Gelb, animierte Punkte
 * - verbunden: Grün, Hover zeigt "Trennen?"
 */
const VerbindungsButton: React.FC<VerbindungsButtonProps> = ({
  status,
  onVerbinden,
  onTrennen,
  disabled = false,
}) => {
  const [isHovering, setIsHovering] = useState(false);

  // Click Handler basierend auf Status
  const handleClick = () => {
    if (disabled) return;
    
    if (status === 'getrennt') {
      onVerbinden();
    } else if (status === 'verbunden' && isHovering) {
      onTrennen();
    }
  };

  // Button-Content basierend auf Status
  const renderContent = () => {
    switch (status) {
      case 'getrennt':
        return (
          <>
            <span className="verbindung-icon">🔌</span>
            <span className="verbindung-text">Verbindung aufbauen</span>
          </>
        );

      case 'verbindet':
        return (
          <>
            <span className="verbindung-icon verbindung-icon--loading">⏳</span>
            <span className="verbindung-text">
              Verbinde<span className="loading-dots"></span>
            </span>
          </>
        );

      case 'verbunden':
        if (isHovering) {
          return (
            <>
              <span className="verbindung-icon verbindung-icon--warning">⚠️</span>
              <span className="verbindung-text">Trennen?</span>
            </>
          );
        }
        return (
          <>
            <span className="verbindung-dot"></span>
            <span className="verbindung-text">Verbunden</span>
          </>
        );

      default:
        return null;
    }
  };

  // CSS-Klassen basierend auf Status
  const getButtonClass = () => {
    const baseClass = 'verbindung-button';
    const statusClass = `verbindung-button--${status}`;
    const hoverClass = status === 'verbunden' && isHovering ? 'verbindung-button--trennen' : '';
    const disabledClass = disabled || status === 'verbindet' ? 'verbindung-button--disabled' : '';
    
    return [baseClass, statusClass, hoverClass, disabledClass].filter(Boolean).join(' ');
  };

  return (
    <button
      className={getButtonClass()}
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      disabled={disabled || status === 'verbindet'}
      title={
        status === 'getrennt' 
          ? 'Klicken um Verbindung aufzubauen' 
          : status === 'verbindet'
          ? 'Verbindung wird hergestellt...'
          : 'Verbunden - Klicken zum Trennen'
      }
    >
      {renderContent()}
    </button>
  );
};

export default VerbindungsButton;
