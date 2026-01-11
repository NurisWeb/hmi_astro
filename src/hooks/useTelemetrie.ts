// hooks/useTelemetrie.ts
// Frontend Hook für Telemetrie-Daten

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { TelemetrieResponse } from '../services/mockBackend/types';
import { 
  alleParameter, 
  oeldruckParams,
  drehzahlParams,
  motorParams,
  tempLastParams,
  type ParameterConfig 
} from '../services/mockBackend/data/telemetrieData';

export const useTelemetrie = (intervalMs: number = 500) => {
  const [daten, setDaten] = useState<TelemetrieResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let aktiv = true;
    
    const holeDaten = async () => {
      try {
        const response = await api<TelemetrieResponse>('/api/stream/telemetry');
        if (aktiv && response.ok) {
          setDaten(response.data);
          setIsLoading(false);
          setError(null);
        }
      } catch (err) {
        console.error('Telemetrie-Fehler:', err);
        setError('Telemetrie-Verbindung fehlgeschlagen');
      }
    };
    
    holeDaten();
    const interval = setInterval(holeDaten, intervalMs);
    
    return () => {
      aktiv = false;
      clearInterval(interval);
    };
  }, [intervalMs]);
  
  // Helper: Parameter-Config nach ID holen
  const getConfig = useCallback((id: string): ParameterConfig | undefined => {
    return alleParameter.find(p => p.id === id);
  }, []);
  
  // Helper: Farbzone für Wert ermitteln
  const getZone = useCallback((config: ParameterConfig, value: number): 'green' | 'orange' | 'red' => {
    if (value >= config.red[0]) return 'red';
    if (value >= config.orange[0]) return 'orange';
    return 'green';
  }, []);
  
  // High-Priority Parameter filtern
  const highPriority = alleParameter.filter(p => p.priority === 'high');
  const lowPriority = alleParameter.filter(p => p.priority === 'low');
  
  return { 
    daten, 
    isLoading, 
    error,
    getConfig, 
    getZone,
    highPriority,
    lowPriority,
    alleParameter,
    // Kategorisierte Parameter
    oeldruckParams,
    drehzahlParams,
    motorParams,
    tempLastParams,
  };
};

// Typ-Export für Konsistenz
export type { TelemetrieResponse, ParameterConfig };
