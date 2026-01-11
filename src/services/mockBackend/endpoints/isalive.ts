// mockBackend/endpoints/isalive.ts
// IsAlive nach Main_Doku.json:
// /api/isAlive -> HTTP200: ok
//   wenn 200 -> retry in 2 sekunden
//   wenn else -> 2 eskalationsstufen:
//     1) retry in 2 sekunden
//     2) connection lost

export type IsAliveResult = 
  | { status: 'ok'; httpCode: 200 }
  | { status: 'ESCALATION'; httpCode: number }
  | { status: 'CONNECTION_LOST'; httpCode: number };

// Dev-State für Fehlersimulation
let simuliereVerbindungsfehler = false;
let eskalationsStufe = 0;

export const handleIsAlive = (): IsAliveResult => {
  // Fehler simulieren?
  if (simuliereVerbindungsfehler) {
    eskalationsStufe++;
    
    if (eskalationsStufe === 1) {
      // Stufe 1: Erster Fehler → Retry
      return { status: 'ESCALATION', httpCode: 500 };
    }
    
    // Stufe 2: Connection Lost
    return { status: 'CONNECTION_LOST', httpCode: 0 };
  }
  
  // Normal: OK
  eskalationsStufe = 0;
  return { status: 'ok', httpCode: 200 };
};

// === DEV-TOOLS ===

// Verbindungsfehler simulieren
export const setSimulateConnectionError = (value: boolean): void => {
  simuliereVerbindungsfehler = value;
  if (!value) {
    eskalationsStufe = 0;
  }
};

// Für Tests: Alles zurücksetzen
export const resetIsAlive = (): void => {
  simuliereVerbindungsfehler = false;
  eskalationsStufe = 0;
};

// Status abfragen
export const getIsAliveStatus = () => ({
  simuliereVerbindungsfehler,
  eskalationsStufe,
});
