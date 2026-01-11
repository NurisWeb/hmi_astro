// services/errorHandler.ts
// Zentrale Fehlerbehandlung

import { cmdStop } from './commands';

// === TYPEN ===

export type FehlerTyp = 'WARNUNG' | 'FEHLER' | 'KRITISCH';

export interface AppFehler {
  typ: FehlerTyp;
  nachricht: string;
  aktion?: 'soft_aus' | 'retry' | 'ignorieren';
  kontext?: string;
  timestamp?: number;
}

// === FEHLER-HANDLER ===

export const handleApiError = async (
  error: unknown,
  kontext: string
): Promise<AppFehler> => {
  
  const err = error as Error;
  console.error(`[${kontext}]`, err);
  
  // Netzwerkfehler (TypeError bei fetch)
  if (err.name === 'TypeError' || err.message?.includes('fetch')) {
    return {
      typ: 'KRITISCH',
      nachricht: 'Netzwerkverbindung verloren',
      aktion: 'soft_aus',
      kontext,
      timestamp: Date.now(),
    };
  }
  
  // Timeout (AbortError)
  if (err.name === 'AbortError') {
    return {
      typ: 'FEHLER',
      nachricht: 'Zeitüberschreitung bei der Anfrage',
      aktion: 'retry',
      kontext,
      timestamp: Date.now(),
    };
  }
  
  // Server-Fehler
  if (err.message?.includes('500') || err.message?.includes('503')) {
    return {
      typ: 'FEHLER',
      nachricht: 'Server nicht erreichbar',
      aktion: 'retry',
      kontext,
      timestamp: Date.now(),
    };
  }
  
  // Standard-Fehler
  return {
    typ: 'FEHLER',
    nachricht: err.message || 'Unbekannter Fehler',
    aktion: 'ignorieren',
    kontext,
    timestamp: Date.now(),
  };
};

// === KRITISCHER FEHLER: SOFT-AUS ===

export const handleKritischerFehler = async (nachricht: string): Promise<boolean> => {
  console.error('🚨 KRITISCHER FEHLER:', nachricht);
  
  try {
    const result = await cmdStop();
    if (result.ok) {
      console.log('✅ Soft-Aus erfolgreich durchgeführt');
      return true;
    } else {
      console.error('❌ Soft-Aus fehlgeschlagen:', result.message);
      return false;
    }
  } catch (err) {
    console.error('❌ Soft-Aus Fehler:', err);
    return false;
  }
};

// === FEHLER-LOGGING ===

const fehlerLog: AppFehler[] = [];
const MAX_LOG_ENTRIES = 50;

export const logFehler = (fehler: AppFehler) => {
  fehlerLog.unshift({
    ...fehler,
    timestamp: fehler.timestamp || Date.now(),
  });
  
  // Log begrenzen
  if (fehlerLog.length > MAX_LOG_ENTRIES) {
    fehlerLog.pop();
  }
};

export const getFehlerLog = (): AppFehler[] => [...fehlerLog];

export const clearFehlerLog = () => {
  fehlerLog.length = 0;
};
