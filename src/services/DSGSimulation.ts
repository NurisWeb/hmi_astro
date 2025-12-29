// ============================================
// DSG Simulation Service - 7-Gang Doppelkupplungsgetriebe
// ============================================

import type {
  GearPosition,
  DSGState,
  ClutchState,
  ShiftPhase,
} from '../types/dashboard.types';
import { DSG_CONSTANTS, GAUGE_CONSTANTS } from '../types/dashboard.types';

// ============================================
// DSG State Machine
// ============================================

class DSGSimulation {
  private state: DSGState;
  private shiftStartTime: number = 0;
  private warmupProgress: number = 0; // 0-1 für Aufwärmphase

  constructor() {
    this.state = this.getInitialState();
  }

  // ============================================
  // Initial State - Neutralstellung bei Start
  // ============================================
  private getInitialState(): DSGState {
    return {
      activeGear: 'N',
      preselectedGear: '1', // Bei Start: 1. Gang vorgewählt (typisch DSG)
      clutch1: this.createClutchState(DSG_CONSTANTS.CLUTCH1_GEARS, false),
      clutch2: this.createClutchState(DSG_CONSTANTS.CLUTCH2_GEARS, false),
      shiftPhase: 'idle',
      shiftTimeMs: 0,
      isShifting: false,
      targetRPM: GAUGE_CONSTANTS.RPM.IDLE,
      load: 0,
    };
  }

  private createClutchState(gears: readonly GearPosition[], isActive: boolean): ClutchState {
    return {
      engagement: isActive ? 100 : 0,
      pressure: isActive ? DSG_CONSTANTS.CLUTCH.OPERATING_PRESSURE : 0,
      temperature: 25, // Kaltstart
      gears: [...gears],
      isActive,
    };
  }

  // ============================================
  // Getters
  // ============================================
  
  getState(): DSGState {
    return { ...this.state };
  }

  getActiveGear(): GearPosition {
    return this.state.activeGear;
  }

  getCurrentRPM(): number {
    return this.state.targetRPM;
  }

  getLoad(): number {
    return this.state.load;
  }

  // ============================================
  // Gang-Helfer
  // ============================================
  
  private getClutchForGear(gear: GearPosition): 1 | 2 | null {
    if (gear === 'N') return null;
    if (DSG_CONSTANTS.CLUTCH1_GEARS.includes(gear)) return 1;
    if (DSG_CONSTANTS.CLUTCH2_GEARS.includes(gear)) return 2;
    return null;
  }

  private getGearRatio(gear: GearPosition): number {
    const gearInfo = DSG_CONSTANTS.GEAR_RATIOS.find(g => g.gear === gear);
    return gearInfo?.ratio ?? 1;
  }

  private getMaxRPMForGear(gear: GearPosition): number {
    const gearInfo = DSG_CONSTANTS.GEAR_RATIOS.find(g => g.gear === gear);
    return gearInfo?.maxRPM ?? GAUGE_CONSTANTS.RPM.MAX;
  }

  private getNextPreselectedGear(currentGear: GearPosition): GearPosition | null {
    if (currentGear === 'N') return '1';
    return DSG_CONSTANTS.PRESELECT_MAP[currentGear] ?? null;
  }

  // ============================================
  // Gangwechsel
  // ============================================

  requestGearChange(newGear: GearPosition): void {
    if (this.state.isShifting) return; // Kein Gangwechsel während Schaltvorgang
    if (newGear === this.state.activeGear) return;

    // Starte Schaltvorgang
    this.state.isShifting = true;
    this.state.shiftPhase = 'preselect';
    this.shiftStartTime = Date.now();

    // Bestimme neue Kupplung
    const newClutch = this.getClutchForGear(newGear);
    const oldClutch = this.getClutchForGear(this.state.activeGear);

    // Wenn gleiche Kupplung oder Neutral, direkt wechseln
    if (newClutch === oldClutch || newGear === 'N' || this.state.activeGear === 'N') {
      this.completeGearChange(newGear);
      return;
    }

    // DSG-typischer Gangwechsel mit Kupplungsüberschneidung
    this.state.preselectedGear = newGear;
  }

