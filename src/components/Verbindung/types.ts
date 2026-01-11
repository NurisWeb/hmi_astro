// ============================================
// Verbindungs-Management Types
// Industrial HMI Connection State
// ============================================

/**
 * Verbindungsstatus des Prüfstands
 * 
 * - getrennt: Keine aktive Verbindung
 * - verbindet: Verbindungsaufbau läuft
 * - verbunden: Aktive Verbindung zum Prüfstand
 */
export type VerbindungsStatus = 'getrennt' | 'verbindet' | 'verbunden';

/**
 * Vollständiger Verbindungs-State
 */
export interface VerbindungsState {
  status: VerbindungsStatus;
  zeitpunktVerbunden?: Date;     // Wann wurde verbunden (für Laufzeit)
  letzterFehler?: string;        // Letzter Verbindungsfehler
  verbindungsversuch?: number;   // Aktueller Versuch (1, 2, 3...)
}

/**
 * Props für VerbindungsButton
 */
export interface VerbindungsButtonProps {
  status: VerbindungsStatus;
  onVerbinden: () => void;
  onTrennen: () => void;
  disabled?: boolean;
}

/**
 * Props für BlankState (Nicht-Verbunden Ansicht)
 */
export interface BlankStateProps {
  status: VerbindungsStatus;
  onVerbinden: () => void;
  fortschritt?: number;          // 0-100 für Ladebalken
  fehler?: string;               // Fehlermeldung anzeigen
}
