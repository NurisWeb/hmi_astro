// mockBackend/endpoints/commands.ts
// Commands aus Main_Doku.json:
// /api/cmd/x           -> synchron, 200: iO/niO
// /api/cmd/startManual -> 200: ok / else: nok
// /api/cmd/stopManual  -> 200: ok / else: nok
// /api/cmd/setGear     -> POST, primärgang, 200: ok / else: nok
// /api/cmd/setFuMotorFreq -> POST, drehzahl, 200: ok / else: nok
// /api/cmd/stop        -> 200: ok / else: nok (Soft-Aus)

import { setBackendBusy } from './handshake';
import { setBaseValues } from '../data/telemetrieData';

// Response Type
export interface CmdResponse {
  status: number;
  response: 'ok' | 'nok' | 'iO' | 'niO';
  message?: string;
}

// Mindest-Delay für realistisches Verhalten (ms)
const MINDEST_DELAY = 2000;

// Simulierte Ausführungszeiten (ms) - min. 2 Sekunden für manuelle Steuerung
const COMMAND_DURATIONS: Record<string, number> = {
  '/api/cmd/startManual': MINDEST_DELAY,
  '/api/cmd/stopManual': 500,
  '/api/cmd/setGear': MINDEST_DELAY,
  '/api/cmd/setFuMotorFreq': MINDEST_DELAY,
  '/api/cmd/stop': 500,
  // Prüfsequenzen (aus Main_Doku.json)
  '/api/cmd/seqcheckelectric': 2000,
  '/api/cmd/seqchecksensordata': 1500,
  '/api/cmd/seqshifttest': 3000,
  '/api/cmd/sequenzSafe': 2500,
  '/api/cmd/sequenzacctesthigh': 4000,
  '/api/cmd/seqsealtest': 2000,
  '/api/cmd/seqaccshiftfast': 3500,
};

// === SIMULIERTER STATE ===
let manualModeAktiv = false;
let aktuellerGang = 0;
let aktuelleDrehzahl = 0;

// Min. Drehzahl für Gangwechsel
const MIN_DREHZAHL_FUER_GANG = 300;

export const handleCommand = async (
  endpoint: string,
  body?: any
): Promise<CmdResponse> => {
  
  const duration = COMMAND_DURATIONS[endpoint] || 500;
  
  // Bei Sequenz-Commands Backend als busy markieren
  if (endpoint.includes('seq')) {
    setBackendBusy(true);
  }
  
  // Simuliere Ausführungszeit
  await new Promise(r => setTimeout(r, duration));
  
  // === COMMAND ROUTING ===
  switch (endpoint) {
    
    // --- Manual Mode starten ---
    case '/api/cmd/startManual':
      manualModeAktiv = true;
      return { status: 200, response: 'ok' };
    
    // --- Manual Mode stoppen ---
    case '/api/cmd/stopManual':
      manualModeAktiv = false;
      aktuellerGang = 0;
      aktuelleDrehzahl = 0;
      setBaseValues({ g: [0, 0], m: [0, 0, 0] });
      return { status: 200, response: 'ok' };
    
    // --- Gang setzen ---
    case '/api/cmd/setGear':
      // Prüfe: Manual Mode aktiv?
      if (!manualModeAktiv) {
        return { 
          status: 400, 
          response: 'nok', 
          message: 'Manual Mode nicht aktiv' 
        };
      }
      // Prüfe: Drehzahl >= 300?
      if (aktuelleDrehzahl < MIN_DREHZAHL_FUER_GANG) {
        return { 
          status: 400, 
          response: 'nok', 
          message: `Drehzahl zu niedrig (min. ${MIN_DREHZAHL_FUER_GANG})` 
        };
      }
      // Gang setzen
      if (body?.gear !== undefined) {
        // Extra Delay bei hoher Drehzahl (> 2000)
        if (aktuelleDrehzahl > 2000) {
          await new Promise(r => setTimeout(r, 3000));
        }
        aktuellerGang = body.gear;
        setBaseValues({ g: [aktuellerGang, 0] });
        return { status: 200, response: 'ok' };
      }
      return { status: 400, response: 'nok', message: 'Kein Gang angegeben' };
    
    // --- Motor-Drehzahl setzen ---
    case '/api/cmd/setFuMotorFreq':
      // Prüfe: Manual Mode aktiv?
      if (!manualModeAktiv) {
        return { 
          status: 400, 
          response: 'nok', 
          message: 'Manual Mode nicht aktiv' 
        };
      }
      // Drehzahl setzen (0-3530)
      if (body?.freq !== undefined) {
        aktuelleDrehzahl = Math.min(3530, Math.max(0, body.freq));
        setBaseValues({ m: [aktuelleDrehzahl, 1.5, 1.2] });
        return { status: 200, response: 'ok' };
      }
      return { status: 400, response: 'nok', message: 'Keine Frequenz angegeben' };
    
    // --- SOFT-AUS: Alles stoppen ---
    case '/api/cmd/stop':
      manualModeAktiv = false;
      aktuellerGang = 0;
      aktuelleDrehzahl = 0;
      setBaseValues({ g: [0, 0], m: [0, 0, 0] });
      setBackendBusy(false);
      return { status: 200, response: 'ok', message: 'Soft-Aus durchgeführt' };
    
    // --- Prüfsequenzen ---
    default:
      if (endpoint.startsWith('/api/cmd/seq')) {
        setBackendBusy(false);
        // Simuliere: 90% Erfolg, 10% Fehler
        const success = Math.random() > 0.1;
        return { status: 200, response: success ? 'iO' : 'niO' };
      }
      
      return { status: 404, response: 'nok', message: 'Unbekannter Command' };
  }
};

// === GETTER FÜR STATE ===
export const getCommandState = () => ({
  manualModeAktiv,
  aktuellerGang,
  aktuelleDrehzahl,
});

// === SETTER FÜR TESTS ===
export const resetCommandState = () => {
  manualModeAktiv = false;
  aktuellerGang = 0;
  aktuelleDrehzahl = 0;
};
