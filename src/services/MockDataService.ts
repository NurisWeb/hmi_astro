// ============================================
// Mock Data Service für Prüfstand Dashboard
// Mit DSG-Getriebe Integration
// ============================================

import type {
  DashboardData,
  DashboardDataWithDSG,
  GearPosition,
  MockDataMode,
  DSGState,
} from '../types/dashboard.types';
import { GAUGE_CONSTANTS } from '../types/dashboard.types';
import { dsgSimulation } from './DSGSimulation';

type RealisticPhase = 'idle' | 'warmup' | 'running' | 'stress' | 'cooldown';

class MockDataService {
  private mode: MockDataMode = 'random';
  private realisticPhase: RealisticPhase = 'idle';
  private phaseProgress = 0;
  private currentRPM = 0;
  private currentLoad = 0;
  private cycleCount = 0;
  private startTime = Date.now();
  private updateInterval = 50; // ms

  private currentData: DashboardDataWithDSG = this.getInitialData();

  private getInitialData(): DashboardDataWithDSG {
    return {
      rpm: 0,
      gear: 'N',
      oilPressures: [0, 0, 0, 0],
      oilTemperature: 25,
      flowRate: 0,
      brakeMotors: {
        motor1: { torque: 0, kw: 0, load: 0 },
        motor2: { torque: 0, kw: 0, load: 0 },
      },
      temperature: 25,
      runtime: 0,
      cycles: 0,
      isConnected: true,
      dsg: dsgSimulation.getState(),
    };
  }

  // ============================================
  // Mode Control
  // ============================================

  setMode(mode: MockDataMode): void {
    this.mode = mode;
    if (mode === 'realistic') {
      this.realisticPhase = 'idle';
      this.phaseProgress = 0;
    }
  }

  getMode(): MockDataMode {
    return this.mode;
  }

  // ============================================
  // DSG Control
  // ============================================

  setGear(gear: GearPosition): void {
    dsgSimulation.requestGearChange(gear);
  }

  setTargetRPM(rpm: number): void {
    dsgSimulation.setTargetRPM(rpm);
  }

  setLoad(load: number): void {
    dsgSimulation.setLoad(load);
    this.currentLoad = load;
  }

  getDSGState(): DSGState {
    return dsgSimulation.getState();
  }

  // ============================================
  // Auto-Modus
  // ============================================

  startAutoMode(speed: 'slow' | 'normal' | 'fast' = 'normal'): void {
    dsgSimulation.startAutoMode(speed);
  }

  stopAutoMode(): void {
    dsgSimulation.stopAutoMode();
  }

  isAutoModeActive(): boolean {
    return dsgSimulation.isAutoModeActive();
  }

  // ============================================
  // Data Generation
  // ============================================

  generateData(): DashboardDataWithDSG {
    // Update DSG-Simulation
    dsgSimulation.update(this.updateInterval);

    if (this.mode === 'random') {
      return this.generateRandomData();
    } else {
      return this.generateRealisticData();
    }
  }

  private generateRandomData(): DashboardDataWithDSG {
    const dsgState = dsgSimulation.getState();
    const runtime = Math.floor((Date.now() - this.startTime) / 1000);

    // Auto-Modus aktualisieren
    if (dsgSimulation.isAutoModeActive()) {
      const autoData = dsgSimulation.updateAutoMode(this.updateInterval);
      this.currentRPM = this.lerp(this.currentRPM, autoData.rpm, 0.15);
      this.currentLoad = autoData.load;
    } else {
      // Manuelle Steuerung: RPM smooth interpolieren
      this.currentRPM = this.lerp(this.currentRPM, dsgState.targetRPM, 0.1);
    }

    // Physikalische Korrelationen berechnen
    const oilPressure = dsgSimulation.calculateOilPressure(this.currentRPM);
    const oilTemperature = dsgSimulation.calculateOilTemperature(
      this.currentRPM,
      this.currentLoad,
      runtime
    );
    const flowRate = dsgSimulation.calculateFlowRate(this.currentRPM);
    const brakeTorque = dsgSimulation.calculateBrakeMotorTorque(this.currentLoad);

    // Öldruck mit leichten Variationen für jeden Sensor
    const oilPressures = [
      this.addNoise(oilPressure, 0.5),
      this.addNoise(oilPressure * 0.95, 0.5),
      this.addNoise(oilPressure * 1.02, 0.5),
      this.addNoise(oilPressure * 0.98, 0.5),
    ];

    this.currentData = {
      rpm: Math.round(this.currentRPM),
      gear: dsgState.activeGear,
      oilPressures: oilPressures.map(p => Math.max(0, Math.min(20, p))),
      oilTemperature: Math.max(0, Math.min(150, this.addNoise(oilTemperature, 1))),
      flowRate: Math.max(0, Math.min(50, this.addNoise(flowRate, 0.5))),
      brakeMotors: {
        motor1: {
          torque: Math.max(0, this.addNoise(brakeTorque, 15)),
          kw: this.calculateKW(brakeTorque),
          load: (brakeTorque / GAUGE_CONSTANTS.BRAKE_MOTOR.MAX_TORQUE) * 100,
        },
        motor2: {
          torque: Math.max(0, this.addNoise(brakeTorque * 0.97, 15)),
          kw: this.calculateKW(brakeTorque * 0.97),
          load: ((brakeTorque * 0.97) / GAUGE_CONSTANTS.BRAKE_MOTOR.MAX_TORQUE) * 100,
        },
      },
      temperature: 35 + (this.currentRPM / GAUGE_CONSTANTS.RPM.MAX) * 40 + this.currentLoad * 0.2,
      runtime,
      cycles: this.cycleCount,
      isConnected: true,
      dsg: dsgState,
    };

    return this.currentData;
  }

