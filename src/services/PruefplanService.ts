// ============================================
// Prüfplan Service - EXAKT nach Main_Doku.json
// ============================================

import type { Pruefplan, Pruefschritt, PruefschrittStatus } from '../types/menu.types';

// ============================================
// Prüfpläne EXAKT aus Main_Doku.json
// ============================================

const pruefplaeneAusMainDoku: Pruefplan[] = [
  {
    id: 0,
    name: 'Funktionstest lastfrei',
    schritte: [
      {
        id: 0,
        nummer: 1,
        bezeichnung: 'Elektrische Prüfung SAP/CCP',
        endpointUrl: '/api/cmd/seqcheckelectric',
        condition: null,
        status: 'wartend',
      },
      {
        id: 1,
        nummer: 2,
        bezeichnung: 'Sensordaten Validierung',
        endpointUrl: '/api/cmd/seqchecksensordata',
        condition: null,
        status: 'wartend',
      },
      {
        id: 2,
        nummer: 3,
        bezeichnung: 'Prüfung der Schaltung',
        endpointUrl: '/api/cmd/seqshifttest',
        condition: null,
        status: 'wartend',
      },
      {
        id: 3,
        nummer: 4,
        bezeichnung: 'Prüfung der Kupplungen',
        endpointUrl: '/api/cmd/sequenzSafe',
        condition: null,
        status: 'wartend',
      },
      {
        id: 4,
        nummer: 5,
        bezeichnung: 'Beschleunigungstest',
        endpointUrl: '/api/cmd/sequenzacctesthigh',
        condition: null,
        status: 'wartend',
      },
      {
        id: 5,
        nummer: 6,
        bezeichnung: 'Dichtheitsprüfung',
        endpointUrl: '/api/cmd/seqsealtest',
        condition: "Prüfen Sie das Getriebe auf sichtbare Undichtigkeiten und bestätigen Sie mit 'Weiter', falls keine Undichtigkeit vorliegt.",
        status: 'wartend',
      },
    ],
  },
  {
    id: 1,
    name: 'Lasttest mit Lastverteilung',
    schritte: [
      {
        id: 0,
        nummer: 1,
        bezeichnung: 'Beschleunigungstest inkl. Schaltverhalten',
        endpointUrl: '/api/cmd/seqaccshiftfast',
        condition: null,
        status: 'wartend',
      },
      {
        id: 1,
        nummer: 2,
        bezeichnung: 'Dichtheitsprüfung',
        endpointUrl: '/api/cmd/seqsealtest',
        condition: "Prüfen Sie die Bohrung A auf Undichtigkeit. Bestätigen Sie mit 'Weiter', falls keine Undichtigkeit vorliegt, ansonsten 'Abbruch'.",
        status: 'wartend',
      },
    ],
  },
];

// ============================================
// Prüfplan Service Klasse
// ============================================

class PruefplanService {
  private pruefplaene: Pruefplan[] = this.deepClone(pruefplaeneAusMainDoku);

  // Alle Prüfpläne abrufen
  getPruefplaene(): Pruefplan[] {
    return this.pruefplaene;
  }

  // Einzelnen Prüfplan abrufen
  getPruefplan(id: number): Pruefplan | undefined {
    return this.pruefplaene.find(p => p.id === id);
  }

  // Schritt-Status aktualisieren
  updateSchrittStatus(
    pruefplanId: number, 
    schrittId: number, 
    status: PruefschrittStatus
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
  resetPruefplan(pruefplanId: number): void {
    const plan = this.pruefplaene.find(p => p.id === pruefplanId);
    if (plan) {
      plan.schritte.forEach(s => {
        s.status = 'wartend';
      });
    }
  }

  // Alle Prüfpläne zurücksetzen
  resetAll(): void {
    this.pruefplaene = this.deepClone(pruefplaeneAusMainDoku);
  }

  // Deep Clone Helper
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}

export const pruefplanService = new PruefplanService();
export default PruefplanService;
