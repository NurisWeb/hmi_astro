// hooks/useVerbindung.ts
// Verbindungsmanagement nach Main_Doku.json:
// - Handshake: INIT / BUSY / Retry
// - IsAlive alle 2 Sekunden
// - 2 Eskalationsstufen bei Fehler

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';

export type VerbindungsStatus = 'getrennt' | 'verbindet' | 'verbunden' | 'fehler';

const ISALIVE_INTERVAL = 2000; // 2 Sekunden
const HANDSHAKE_RETRY_DELAY = 1000; // 1 Sekunde bei BUSY
const MAX_RETRIES = 2; // Nach 2 Fehlern = Connection Lost

export const useVerbindung = () => {
  const [status, setStatus] = useState<VerbindungsStatus>('getrennt');
  const [fehler, setFehler] = useState<string | null>(null);
  
  const isAliveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryCount = useRef(0);
  const isMounted = useRef(true);
  
  // Cleanup bei Unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      stoppeIsAlive();
    };
  }, []);
  
  // IsAlive stoppen
  const stoppeIsAlive = useCallback(() => {
    if (isAliveTimer.current) {
      clearInterval(isAliveTimer.current);
      isAliveTimer.current = null;
    }
  }, []);
  
  // Connection Lost Handler
  const handleConnectionLost = useCallback(() => {
    stoppeIsAlive();
    if (isMounted.current) {
      setStatus('fehler');
      setFehler('Verbindung verloren');
    }
  }, [stoppeIsAlive]);
  
  // IsAlive starten (alle 2 Sekunden)
  const starteIsAlive = useCallback(() => {
    // Vorherigen Timer stoppen
    stoppeIsAlive();
    
    isAliveTimer.current = setInterval(async () => {
      try {
        const response = await api<string>('/api/isAlive');
        
        if (!isMounted.current) return;
        
        if (response.ok && response.data === 'ok') {
          // Alles OK
          retryCount.current = 0;
        } else if (response.data === 'ESCALATION') {
          // Eskalationsstufe 1: Retry
          retryCount.current++;
          console.warn(`IsAlive Eskalation: ${retryCount.current}/${MAX_RETRIES}`);
          
          if (retryCount.current >= MAX_RETRIES) {
            handleConnectionLost();
          }
        } else {
          // CONNECTION_LOST oder anderer Fehler
          handleConnectionLost();
        }
      } catch (err) {
        // Netzwerk-Fehler
        retryCount.current++;
        console.error('IsAlive Fehler:', err);
        
        if (retryCount.current >= MAX_RETRIES) {
          handleConnectionLost();
        }
      }
    }, ISALIVE_INTERVAL);
  }, [stoppeIsAlive, handleConnectionLost]);
  
  // Handshake durchführen
  const verbinden = useCallback(async () => {
    setStatus('verbindet');
    setFehler(null);
    retryCount.current = 0;
    
    try {
      const response = await api<string>('/api/handshake', 'POST');
      
      if (!isMounted.current) return;
      
      if (response.ok && response.data === 'INIT') {
        // Erfolgreich verbunden
        setStatus('verbunden');
        starteIsAlive();
      } else if (response.data === 'BUSY') {
        // Backend beschäftigt → Retry nach 1 Sekunde
        console.log('Backend BUSY, retry in 1s...');
        setTimeout(() => {
          if (isMounted.current) {
            verbinden();
          }
        }, HANDSHAKE_RETRY_DELAY);
      } else {
        // Anderer Fehler
        setStatus('fehler');
        setFehler('Handshake fehlgeschlagen');
      }
    } catch (err) {
      console.error('Handshake Fehler:', err);
      if (isMounted.current) {
        setStatus('fehler');
        setFehler('Verbindungsfehler');
      }
    }
  }, [starteIsAlive]);
  
  // Verbindung trennen
  const trennen = useCallback(() => {
    stoppeIsAlive();
    retryCount.current = 0;
    setStatus('getrennt');
    setFehler(null);
  }, [stoppeIsAlive]);
  
  // Reconnect versuchen
  const reconnect = useCallback(() => {
    trennen();
    setTimeout(verbinden, 100);
  }, [trennen, verbinden]);
  
  return { 
    status, 
    fehler, 
    verbinden, 
    trennen,
    reconnect,
    istVerbunden: status === 'verbunden',
    istVerbindet: status === 'verbindet',
    hatFehler: status === 'fehler',
  };
};