  // ============================================
  // Update-Tick (wird regelmäßig aufgerufen)
  // ============================================

  update(deltaMs: number = 50): void {
    // Schaltvorgang verarbeiten
    if (this.state.isShifting) {
      this.processShifting(deltaMs);
    }

    // Kupplungswerte aktualisieren
    this.updateClutches(deltaMs);

    // Temperaturen aktualisieren
    this.updateTemperatures(deltaMs);

    // Vorwahl aktualisieren (wenn nicht im Schaltvorgang)
    if (!this.state.isShifting && this.state.shiftPhase === 'idle') {
      const nextPreselect = this.getNextPreselectedGear(this.state.activeGear);
      if (nextPreselect && nextPreselect !== this.state.preselectedGear) {
        this.state.preselectedGear = nextPreselect;
      }
    }
  }

  private processShifting(deltaMs: number): void {
    const elapsedMs = Date.now() - this.shiftStartTime;
    const targetGear = this.state.preselectedGear;

    if (!targetGear) {
      this.state.isShifting = false;
      this.state.shiftPhase = 'idle';
      return;
    }

    const oldClutch = this.getClutchForGear(this.state.activeGear);
    const newClutch = this.getClutchForGear(targetGear);

    switch (this.state.shiftPhase) {
      case 'preselect':
        // Vorwahl-Phase: Neuer Gang wird eingelegt (aber Kupplung noch offen)
        if (elapsedMs >= DSG_CONSTANTS.PRESELECT_TIME_MS) {
          this.state.shiftPhase = 'overlap';
        }
        break;

      case 'overlap':
        // Überschneidungs-Phase: Alte Kupplung öffnet, neue schließt
        const overlapProgress = (elapsedMs - DSG_CONSTANTS.PRESELECT_TIME_MS) / DSG_CONSTANTS.OVERLAP_TIME_MS;
        
        // Alte Kupplung öffnen
        if (oldClutch === 1) {
          this.state.clutch1.engagement = Math.max(0, 100 - overlapProgress * 100);
          this.state.clutch1.pressure = this.state.clutch1.engagement / 100 * DSG_CONSTANTS.CLUTCH.OPERATING_PRESSURE;
        } else if (oldClutch === 2) {
          this.state.clutch2.engagement = Math.max(0, 100 - overlapProgress * 100);
          this.state.clutch2.pressure = this.state.clutch2.engagement / 100 * DSG_CONSTANTS.CLUTCH.OPERATING_PRESSURE;
        }

        // Neue Kupplung schließen
        if (newClutch === 1) {
          this.state.clutch1.engagement = Math.min(100, overlapProgress * 100);
          this.state.clutch1.pressure = this.state.clutch1.engagement / 100 * DSG_CONSTANTS.CLUTCH.OPERATING_PRESSURE;
        } else if (newClutch === 2) {
          this.state.clutch2.engagement = Math.min(100, overlapProgress * 100);
          this.state.clutch2.pressure = this.state.clutch2.engagement / 100 * DSG_CONSTANTS.CLUTCH.OPERATING_PRESSURE;
        }

        if (elapsedMs >= DSG_CONSTANTS.PRESELECT_TIME_MS + DSG_CONSTANTS.OVERLAP_TIME_MS) {
          this.state.shiftPhase = 'complete';
        }
        break;

      case 'complete':
        this.completeGearChange(targetGear);
        break;
    }
  }

