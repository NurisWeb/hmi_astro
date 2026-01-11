// ============================================
// LoadingDots - Animierte Punkte für aktiven Schritt
// ============================================

import React from 'react';
import './menu.css';

const LoadingDots: React.FC = () => {
  return (
    <span className="loading-dots">
      <span className="loading-dot"></span>
      <span className="loading-dot"></span>
      <span className="loading-dot"></span>
    </span>
  );
};

export default LoadingDots;
