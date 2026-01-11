// ============================================
// Menu Types für Prüfstand HMI
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
// Prüfplan Types
// ============================================

export type PruefschrittStatus = 'wartend' | 'aktiv' | 'abgeschlossen';

export interface Pruefschritt {
  id: string;
  nummer: number;
  bezeichnung: string;
  status: PruefschrittStatus;
}

export interface Pruefplan {
  id: string;
  name: string;
  schritte: Pruefschritt[];
}

export interface ConditionNachricht {
  id: string;
  text: string;
  schrittId: string;
}

export type PruefplanAnsicht = 'liste' | 'aktiv';