  private generateRealisticData(): DashboardDataWithDSG {
    this.phaseProgress += 0.015; // Langsamerer Fortschritt für realistischeren Ablauf

    if (this.phaseProgress >= 1) {
      this.phaseProgress = 0;
      this.transitionToNextPhase();
    }

    return this.getPhaseData();
  }

  private transitionToNextPhase(): void {
    const phases: RealisticPhase[] = ['idle', 'warmup', 'running', 'stress', 'cooldown'];
    const currentIndex = phases.indexOf(this.realisticPhase);
    const nextIndex = (currentIndex + 1) % phases.length;
    this.realisticPhase = phases[nextIndex];

    if (this.realisticPhase === 'idle') {
      this.cycleCount++;
    }

    // Gang passend zur Phase setzen
    switch (this.realisticPhase) {
      case 'idle':
        dsgSimulation.requestGearChange('N');
        break;
      case 'warmup':
        dsgSimulation.requestGearChange('1');
        break;
      case 'running':
        dsgSimulation.startAutoMode('normal');
        break;
      case 'stress':
        dsgSimulation.stopAutoMode();
        dsgSimulation.requestGearChange('5');
        break;
      case 'cooldown':
        dsgSimulation.stopAutoMode();
        break;
    }
  }

  private getPhaseData(): DashboardDataWithDSG {
    const runtime = Math.floor((Date.now() - this.startTime) / 1000);
    const t = this.phaseProgress;
    const dsgState = dsgSimulation.getState();

    let targetRPM: number;
    let targetLoad: number;

    switch (this.realisticPhase) {
      case 'idle':
        targetRPM = GAUGE_CONSTANTS.RPM.IDLE;
        targetLoad = 0;
        break;

      case 'warmup':
        targetRPM = this.lerp(GAUGE_CONSTANTS.RPM.IDLE, 3500, t);
        targetLoad = this.lerp(0, 30, t);
        // Gangwechsel während Aufwärmen
        if (t > 0.3 && t < 0.35) {
          dsgSimulation.requestGearChange('2');
        } else if (t > 0.6 && t < 0.65) {
          dsgSimulation.requestGearChange('3');
        }
        break;

      case 'running':
        // Auto-Modus übernimmt
        if (dsgSimulation.isAutoModeActive()) {
          const autoData = dsgSimulation.updateAutoMode(this.updateInterval);
          targetRPM = autoData.rpm;
          targetLoad = autoData.load;
        } else {
          targetRPM = 4000 + Math.sin(t * Math.PI * 4) * 2500;
          targetLoad = 50 + Math.sin(t * Math.PI * 4) * 30;
        }
        break;

      case 'stress':
        // Hochlast-Test: Hohe Drehzahl und Last
        targetRPM = 6000 + Math.sin(t * Math.PI * 3) * 1500;
        targetLoad = 80 + Math.sin(t * Math.PI * 2) * 15;
        // Gangwechsel im Stress-Test
        if (t > 0.25 && t < 0.3) {
          dsgSimulation.requestGearChange('6');
        } else if (t > 0.5 && t < 0.55) {
          dsgSimulation.requestGearChange('7');
        } else if (t > 0.75 && t < 0.8) {
          dsgSimulation.requestGearChange('6');
        }
        break;

      case 'cooldown':
        targetRPM = this.lerp(5000, GAUGE_CONSTANTS.RPM.IDLE, t);
        targetLoad = this.lerp(60, 0, t);
        // Herunterschalten
        if (t > 0.2 && t < 0.25) {
          dsgSimulation.requestGearChange('5');
        } else if (t > 0.4 && t < 0.45) {
          dsgSimulation.requestGearChange('4');
        } else if (t > 0.6 && t < 0.65) {
          dsgSimulation.requestGearChange('3');
        } else if (t > 0.8 && t < 0.85) {
          dsgSimulation.requestGearChange('2');
        } else if (t > 0.95) {
          dsgSimulation.requestGearChange('N');
        }
        break;

      default:
        targetRPM = GAUGE_CONSTANTS.RPM.IDLE;
        targetLoad = 0;
    }

    // RPM und Load setzen
    dsgSimulation.setTargetRPM(targetRPM);
    dsgSimulation.setLoad(targetLoad);
    this.currentRPM = this.lerp(this.currentRPM, targetRPM, 0.12);
    this.currentLoad = targetLoad;

    // Physikalische Korrelationen berechnen
    const oilPressure = dsgSimulation.calculateOilPressure(this.currentRPM);
    const oilTemperature = dsgSimulation.calculateOilTemperature(
      this.currentRPM,
      this.currentLoad,
      runtime
    );
    const flowRate = dsgSimulation.calculateFlowRate(this.currentRPM);
    const brakeTorque = dsgSimulation.calculateBrakeMotorTorque(this.currentLoad);

    // Stress-Phase: Erhöhte Temperaturen und Drücke
    const stressFactor = this.realisticPhase === 'stress' ? 1.15 : 1;

    const oilPressures = [
      this.addNoise(oilPressure * stressFactor, 0.3),
      this.addNoise(oilPressure * 0.96 * stressFactor, 0.3),
      this.addNoise(oilPressure * 1.03 * stressFactor, 0.3),
      this.addNoise(oilPressure * 0.99 * stressFactor, 0.3),
    ];

    this.currentData = {
      rpm: Math.round(this.currentRPM),
      gear: dsgState.activeGear,
      oilPressures: oilPressures.map(p => Math.max(0, Math.min(20, p))),
      oilTemperature: Math.max(0, Math.min(150, this.addNoise(oilTemperature * stressFactor, 1))),
      flowRate: Math.max(0, Math.min(50, this.addNoise(flowRate, 0.5))),
      brakeMotors: {
        motor1: {
          torque: Math.max(0, this.addNoise(brakeTorque * stressFactor, 10)),
          kw: this.calculateKW(brakeTorque * stressFactor),
          load: (brakeTorque * stressFactor / GAUGE_CONSTANTS.BRAKE_MOTOR.MAX_TORQUE) * 100,
        },
        motor2: {
          torque: Math.max(0, this.addNoise(brakeTorque * 0.97 * stressFactor, 10)),
          kw: this.calculateKW(brakeTorque * 0.97 * stressFactor),
          load: ((brakeTorque * 0.97 * stressFactor) / GAUGE_CONSTANTS.BRAKE_MOTOR.MAX_TORQUE) * 100,
        },
      },
      temperature: 35 + (this.currentRPM / GAUGE_CONSTANTS.RPM.MAX) * 40 * stressFactor,
      runtime,
      cycles: this.cycleCount,
      isConnected: true,
      dsg: dsgState,
    };

    return this.currentData;
  }

  // ============================================
  // Utility Functions
  // ============================================

  private lerp(start: number, end: number, t: number): number {
    return start + (end - start) * Math.min(Math.max(t, 0), 1);
  }

  private addNoise(value: number, amplitude: number): number {
    return value + (Math.random() - 0.5) * 2 * amplitude;
  }

  private calculateKW(torque: number): number {
    return (torque * GAUGE_CONSTANTS.BRAKE_MOTOR.MOTOR_RPM) / 9549;
  }

  reset(): void {
    this.currentData = this.getInitialData();
    this.currentRPM = 0;
    this.currentLoad = 0;
    this.realisticPhase = 'idle';
    this.phaseProgress = 0;
    this.cycleCount = 0;
    this.startTime = Date.now();
    dsgSimulation.reset();
  }

  getCurrentPhase(): RealisticPhase {
    return this.realisticPhase;
  }
}

export const mockDataService = new MockDataService();
export default MockDataService;
