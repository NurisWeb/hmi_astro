// ============================================
// Mock Data Stream Service für SSE Backend
// ============================================

import {
  DashboardData,
  GearPosition,
  MockDataMode,
  RealisticPhase,
  GAUGE_CONSTANTS,
} from '../types/server.types';

class MockDataStream {
  private mode: MockDataMode = 'random';
  private realisticPhase: RealisticPhase = 'idle';
  private phaseProgress = 0;
  private currentGear: GearPosition = 'N';
  private targetRPM = 0;
  private currentRPM = 0;
  private cycleCount = 0;
  private startTime = Date.now();

  private currentData: DashboardData = this.getInitialData();

  private getInitialData(): DashboardData {
    return {
      rpm: 0,
      gear: 'N',
      oilPressures: [0, 0, 0, 0],
      brakeMotors: {
        motor1: { torque: 0, kw: 0, load: 0 },
        motor2: { torque: 0, kw: 0, load: 0 },
      },
      temperature: 25,
      runtime: 0,
      cycles: 0,
      isConnected: true,
    };
  }

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

  setGear(gear: GearPosition): void {
    this.currentGear = gear;
  }

  setTargetRPM(rpm: number): void {
    this.targetRPM = Math.min(Math.max(rpm, 0), GAUGE_CONSTANTS.RPM.MAX);
  }

  generateData(): DashboardData {
    if (this.mode === 'random') {
      return this.generateRandomData();
    } else {
      return this.generateRealisticData();
    }
  }

  // ============================================
  // Random Mode - Zufällige Schwankungen
  // ============================================
  private generateRandomData(): DashboardData {
    const baseRPM = this.targetRPM || 3000 + Math.random() * 5000;
    
    this.currentRPM = this.lerp(this.currentRPM, baseRPM, 0.1);
    
    const rpmFactor = this.currentRPM / GAUGE_CONSTANTS.RPM.MAX;

    const baseOilPressure = 4 + rpmFactor * 8;
    const oilPressures = [
      this.addNoise(baseOilPressure, 1),
      this.addNoise(baseOilPressure, 1),
      this.addNoise(baseOilPressure * 0.9, 1),
      this.addNoise(baseOilPressure * 1.1, 1),
    ];

    const baseTorque = rpmFactor * GAUGE_CONSTANTS.BRAKE_MOTOR.MAX_TORQUE * 0.7;
    const motor1Torque = this.addNoise(baseTorque, 50);
    const motor2Torque = this.addNoise(baseTorque * 0.95, 50);

    const runtime = Math.floor((Date.now() - this.startTime) / 1000);

    this.currentData = {
      rpm: Math.round(this.currentRPM),
      gear: this.currentGear,
      oilPressures: oilPressures.map(p => Math.max(0, Math.min(20, p))),
      brakeMotors: {
        motor1: {
          torque: Math.max(0, motor1Torque),
          kw: this.calculateKW(motor1Torque),
          load: (motor1Torque / GAUGE_CONSTANTS.BRAKE_MOTOR.MAX_TORQUE) * 100,
        },
        motor2: {
          torque: Math.max(0, motor2Torque),
          kw: this.calculateKW(motor2Torque),
          load: (motor2Torque / GAUGE_CONSTANTS.BRAKE_MOTOR.MAX_TORQUE) * 100,
        },
      },
      temperature: 45 + rpmFactor * 35 + Math.random() * 5,
      runtime,
      cycles: this.cycleCount,
      isConnected: true,
    };

    return this.currentData;
  }

  // ============================================
  // Realistic Mode - Simuliert echten Testlauf
  // ============================================
  private generateRealisticData(): DashboardData {
    this.phaseProgress += 0.02;

    if (this.phaseProgress >= 1) {
      this.phaseProgress = 0;
      this.transitionToNextPhase();
    }

    const data = this.getPhaseData();
    this.currentData = data;
    return data;
  }

