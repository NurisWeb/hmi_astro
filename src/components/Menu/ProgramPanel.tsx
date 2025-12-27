// ============================================
// ProgramPanel - Testprogramme
// ============================================

import React, { useState } from 'react';
import type { TestProgram } from '../../types/dashboard.types';
import './menu.css';

const defaultPrograms: TestProgram[] = [
  { 
    id: 'autotest', 
    name: 'Automatischer Testlauf', 
    icon: '🔄', 
    status: 'ready',
    description: 'Vollständiger automatischer Testdurchlauf'
  },
  { 
    id: 'warmup', 
    name: 'Aufwärmprogramm', 
    icon: '🔥', 
    status: 'ready',
    description: 'Schonendes Aufwärmen aller Komponenten'
  },
  { 
    id: 'stress', 
    name: 'Belastungstest', 
    icon: '⚡', 
    status: 'ready',
    description: 'Maximale Belastung über Zeit'
  },
  { 
    id: 'calibrate', 
    name: 'Kalibrierung', 
    icon: '📐', 
    status: 'ready',
    description: 'Sensoren und Aktoren kalibrieren'
  },
  { 
    id: 'endurance', 
    name: 'Dauertest', 
    icon: '⏱️', 
    status: 'ready',
    description: 'Langzeittest über mehrere Stunden'
  },
  { 
    id: 'quick', 
    name: 'Schnelltest', 
    icon: '🚀', 
    status: 'ready',
    description: 'Schnelle Funktionsprüfung'
  },
];

const ProgramPanel: React.FC = () => {
  const [programs, setPrograms] = useState<TestProgram[]>(defaultPrograms);
  const [runningProgram, setRunningProgram] = useState<string | null>(null);

  const handleProgramClick = (programId: string) => {
    if (runningProgram === programId) {
      setRunningProgram(null);
      setPrograms(prev => 
        prev.map(p => p.id === programId ? { ...p, status: 'ready' } : p)
      );
    } else if (!runningProgram) {
      setRunningProgram(programId);
      setPrograms(prev => 
        prev.map(p => p.id === programId ? { ...p, status: 'running' } : p)
      );
    }
  };

  const getStatusText = (status: TestProgram['status']) => {
    switch (status) {
      case 'ready': return 'Bereit';
      case 'running': return 'Läuft...';
      case 'paused': return 'Pausiert';
      case 'completed': return 'Fertig';
      case 'error': return 'Fehler';
    }
  };

  return (
    <div className="program-list">
      {programs.map((program) => (
        <div
          key={program.id}
          className={`program-item ${program.status === 'running' ? 'running' : ''}`}
          onClick={() => handleProgramClick(program.id)}
        >
          <span className="program-icon">{program.icon}</span>
          <div className="program-info">
            <div className="program-name">{program.name}</div>
            <div className="program-desc">{program.description}</div>
          </div>
          <span className="program-status">{getStatusText(program.status)}</span>
        </div>
      ))}
    </div>
  );
};

export default ProgramPanel;
