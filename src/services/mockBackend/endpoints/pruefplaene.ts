// mockBackend/endpoints/pruefplaene.ts

import { getPruefplaeneResponse, pruefplaene } from '../data/pruefplaeneData';
import type { PruefplaeneResponse, Pruefplan } from '../types';

// Alle Prüfpläne holen
export const handlePruefplaene = (): PruefplaeneResponse => {
  return getPruefplaeneResponse();
};

// Einzelnen Plan nach ID holen
export const getPlanById = (id: number): Pruefplan | null => {
  return pruefplaene.find(p => p.id === id) || null;
};