  private transitionToNextPhase(): void {
    const phases: RealisticPhase[] = ['idle', 'warmup', 'running', 'stress', 'cooldown'];
    const currentIndex = phases.indexOf(this.realisticPhase);
    const nextIndex = (currentIndex + 1) % phases.length;
    this.realisticPhase = phases[nextIndex];

    if (this.realisticPhase === 'idle') {
      this.cycleCount++;
    }
  }

  private getPhaseData(): DashboardData {
    const runtime = Math.floor((Date.now() - this.startTime) / 1000);
    const t = this.phaseProgress;

    let targetRPM: number;
    let targetTorque: number;
    let gear: GearPosition;

    switch (this.realisticPhase) {
      case 'idle':
        targetRPM = GAUGE_CONSTANTS.RPM.IDLE;
        targetTorque = 0;
        gear = 'N';
        break;

      case 'warmup':
        targetRPM = this.lerp(GAUGE_CONSTANTS.RPM.IDLE, 3000, t);
        targetTorque = this.lerp(0, 300, t);
        gear = t < 0.5 ? '1' : '2';
        break;

      case 'running':
        const gearIndex = Math.floor(t * 6);
        const gears: GearPosition[] = ['1', '2', '3', '4', '5', '6'];
        gear = gears[Math.min(gearIndex, 5)];
        targetRPM = 3000 + Math.sin(t * Math.PI * 4) * 2000;
        targetTorque = 400 + Math.sin(t * Math.PI * 4) * 200;
        break;

      case 'stress':
        targetRPM = 7000 + Math.sin(t * Math.PI * 2) * 1500;
        targetTorque = 800 + Math.sin(t * Math.PI * 2) * 400;
        gear = t < 0.33 ? '4' : t < 0.66 ? '5' : '6';
        break;

      case 'cooldown':
        targetRPM = this.lerp(5000, GAUGE_CONSTANTS.RPM.IDLE, t);
        targetTorque = this.lerp(500, 0, t);
        gear = t < 0.25 ? '4' : t < 0.5 ? '3' : t < 0.75 ? '2' : 'N';
        break;

      default:
        targetRPM = 0;
        targetTorque = 0;
        gear = 'N';
    }

    this.currentRPM = this.lerp(this.currentRPM, targetRPM, 0.15);
    this.currentGear = gear;

    const rpmFactor = this.currentRPM / GAUGE_CONSTANTS.RPM.MAX;
    const baseOilPressure = 3 + rpmFactor * 10;

    return {
      rpm: Math.round(this.currentRPM),
      gear: this.currentGear,
      oilPressures: [
        this.addNoise(baseOilPressure, 0.5),
        this.addNoise(baseOilPressure * 0.95, 0.5),
        this.addNoise(baseOilPressure * 1.05, 0.5),
        this.addNoise(baseOilPressure * 0.98, 0.5),
      ].map(p => Math.max(0, Math.min(20, p))),
      brakeMotors: {
        motor1: {
          torque: targetTorque + this.addNoise(0, 20),
          kw: this.calculateKW(targetTorque),
          load: (targetTorque / GAUGE_CONSTANTS.BRAKE_MOTOR.MAX_TORQUE) * 100,
        },
        motor2: {
          torque: targetTorque * 0.95 + this.addNoise(0, 20),
          kw: this.calculateKW(targetTorque * 0.95),
          load: ((targetTorque * 0.95) / GAUGE_CONSTANTS.BRAKE_MOTOR.MAX_TORQUE) * 100,
        },
      },
      temperature: 40 + rpmFactor * 40 + (this.realisticPhase === 'stress' ? 15 : 0),
      runtime,
      cycles: this.cycleCount,
      isConnected: true,
    };
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
    this.targetRPM = 0;
    this.currentGear = 'N';
    this.realisticPhase = 'idle';
    this.phaseProgress = 0;
    this.cycleCount = 0;
    this.startTime = Date.now();
  }

  getCurrentPhase(): RealisticPhase {
    return this.realisticPhase;
  }
}

// Singleton Export
export const mockDataStream = new MockDataStream();
export default MockDataStream;




