// services/api.ts
// API-Wrapper für Frontend - schaltet zwischen Mock und echtem Backend

import { mockApi, type MockApiResponse } from './mockBackend';

// === KONFIGURATION ===
const USE_MOCK = false;  // true = Mock-Backend, false = echtes Backend
const API_BASE = 'http://192.168.4.1';
const TIMEOUT_MS = 15 * 60 * 1000; // 15 Minuten Timeout

// === API Response Type ===
export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
}

// === API Response Types ===
// Prüfplan-Step aus der API (Main_Doku.json Format)
export interface ApiPruefplanStep {
  id: number;
  name: string;
  endpointUrl: string;
  condition: string | null;
}

// Prüfplan aus der API (Main_Doku.json Format)
export interface ApiPruefplan {
  id: number;
  name: string;
  steps: ApiPruefplanStep[];
}

// API Response für /api/pruefplaene
export interface ApiPruefplaeneResponse {
  t: 'plans';
  plans: ApiPruefplan[];
}

// === Haupt-API Funktion ===
export const api = async <T = any>(
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<ApiResponse<T>> => {
  
  // Mock-Backend verwenden (ohne AbortController, da synchron im Browser)
  if (USE_MOCK) {
    const response = await mockApi(endpoint, method, body);
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      data: response.data as T,
    };
  }
  
  // Echtes Backend mit 15 Minuten Timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const data = await response.json();
    
    return {
      ok: response.ok,
      status: response.status,
      data: data as T,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // Timeout abgefangen
    if (error.name === 'AbortError') {
      console.error('API Timeout nach 15 Minuten');
      return {
        ok: false,
        status: 408,
        data: { error: 'Zeitüberschreitung', message: 'Anfrage nach 15 Minuten abgebrochen' } as T,
      };
    }
    
    console.error('API Error:', error);
    return {
      ok: false,
      status: 0,
      data: { error: 'Network error' } as T,
    };
  }
};

// === Convenience-Methoden ===
export const apiGet = <T = any>(endpoint: string) => 
  api<T>(endpoint, 'GET');

export const apiPost = <T = any>(endpoint: string, body?: any) => 
  api<T>(endpoint, 'POST', body);

// === Spezifische API-Aufrufe ===
export const fetchTelemetry = () => 
  apiGet('/api/stream/telemetry');

export const fetchPruefplaene = () => 
  apiGet<ApiPruefplaeneResponse>('/api/pruefplaene');

export const doHandshake = () => 
  apiGet('/api/handshake');

export const checkIsAlive = () => 
  apiGet('/api/isAlive');

export const startManual = () => 
  apiPost('/api/cmd/startManual');

export const stopManual = () => 
  apiPost('/api/cmd/stopManual');

export const setGear = (gear: number) => 
  apiPost('/api/cmd/setGear', { gear });

export const setMotorFreq = (freq: number) => 
  apiPost('/api/cmd/setFuMotorFreq', { freq });

export const stopAll = () => 
  apiPost('/api/cmd/stop');

export const runSequence = (endpointUrl: string) => 
  apiPost(endpointUrl);
