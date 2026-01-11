// mockBackend/endpoints/telemetry.ts

import { generateTelemetrieData, setSimulierteWerte } from '../data/telemetrieData';
import type { TelemetrieResponse } from '../types';

export const handleTelemetry = (): TelemetrieResponse => {
  return generateTelemetrieData();
};

// Re-export für einfachen Zugriff
export { setSimulierteWerte };
