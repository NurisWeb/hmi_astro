// mockBackend/index.ts
// Router für Mock-Backend API

import { handleTelemetry } from './endpoints/telemetry';
import { handlePruefplaene } from './endpoints/pruefplaene';
import { handleHandshake } from './endpoints/handshake';
import { handleIsAlive } from './endpoints/isalive';
import { handleCommand } from './endpoints/commands';

const DELAY = 100; // Simulierte Netzwerk-Latenz in ms

export interface MockApiResponse {
  status: number;
  data: any;
}

export const mockApi = async (
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<MockApiResponse> => {
  
  // Basis-Latenz simulieren
  await new Promise(r => setTimeout(r, DELAY));
  
  // === Telemetrie Stream ===
  if (endpoint === '/api/stream/telemetry') {
    return {
      status: 200,
      data: handleTelemetry(),
    };
  }
  
  // === Prüfpläne ===
  if (endpoint === '/api/pruefplaene') {
    return {
      status: 200,
      data: handlePruefplaene(),
    };
  }
  
  // === Handshake ===
  if (endpoint === '/api/handshake') {
    const result = handleHandshake();
    return {
      status: result.httpCode,
      data: result.status,
    };
  }
  
  // === IsAlive ===
  if (endpoint === '/api/isAlive') {
    const result = handleIsAlive();
    return {
      status: result.httpCode,
      data: result.status,
    };
  }
  
  // === Commands ===
  if (endpoint.startsWith('/api/cmd/')) {
    const result = await handleCommand(endpoint, body);
    return {
      status: result.status,
      data: {
        status: result.response,
        message: result.message,
      },
    };
  }
  
  // === Unknown Endpoint ===
  return {
    status: 404,
    data: { error: 'Unknown endpoint', endpoint },
  };
};
