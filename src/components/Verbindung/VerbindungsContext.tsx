// ============================================
// VerbindungsContext - Globaler Verbindungs-State
// Zentrale Verwaltung der Prüfstand-Verbindung
// ============================================

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { VerbindungsStatus, VerbindungsState } from './types';

// ============================================
// Context Interface
// ============================================
interface VerbindungsContextType {
  // State
  verbindung: VerbindungsState;
  laufzeit: string;
  fortschritt: number | undefined;
  
  // Computed
  istVerbunden: boolean;
  verbindetGerade: boolean;
  
  // Actions
  verbindungAufbauen: () => void;
  verbindungTrennen: () => void;
  fehlerZuruecksetzen: () => void;
}

// ============================================
// Initial State
// ============================================
const initialVerbindungsState: VerbindungsState = {
  status: 'getrennt',
  zeitpunktVerbunden: undefined,
  letzterFehler: undefined,
  verbindungsversuch: 0,
};

// ============================================
// Context erstellen
// ============================================
const VerbindungsContext = createContext<VerbindungsContextType | null>(null);

// ============================================
// Provider Component
// ============================================
interface VerbindungsProviderProps {
  children: React.ReactNode;
  onVerbunden?: () => void;        // Callback wenn verbunden
  onGetrennt?: () => void;         // Callback wenn getrennt
  onFehler?: (fehler: string) => void;  // Callback bei Fehler
}

export const VerbindungsProvider: React.FC<VerbindungsProviderProps> = ({
  children,
  onVerbunden,
  onGetrennt,
  onFehler,
}) => {
  // ============================================
  // State
  // ============================================
  const [verbindung, setVerbindung] = useState<VerbindungsState>(initialVerbindungsState);
  const [laufzeit, setLaufzeit] = useState<string>('00:00:00');
  const [fortschritt, setFortschritt] = useState<number | undefined>(undefined);
  
  // Refs für Cleanup
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const laufzeitIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ============================================
  // Computed Values
  // ============================================
  const istVerbunden = verbindung.status === 'verbunden';
  const verbindetGerade = verbindung.status === 'verbindet';

  // ============================================
  // Laufzeit-Timer
  // ============================================
  useEffect(() => {
    // Cleanup vorheriges Interval
    if (laufzeitIntervalRef.current) {
      clearInterval(laufzeitIntervalRef.current);
      laufzeitIntervalRef.current = null;
    }

    if (verbindung.status === 'verbunden' && verbindung.zeitpunktVerbunden) {
      // Timer starten
      const updateLaufzeit = () => {
        const jetzt = new Date();
        const diff = jetzt.getTime() - verbindung.zeitpunktVerbunden!.getTime();
        
        const stunden = Math.floor(diff / 3600000);
        const minuten = Math.floor((diff % 3600000) / 60000);
        const sekunden = Math.floor((diff % 60000) / 1000);
        
        setLaufzeit(
          `${stunden.toString().padStart(2, '0')}:` +
          `${minuten.toString().padStart(2, '0')}:` +
          `${sekunden.toString().padStart(2, '0')}`
        );
      };

      // Initial update
      updateLaufzeit();
      
      // Interval starten
      laufzeitIntervalRef.current = setInterval(updateLaufzeit, 1000);
    } else {
      // Timer zurücksetzen
      setLaufzeit('00:00:00');
    }

    return () => {
      if (laufzeitIntervalRef.current) {
        clearInterval(laufzeitIntervalRef.current);
      }
    };
  }, [verbindung.status, verbindung.zeitpunktVerbunden]);

  // ============================================
  // Verbindung aufbauen
  // ============================================
  const verbindungAufbauen = useCallback(() => {
    // Nicht starten wenn bereits verbindet
    if (verbindung.status === 'verbindet') return;

    // Status auf "verbindet" setzen
    setVerbindung(prev => ({
      ...prev,
      status: 'verbindet',
      letzterFehler: undefined,
      verbindungsversuch: (prev.verbindungsversuch || 0) + 1,
    }));
    setFortschritt(0);

    // Vorheriges Interval cleanen
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // Simulierter Verbindungsaufbau mit Fortschritt
    let progress = 0;
    progressIntervalRef.current = setInterval(() => {
      progress += Math.random() * 15 + 5; // 5-20% pro Tick
      
      if (progress >= 100) {
        progress = 100;
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        
        // Simuliere möglichen Fehler (10% Chance) - für Tests
        // In Produktion: Hier echte API-Antwort verarbeiten
        const simuliereFehler = false; // Math.random() < 0.1;
        
        if (simuliereFehler) {
          // Fehler simulieren
          setTimeout(() => {
            setVerbindung(prev => ({
              ...prev,
              status: 'getrennt',
              letzterFehler: 'Verbindung fehlgeschlagen - Prüfstand nicht erreichbar',
            }));
            setFortschritt(undefined);
            onFehler?.('Verbindung fehlgeschlagen - Prüfstand nicht erreichbar');
          }, 200);
        } else {
          // Verbindung erfolgreich
          setTimeout(() => {
            setVerbindung({
              status: 'verbunden',
              zeitpunktVerbunden: new Date(),
              letzterFehler: undefined,
              verbindungsversuch: 0,
            });
            setFortschritt(undefined);
            onVerbunden?.();
          }, 200);
        }
      }
      setFortschritt(Math.min(Math.round(progress), 100));
    }, 300);
  }, [verbindung.status, onVerbunden, onFehler]);

  // ============================================
  // Verbindung trennen
  // ============================================
  const verbindungTrennen = useCallback(() => {
    // Laufende Verbindungsversuche abbrechen
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    // State komplett zurücksetzen
    setVerbindung(initialVerbindungsState);
    setFortschritt(undefined);
    setLaufzeit('00:00:00');
    
    // Callback auslösen
    onGetrennt?.();
  }, [onGetrennt]);

  // ============================================
  // Fehler zurücksetzen
  // ============================================
  const fehlerZuruecksetzen = useCallback(() => {
    setVerbindung(prev => ({
      ...prev,
      letzterFehler: undefined,
    }));
  }, []);

  // ============================================
  // Cleanup bei Unmount
  // ============================================
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (laufzeitIntervalRef.current) {
        clearInterval(laufzeitIntervalRef.current);
      }
    };
  }, []);

  // ============================================
  // Context Value
  // ============================================
  const contextValue: VerbindungsContextType = {
    verbindung,
    laufzeit,
    fortschritt,
    istVerbunden,
    verbindetGerade,
    verbindungAufbauen,
    verbindungTrennen,
    fehlerZuruecksetzen,
  };

  return (
    <VerbindungsContext.Provider value={contextValue}>
      {children}
    </VerbindungsContext.Provider>
  );
};

// ============================================
// Custom Hook für einfachen Zugriff
// ============================================
export const useVerbindung = (): VerbindungsContextType => {
  const context = useContext(VerbindungsContext);
  
  if (!context) {
    throw new Error(
      'useVerbindung muss innerhalb eines VerbindungsProviders verwendet werden'
    );
  }
  
  return context;
};

// ============================================
// Export Context für Tests
// ============================================
export { VerbindungsContext };
