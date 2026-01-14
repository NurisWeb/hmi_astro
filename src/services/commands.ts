// services/commands.ts
// Frontend API-Funktionen für Commands (aus Main_Doku.json)

import { api } from './api';

// === RESPONSE TYPES ===
interface CmdResult {
  ok: boolean;
  message?: string;
}

// === MANUAL MODE ===

export const startManual = async (): Promise<CmdResult> => {
  const response = await api('/api/cmd/startManual', 'POST');
  return { 
    ok: response.ok && response.data?.status === 'ok',
    message: response.data?.message,
  };
};

export const stopManual = async (): Promise<CmdResult> => {
  const response = await api('/api/cmd/stopManual', 'POST');
  return { 
    ok: response.ok && response.data?.status === 'ok',
    message: response.data?.message,
  };
};

// === STEUERUNG ===

export const setGear = async (gear: number): Promise<CmdResult> => {
  const response = await api('/api/cmd/setGear', 'POST', { gear });
  return { 
    ok: response.ok && response.data?.status === 'ok',
    message: response.data?.message,
  };
};

export const setMotorFreq = async (freq: number): Promise<CmdResult> => {
  const response = await api('/api/cmd/setFuMotorFreq', 'POST', { freq });
  return { 
    ok: response.ok && response.data?.status === 'ok',
    message: response.data?.message,
  };
};

// === SOFT-AUS ===

export const cmdStop = async (): Promise<CmdResult> => {
  const response = await api('/api/cmd/stop', 'POST');
  return { 
    ok: response.ok && response.data?.status === 'ok',
    message: response.data?.message,
  };
};

// === PRÜFPLAN-SCHRITT AUSFÜHREN ===

export const executeStep = async (endpointUrl: string): Promise<{
  ok: boolean;
  result: 'iO' | 'niO' | null;
  message?: string;
}> => {
  const response = await api(endpointUrl, 'POST');
  const status = response.data?.status;
  
  return { 
    ok: response.ok,
    result: status === 'iO' ? 'iO' : status === 'niO' ? 'niO' : null,
    message: response.data?.message,
  };
};

// === CMD/X MIT 15 MINUTEN TIMEOUT ===

// commands.ts - VEREINFACHT
export const cmdXMitTimeout = async (): Promise<{
  ok: boolean;
  result: 'iO' | 'niO' | null;
  timedOut: boolean;
}> => {
  const response = await api('/api/cmd/x', 'POST');
  
  // Timeout-Check: api.ts gibt status 408 bei Timeout zurück
  if (response.status === 408) {
    return { ok: false, result: null, timedOut: true };
  }
  
  return { 
    ok: response.ok, 
    result: response.data?.status === 'iO' ? 'iO' : 'niO',
    timedOut: false,
  };
};