// ============================================
// API-Funktionen für Manuelle Gangauswahl
// Verwendet jetzt das MockBackend via api()
// ============================================

import { api } from './api';

// Response-Type
export interface ApiResponse {
  ok: boolean;
  status: number;
  data: any;
}

// ============================================
// API-Funktionen (via MockBackend)
// ============================================

// Manual Mode starten
// /api/cmd/startManual -> 200: ok / else: nok
export const startManual = async (): Promise<boolean> => {
  try {
    console.log('API: startManual()');
    const response = await api('/api/cmd/startManual', 'POST');
    console.log('API: startManual() →', response.ok ? 'OK' : 'FEHLER', response.data);
    return response.ok && response.data?.status === 'ok';
  } catch (error) {
    console.error('startManual fehlgeschlagen:', error);
    return false;
  }
};

// Manual Mode stoppen
// /api/cmd/stopManual -> 200: ok / else: nok
export const stopManual = async (): Promise<boolean> => {
  try {
    console.log('API: stopManual()');
    const response = await api('/api/cmd/stopManual', 'POST');
    console.log('API: stopManual() →', response.ok ? 'OK' : 'FEHLER', response.data);
    return response.ok && response.data?.status === 'ok';
  } catch (error) {
    console.error('stopManual fehlgeschlagen:', error);
    return false;
  }
};

// Gang setzen
// /api/cmd/setGear -> POST { gear: number } -> 200: ok / else: nok
export const setGear = async (gang: number | string): Promise<ApiResponse> => {
  try {
    console.log('API: setGear()', gang);
    const response = await api('/api/cmd/setGear', 'POST', { gear: gang });
    console.log('API: setGear() →', response.ok ? 'OK' : 'FEHLER', response.data);
    return {
      ok: response.ok && response.data?.status === 'ok',
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    console.error('setGear fehlgeschlagen:', error);
    return { ok: false, status: 0, data: null };
  }
};

// Drehzahl setzen
// /api/cmd/setFuMotorFreq -> POST { freq: number } -> 200: ok / else: nok
export const setMotorFrequenz = async (frequenz: number): Promise<ApiResponse> => {
  try {
    console.log('API: setMotorFrequenz()', frequenz);
    const response = await api('/api/cmd/setFuMotorFreq', 'POST', { freq: frequenz });
    console.log('API: setMotorFrequenz() →', response.ok ? 'OK' : 'FEHLER', response.data);
    return {
      ok: response.ok && response.data?.status === 'ok',
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    console.error('setMotorFrequenz fehlgeschlagen:', error);
    return { ok: false, status: 0, data: null };
  }
};

// Soft-Aus (Notfall)
// /api/cmd/stop -> 200: ok / else: nok
export const cmdStop = async (): Promise<boolean> => {
  try {
    console.log('API: cmdStop() - SOFT-AUS');
    const response = await api('/api/cmd/stop', 'POST');
    console.log('API: cmdStop() →', response.ok ? 'OK' : 'FEHLER', response.data);
    return response.ok && response.data?.status === 'ok';
  } catch (error) {
    console.error('cmdStop fehlgeschlagen:', error);
    return false;
  }
};

// ============================================
// Response-Prüfung
// ============================================

export type AntwortStatus = 'ok' | 'warten' | 'fehler';

export const pruefeAntwort = (response: ApiResponse): AntwortStatus => {
  // Erfolg
  if (response.ok && response.status === 200) {
    return 'ok';
  }
  
  // Backend ist busy
  if (response.data?.status === 'busy' || response.data?.status === 'wait') {
    return 'warten';
  }
  
  // Alles andere = Fehler
  return 'fehler';
};