  private completeGearChange(newGear: GearPosition): void {
    const elapsedMs = Date.now() - this.shiftStartTime;
    
    // Alte Kupplung komplett öffnen
    const oldClutch = this.getClutchForGear(this.state.activeGear);
    if (oldClutch === 1) {
      this.state.clutch1.engagement = 0;
      this.state.clutch1.pressure = 0;
      this.state.clutch1.isActive = false;
    } else if (oldClutch === 2) {
      this.state.clutch2.engagement = 0;
      this.state.clutch2.pressure = 0;
      this.state.clutch2.isActive = false;
    }

    // Neue Kupplung komplett schließen
    const newClutch = this.getClutchForGear(newGear);
    if (newClutch === 1) {
      this.state.clutch1.engagement = 100;
      this.state.clutch1.pressure = DSG_CONSTANTS.CLUTCH.OPERATING_PRESSURE;
      this.state.clutch1.isActive = true;
    } else if (newClutch === 2) {
      this.state.clutch2.engagement = 100;
      this.state.clutch2.pressure = DSG_CONSTANTS.CLUTCH.OPERATING_PRESSURE;
      this.state.clutch2.isActive = true;
    }

    // State aktualisieren
    this.state.activeGear = newGear;
    this.state.shiftTimeMs = elapsedMs;
    this.state.isShifting = false;
    this.state.shiftPhase = 'idle';
    
    // Nächsten Gang vorwählen
    this.state.preselectedGear = this.getNextPreselectedGear(newGear);
  }

  private updateClutches(deltaMs: number): void {
    // Kupplungsdruck basierend auf Engagement aktualisieren
    const activeClutch = this.getClutchForGear(this.state.activeGear);
    
    if (activeClutch === 1 && !this.state.isShifting) {
      // Smooth engagement für aktive Kupplung
      const targetEngagement = 100;
      this.state.clutch1.engagement = this.lerp(this.state.clutch1.engagement, targetEngagement, 0.1);
      this.state.clutch1.pressure = (this.state.clutch1.engagement / 100) * DSG_CONSTANTS.CLUTCH.OPERATING_PRESSURE;
      this.state.clutch1.isActive = true;
    } else if (activeClutch === 2 && !this.state.isShifting) {
      const targetEngagement = 100;
      this.state.clutch2.engagement = this.lerp(this.state.clutch2.engagement, targetEngagement, 0.1);
      this.state.clutch2.pressure = (this.state.clutch2.engagement / 100) * DSG_CONSTANTS.CLUTCH.OPERATING_PRESSURE;
      this.state.clutch2.isActive = true;
    }
  }

  private updateTemperatures(deltaMs: number): void {
    const rpmFactor = this.state.targetRPM / GAUGE_CONSTANTS.RPM.MAX;
    const loadFactor = this.state.load / 100;
    
    // Kupplungstemperatur steigt bei Last und während Schaltvorgängen
    const heatRate = 0.1 * (rpmFactor + loadFactor + (this.state.isShifting ? 0.5 : 0));
    const coolRate = 0.02; // Langsame Abkühlung
    
    // Aktive Kupplung erhitzt sich
    if (this.state.clutch1.isActive || this.state.isShifting) {
      this.state.clutch1.temperature = Math.min(
        DSG_CONSTANTS.CLUTCH.MAX_TEMP,
        this.state.clutch1.temperature + heatRate - coolRate
      );
    } else {
      this.state.clutch1.temperature = Math.max(25, this.state.clutch1.temperature - coolRate);
    }

    if (this.state.clutch2.isActive || this.state.isShifting) {
      this.state.clutch2.temperature = Math.min(
        DSG_CONSTANTS.CLUTCH.MAX_TEMP,
        this.state.clutch2.temperature + heatRate - coolRate
      );
    } else {
      this.state.clutch2.temperature = Math.max(25, this.state.clutch2.temperature - coolRate);
    }
  }

  // ============================================
  // RPM & Last Steuerung
  // ============================================

  setTargetRPM(rpm: number): void {
    const maxRPM = this.getMaxRPMForGear(this.state.activeGear);
    this.state.targetRPM = Math.min(Math.max(rpm, 0), maxRPM);
  }

