// mockBackend/data/pruefplaeneData.ts
import type { Pruefplan, PruefplaeneResponse } from '../types';

// Prüfpläne exakt aus Main_Doku.json
export const pruefplaene: Pruefplan[] = [
  {
    id: 0,
    name: 'Funktionstest lastfrei',
    steps: [
      {
        id: 0,
        name: 'Elektrische Prüfung SAP/CCP',
        endpointUrl: '/api/cmd/seqcheckelectric',
        condition: null,
      },
      {
        id: 1,
        name: 'Sensordaten Validierung',
        endpointUrl: '/api/cmd/seqchecksensordata',
        condition: null,
      },
      {
        id: 2,
        name: 'Prüfung der Schaltung',
        endpointUrl: '/api/cmd/seqshifttest',
        condition: null,
      },
      {
        id: 3,
        name: 'Prüfung der Kupplungen',
        endpointUrl: '/api/cmd/sequenzSafe',
        condition: null,
      },
      {
        id: 4,
        name: 'Beschleunigungstest',
        endpointUrl: '/api/cmd/sequenzacctesthigh',
        condition: null,
      },
      {
        id: 5,
        name: 'Dichtheitsprüfung',
        endpointUrl: '/api/cmd/seqsealtest',
        condition:
          "Prüfen Sie das Getriebe auf sichtbare Undichtigkeiten und bestätigen Sie mit 'Weiter', falls keine Undichtigkeit vorliegt.",
      },
    ],
  },
  {
    id: 1,
    name: 'Lasttest mit Lastverteilung',
    steps: [
      {
        id: 0,
        name: 'Beschleunigungstest inkl. Schaltverhalten',
        endpointUrl: '/api/cmd/seqaccshiftfast',
        condition: null,
      },
      {
        id: 1,
        name: 'Dichtheitsprüfung',
        endpointUrl: '/api/cmd/seqsealtest',
        condition:
          "Prüfen Sie die Bohrung A auf Undichtigkeit. Bestätigen Sie mit 'Weiter', falls keine Undichtigkeit vorliegt, ansonsten 'Abbruch'.",
      },
    ],
  },
];

export const getPruefplaeneResponse = (): PruefplaeneResponse => ({
  t: 'plans',
  plans: pruefplaene,
});
