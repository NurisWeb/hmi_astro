// ============================================
// Prüfplan Service - API-Integration
// ============================================

import type {
  Pruefplan,
  Pruefschritt,
  PruefschrittStatus,
} from '../types/menu.types';
import {
  fetchPruefplaene,
  type ApiPruefplan,
} from './api';

// API-Format → Internes Format transformieren
const transformApiToInternal = (apiPlan: ApiPruefplan): Pruefplan => ({
  id: apiPlan.id,
  name: apiPlan.name,
  schritte: apiPlan.steps.map((step, index): Pruefschritt => ({
    id: step.id,
    nummer: index + 1,
    bezeichnung: step.name,
    endpointUrl: step.endpointUrl,
    condition: step.condition,
    status: 'wartend',
  })),
});

class PruefplanService {
  private pruefplaene: Pruefplan[] = [];
  private loaded: boolean = false;
  private loading: Promise<void> | null = null;

  // Prüfpläne von API laden
  async loadPruefplaene(): Promise<void> {
    if (this.loaded) return;
    if (this.loading) return this.loading;

    this.loading = (async () => {
      try {
        const response = await fetchPruefplaene();
        
        if (response.ok && response.data?.plans) {
          this.pruefplaene = response.data.plans.map(transformApiToInternal);
          this.loaded = true;
          console.log('[PruefplanService] Prüfpläne geladen:', this.pruefplaene.length);
        } else {
          console.error('[PruefplanService] API-Fehler:', response);
        }
      } catch (error) {
        console.error('[PruefplanService] Fehler beim Laden:', error);
      }
    })();

    return this.loading;
  }

  getPruefplaene(): Pruefplan[] {
    return this.pruefplaene;
  }

  getPruefplan(id: number): Pruefplan | undefined {
    return this.pruefplaene.find((p) => p.id === id);
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  updateSchrittStatus(
    pruefplanId: number,
    schrittId: number,
    status: PruefschrittStatus
  ): void {
    const plan = this.pruefplaene.find((p) => p.id === pruefplanId);
    if (plan) {
      const schritt = plan.schritte.find((s) => s.id === schrittId);
      if (schritt) {
        schritt.status = status;
      }
    }
  }

  resetPruefplan(pruefplanId: number): void {
    const plan = this.pruefplaene.find((p) => p.id === pruefplanId);
    if (plan) {
      plan.schritte.forEach((s) => {
        s.status = 'wartend';
      });
    }
  }

  async reload(): Promise<void> {
    this.loaded = false;
    this.loading = null;
    await this.loadPruefplaene();
  }
}

export const pruefplanService = new PruefplanService();
export default PruefplanService;
