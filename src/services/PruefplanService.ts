// ============================================
// Prüfplan Service - Mock-Daten für Prüfpläne
// ============================================

import type { Pruefplan, Pruefschritt } from '../types/menu.types';

// ============================================
// Mock Prüfpläne
// ============================================

const mockPruefplaene: Pruefplan[] = [
  {
    id: 'dsg-grund',
    name: 'DSG-Grundprüfung',
    schritte: [
      { id: 's1', nummer: 1, bezeichnung: 'Getriebeöl befüllen', status: 'wartend' },
      { id: 's2', nummer: 2, bezeichnung: 'Öl auf Temperatur bringen', status: 'wartend' },
      { id: 's3', nummer: 3, bezeichnung: 'Druckaufbau prüfen', status: 'wartend' },
      { id: 's4', nummer: 4, bezeichnung: 'Gangwechsel-Test', status: 'wartend' },
      { id: 's5', nummer: 5, bezeichnung: 'Drehmoment messen', status: 'wartend' },
      { id: 's6', nummer: 6, bezeichnung: 'Vibrationsprüfung', status: 'wartend' },
      { id: 's7', nummer: 7, bezeichnung: 'Abkühlung einleiten', status: 'wartend' },
      { id: 's8', nummer: 8, bezeichnung: 'Protokoll erstellen', status: 'wartend' },
    ]
  },
  {
    id: 'bremsmotor',
    name: 'Bremsmotor-Prüfung',
    schritte: [
      { id: 'b1', nummer: 1, bezeichnung: 'Motor anschließen', status: 'wartend' },
      { id: 'b2', nummer: 2, bezeichnung: 'Bremse lösen', status: 'wartend' },
      { id: 'b3', nummer: 3, bezeichnung: 'Drehzahl hochfahren', status: 'wartend' },
      { id: 'b4', nummer: 4, bezeichnung: 'Bremskraft messen', status: 'wartend' },
      { id: 'b5', nummer: 5, bezeichnung: 'Protokoll erstellen', status: 'wartend' },
    ]
  },
  {
    id: 'oeldruck',
    name: 'Öldruckprüfung',
    schritte: [
      { id: 'o1', nummer: 1, bezeichnung: 'System befüllen', status: 'wartend' },
      { id: 'o2', nummer: 2, bezeichnung: 'Druck aufbauen', status: 'wartend' },
      { id: 'o3', nummer: 3, bezeichnung: 'Leckage prüfen', status: 'wartend' },
    ]
  }
];

// ============================================
// Prüfplan Service Klasse
// ============================================

class PruefplanService {
  private pruefplaene: Pruefplan[] = this.deepClone(mockPruefplaene);

  // Alle Prüfpläne abrufen
  getPruefplaene(): Pruefplan[] {
    return this.pruefplaene;
  }

  // Einzelnen Prüfplan abrufen
  getPruefplan(id: string): Pruefplan | undefined {
    return this.pruefplaene.find(p => p.id === id);
  }

  // Schritt-Status aktualisieren
  updateSchrittStatus(
    pruefplanId: string, 
    schrittId: string, 
    status: Pruefschritt['status']
  ): void {
    const plan = this.pruefplaene.find(p => p.id === pruefplanId);
    if (plan) {
      const schritt = plan.schritte.find(s => s.id === schrittId);
      if (schritt) {
        schritt.status = status;
      }
    }
  }

  // Alle Schritte eines Plans zurücksetzen
  resetPruefplan(pruefplanId: string): void {
    const plan = this.pruefplaene.find(p => p.id === pruefplanId);
    if (plan) {
      plan.schritte.forEach(s => {
        s.status = 'wartend';
      });
    }
  }

  // Alle Prüfpläne zurücksetzen
  resetAll(): void {
    this.pruefplaene = this.deepClone(mockPruefplaene);
  }

  // Deep Clone Helper
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}

export const pruefplanService = new PruefplanService();
export default PruefplanService;