  setLoad(load: number): void {
    this.state.load = Math.min(Math.max(load, 0), 100);
  }

  // Berechne realistische RPM basierend auf Gang und Last
  calculateRPMForGear(gear: GearPosition, loadPercent: number): number {
    if (gear === 'N') return GAUGE_CONSTANTS.RPM.IDLE;
    
    const ratio = this.getGearRatio(gear);
    const maxRPM = this.getMaxRPMForGear(gear);
    
    // Basis-RPM skaliert mit Last und Übersetzung
    // Höhere Übersetzung (niedriger Gang) = höhere Drehzahl bei gleicher "Geschwindigkeit"
    const baseRPM = GAUGE_CONSTANTS.RPM.IDLE + (loadPercent / 100) * (maxRPM - GAUGE_CONSTANTS.RPM.IDLE);
    
    return Math.min(baseRPM, maxRPM);
  }

  // ============================================
  // Physikalische Korrelationen
  // ============================================

  // Öldruck korreliert mit RPM
  calculateOilPressure(rpm: number): number {
    const rpmFactor = rpm / GAUGE_CONSTANTS.RPM.MAX;
    // Öldruck: 2 bar idle bis 15 bar bei Volllast
    return 2 + rpmFactor * 13;
  }

  // Öltemperatur korreliert mit RPM, Last und Zeit
  calculateOilTemperature(rpm: number, load: number, runtimeSeconds: number): number {
    const rpmFactor = rpm / GAUGE_CONSTANTS.RPM.MAX;
    const loadFactor = load / 100;
    
    // Aufwärmphase: Nach 5 Minuten aufgewärmt
    const warmupFactor = Math.min(runtimeSeconds / 300, 1);
    
    // Basistemperatur + Aufwärmung + RPM-Einfluss + Last-Einfluss
    const baseTemp = 25;
    const warmupTemp = warmupFactor * 45; // Bis 70°C nur durch Aufwärmen
    const rpmTemp = rpmFactor * 25;        // +25°C bei Max-RPM
    const loadTemp = loadFactor * 35;      // +35°C bei Volllast
    
    return Math.min(baseTemp + warmupTemp + rpmTemp + loadTemp, GAUGE_CONSTANTS.OIL_TEMPERATURE.MAX);
  }

  // Durchfluss korreliert mit RPM
  calculateFlowRate(rpm: number): number {
    const rpmFactor = rpm / GAUGE_CONSTANTS.RPM.MAX;
    // Durchfluss: 3 L/min idle bis 40 L/min bei Max-RPM
    return 3 + rpmFactor * 37;
  }

  // Bremsmotor-Drehmoment korreliert mit Last
  calculateBrakeMotorTorque(load: number): number {
    const loadFactor = load / 100;
    // Drehmoment: 0 bis Max bei Volllast
    return loadFactor * GAUGE_CONSTANTS.BRAKE_MOTOR.MAX_TORQUE;
  }

  // ============================================
  // Auto-Modus: Automatischer Gang-Durchlauf
  // ============================================

  private autoModeActive: boolean = false;
  private autoModeSpeed: 'slow' | 'normal' | 'fast' = 'normal';
  private autoModePhase: 'accelerating' | 'shifting' | 'decelerating' = 'accelerating';
  private autoModeProgress: number = 0;

  startAutoMode(speed: 'slow' | 'normal' | 'fast' = 'normal'): void {
    this.autoModeActive = true;
    this.autoModeSpeed = speed;
    this.autoModePhase = 'accelerating';
    this.autoModeProgress = 0;
    this.requestGearChange('1');
  }

  stopAutoMode(): void {
    this.autoModeActive = false;
    this.autoModePhase = 'accelerating';
    this.autoModeProgress = 0;
  }

  isAutoModeActive(): boolean {
    return this.autoModeActive;
  }

