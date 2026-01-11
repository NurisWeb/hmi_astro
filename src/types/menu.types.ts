// ============================================
// Menu Types für Prüfstand HMI
// Angepasst an Main_Doku.json
// ============================================

// ============================================
// Menu Types
// ============================================

export type MenuPanel = 
  | 'none' 
  | 'gear' 
  | 'program' 
  | 'sensors' 
  | 'regelung' 
  | 'config' 
  | 'dsg';

export interface MenuItem {
  id: MenuPanel;
  label: string;
  icon: string;
  subtitle?: string;
}

// ============================================
// Prüfplan Types (aus Main_Doku.json)
// ============================================

export type PruefschrittStatus = 'wartend' | 'aktiv' | 'abgeschlossen' | 'fehler';

// Format exakt wie in Main_Doku.json
export interface Pruefschritt {
  id: number;                    // Step ID (0, 1, 2, ...)
  nummer: number;                // Anzeige-Nummer (1, 2, 3, ...)
  bezeichnung: string;           // Step-Name aus Main_Doku
  endpointUrl: string;           // API-Endpoint z.B. "/api/cmd/seqcheckelectric"
  condition: string | null;      // Condition-Text oder null
  status: PruefschrittStatus;    // Laufzeit-Status
}

export interface Pruefplan {
  id: number;                    // Plan ID (0, 1)
  name: string;                  // Plan-Name
  schritte: Pruefschritt[];      // Steps
}

export interface ConditionNachricht {
  id: string;
  text: string;
  schrittId: number;
}

export type PruefplanAnsicht = 'liste' | 'aktiv';

// ============================================
// API Response Types (aus Main_Doku.json)
// ============================================

export type PruefErgebnis = 'iO' | 'niO';
