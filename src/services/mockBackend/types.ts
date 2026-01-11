// mockBackend/types.ts
// Types basierend auf Main_Doku.json

/**
 * Telemetrie-Response Format
 * p: [K1Öldruck, K2Öldruck, SystemÖldruck, EDiffÖldruck] (0-60 bar)
 * g: [Primärgang, Sekundärgang]
 * r: [DrehzahlK1, DrehzahlK2, DrehzahlAusgleich] (0-1000)
 * m: [DrehzahlAntriebmotor, KWB1, KWB2] (Motor: 0-3530)
 * l: [ÖltempHydraulik, ÖltempRadsatz, PrüfstandAuslastung] (Temp: 0-110, Auslastung: 0-100)
 */
export interface TelemetrieResponse {
  t: 'tele';
  ts: number;
  p: number[];  // Öldrücke: K1, K2, System, EDiff
  g: number[];  // Gänge: Primär, Sekundär
  r: number[];  // Drehzahlen: K1, K2, Ausgleich
  m: number[];  // Motor: Antrieb, KWB1, KWB2
  l: number[];  // Temp/Last: ÖltempHyd, ÖltempRad, Auslastung
  s: string;    // Status-Nachricht
}

// Prüfplan-Step
export interface PruefplanStep {
  id: number;
  name: string;
  endpointUrl: string;
  condition: string | null;
}

// Prüfplan
export interface Pruefplan {
  id: number;
  name: string;
  steps: PruefplanStep[];
}

// Prüfpläne-Response
export interface PruefplaeneResponse {
  t: 'plans';
  plans: Pruefplan[];
}

// API Status-Types
export type HandshakeStatus = 'INIT' | 'BUSY';
export type CommandResponse = 'ok' | 'nok' | 'iO' | 'niO';
export type IsAliveResponse = 'ok' | 'ESCALATION' | 'CONNECTION_LOST';

// Command-Endpoints (aus Main_Doku.json)
export type CommandEndpoint =
  | '/api/cmd/startManual'
  | '/api/cmd/stopManual'
  | '/api/cmd/setGear'
  | '/api/cmd/setFuMotorFreq'
  | '/api/cmd/stop'
  | '/api/cmd/seqcheckelectric'
  | '/api/cmd/seqchecksensordata'
  | '/api/cmd/seqshifttest'
  | '/api/cmd/sequenzSafe'
  | '/api/cmd/sequenzacctesthigh'
  | '/api/cmd/seqsealtest'
  | '/api/cmd/seqaccshiftfast';