  updateAutoMode(deltaMs: number): { rpm: number; load: number } {
    if (!this.autoModeActive) {
      return { rpm: this.state.targetRPM, load: this.state.load };
    }

    // Geschwindigkeitsfaktor
    const speedFactor = this.autoModeSpeed === 'slow' ? 0.5 : this.autoModeSpeed === 'fast' ? 2 : 1;
    const progressRate = (deltaMs / 1000) * 0.1 * speedFactor; // Fortschritt pro Sekunde

    this.autoModeProgress += progressRate;

    const currentGear = this.state.activeGear;
    const maxRPM = this.getMaxRPMForGear(currentGear);
    const shiftRPM = maxRPM * 0.85; // Bei 85% der Max-RPM hochschalten

    let targetRPM: number;
    let targetLoad: number;

    switch (this.autoModePhase) {
      case 'accelerating':
        // RPM steigt
        targetRPM = GAUGE_CONSTANTS.RPM.IDLE + this.autoModeProgress * (shiftRPM - GAUGE_CONSTANTS.RPM.IDLE);
        targetLoad = 50 + this.autoModeProgress * 40; // Last steigt auf 90%

        if (targetRPM >= shiftRPM && currentGear !== '7') {
          // Hochschalten
          const gears: GearPosition[] = ['1', '2', '3', '4', '5', '6', '7'];
          const currentIndex = gears.indexOf(currentGear);
          if (currentIndex >= 0 && currentIndex < gears.length - 1) {
            this.requestGearChange(gears[currentIndex + 1]);
            this.autoModePhase = 'shifting';
            this.autoModeProgress = 0;
          }
        } else if (currentGear === '7' && targetRPM >= shiftRPM) {
          // Im 7. Gang: Abbremsen starten
          this.autoModePhase = 'decelerating';
          this.autoModeProgress = 0;
        }
        break;

      case 'shifting':
        // Während Schaltvorgang: RPM fällt kurz
        targetRPM = this.state.targetRPM * 0.7;
        targetLoad = 30;
        
        if (!this.state.isShifting) {
          this.autoModePhase = 'accelerating';
          this.autoModeProgress = 0;
        }
        break;

      case 'decelerating':
        // Abbremsen durch alle Gänge
        targetRPM = maxRPM - this.autoModeProgress * (maxRPM - GAUGE_CONSTANTS.RPM.IDLE);
        targetLoad = 90 - this.autoModeProgress * 80; // Last sinkt

        const downshiftRPM = GAUGE_CONSTANTS.RPM.IDLE + 500;
        if (targetRPM <= downshiftRPM && currentGear !== '1') {
          // Runterschalten
          const gears: GearPosition[] = ['1', '2', '3', '4', '5', '6', '7'];
          const currentIndex = gears.indexOf(currentGear);
          if (currentIndex > 0) {
            this.requestGearChange(gears[currentIndex - 1]);
            this.autoModePhase = 'shifting';
          }
        } else if (currentGear === '1' && targetRPM <= downshiftRPM) {
          // Wieder von vorne
          this.autoModeProgress = 0;
          this.autoModePhase = 'accelerating';
        }
        break;

      default:
        targetRPM = GAUGE_CONSTANTS.RPM.IDLE;
        targetLoad = 0;
    }

    this.state.targetRPM = Math.max(GAUGE_CONSTANTS.RPM.IDLE, Math.min(targetRPM, GAUGE_CONSTANTS.RPM.MAX));
    this.state.load = Math.max(0, Math.min(targetLoad, 100));

    return { rpm: this.state.targetRPM, load: this.state.load };
  }

  // ============================================
  // Utilities
  // ============================================

  private lerp(start: number, end: number, t: number): number {
    return start + (end - start) * Math.min(Math.max(t, 0), 1);
  }

  reset(): void {
    this.state = this.getInitialState();
    this.shiftStartTime = 0;
    this.warmupProgress = 0;
    this.autoModeActive = false;
  }
}

// Singleton Export
export const dsgSimulation = new DSGSimulation();
export default DSGSimulation;

