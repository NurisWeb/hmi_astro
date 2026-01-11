// mockBackend/endpoints/handshake.ts
// Handshake nach Main_Doku.json:
// /api/handshake -> HTTP200: INIT, HTTP200: BUSY, HTTP_ELSE: Retry!

export type HandshakeResult = 
  | { status: 'INIT'; httpCode: 200 }
  | { status: 'BUSY'; httpCode: 200 }
  | { status: 'RETRY'; httpCode: number };

// State
let isBusy = false;
let handshakeAttempts = 0;

export const handleHandshake = (): HandshakeResult => {
  handshakeAttempts++;
  
  // Backend ist beschäftigt
  if (isBusy) {
    return { status: 'BUSY', httpCode: 200 };
  }
  
  // Simuliere: Beim 1. Versuch BUSY, dann INIT (für Tests)
  if (handshakeAttempts === 1) {
    return { status: 'BUSY', httpCode: 200 };
  }
  
  // Normale Initialisierung
  return { status: 'INIT', httpCode: 200 };
};

// Backend als busy markieren (z.B. während Prüfsequenz)
export const setBackendBusy = (busy: boolean): void => {
  isBusy = busy;
};

// Für Tests: Handshake zurücksetzen
export const resetHandshake = (): void => {
  handshakeAttempts = 0;
  isBusy = false;
};

// Status abfragen
export const getBackendStatus = () => ({
  isBusy,
  handshakeAttempts,
});
