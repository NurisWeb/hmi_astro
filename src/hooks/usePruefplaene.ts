// hooks/usePruefplaene.ts
// Frontend Hook für Prüfpläne

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { Pruefplan, PruefplanStep, PruefplaeneResponse } from '../services/mockBackend/types';

export const usePruefplaene = () => {
  const [plaene, setPlaene] = useState<Pruefplan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pläne laden
  useEffect(() => {
    const laden = async () => {
      try {
        const response = await api<PruefplaeneResponse>('/api/pruefplaene');
        if (response.ok) {
          setPlaene(response.data.plans);
          setError(null);
        } else {
          setError('Prüfpläne konnten nicht geladen werden');
        }
      } catch (err) {
        console.error('Prüfpläne-Fehler:', err);
        setError('Verbindungsfehler');
      } finally {
        setIsLoading(false);
      }
    };
    laden();
  }, []);
  
  // Plan nach ID holen
  const getPlanById = useCallback((id: number): Pruefplan | undefined => {
    return plaene.find(p => p.id === id);
  }, [plaene]);
  
  // Step nach Plan-ID und Step-ID holen
  const getStepById = useCallback((planId: number, stepId: number): PruefplanStep | undefined => {
    const plan = getPlanById(planId);
    return plan?.steps.find(s => s.id === stepId);
  }, [getPlanById]);
  
  // Prüfen ob Step eine Condition hat
  const hasCondition = useCallback((planId: number, stepId: number): boolean => {
    const step = getStepById(planId, stepId);
    return step?.condition !== null;
  }, [getStepById]);
  
  return { 
    plaene, 
    isLoading, 
    error,
    getPlanById,
    getStepById,
    hasCondition,
  };
};

// Typ-Exports
export type { Pruefplan, PruefplanStep };
