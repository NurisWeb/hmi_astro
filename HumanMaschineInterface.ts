HumanMaschineInterface

services/MockDataService.ts// ============================================
// Mock Data Service für Prüfstand Dashboard
// ============================================

import {
  DashboardData,
  GearPosition,
  MockDataMode,
  GAUGE_CONSTANTS,
} from '../types/dashboard.types';

type RealisticPhase = 'idle' | 'warmup' | 'running' | 'stress' | 'cooldown';

class MockDataService {
  private mode: MockDataMode = 'random';
  private realisticPhase: RealisticPhase = 'idle';
  private phaseProgress = 0;
  private currentGear: GearPosition = 'N';
  private targetRPM = 0;
  private currentRPM = 0;
  private cycleCount = 0;
  private startTime = Date.now();

  // Aktuelle Werte für smooth transitions
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

  // Hauptfunktion zum Generieren von Daten
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
    
    // Smooth interpolation zu Zielwerten
    this.currentRPM = this.lerp(this.currentRPM, baseRPM, 0.1);
    
    const rpmFactor = this.currentRPM / GAUGE_CONSTANTS.RPM.MAX;

    // Öldruck korreliert mit RPM
    const baseOilPressure = 4 + rpmFactor * 8;
    const oilPressures = [
      this.addNoise(baseOilPressure, 1),
      this.addNoise(baseOilPressure, 1),
      this.addNoise(baseOilPressure * 0.9, 1),
      this.addNoise(baseOilPressure * 1.1, 1),
    ];

    // Bremsmotor-Drehmoment korreliert mit RPM
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

    // Phase transitions
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
        // Durchläuft Gänge
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

    // Smooth transitions
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
  // Auto-Durchlauf Modus (alle Gänge durchfahren)
  // ============================================
  private autoRunPhase = 0;

  startAutoRun(): void {
    this.autoRunPhase = 0;
  }

  generateAutoRunData(): { data: DashboardData; isComplete: boolean } {
    const gears: GearPosition[] = ['1', '2', '3', '4', '5', '6', '7'];
    const shiftRPM = 7500;
    const dropRPM = 3000;
    const idleRPM = GAUGE_CONSTANTS.RPM.IDLE;

    this.autoRunPhase += 0.005;

    const totalPhases = gears.length * 2; // Hoch und runter
    const currentPhaseIndex = Math.floor(this.autoRunPhase * totalPhases);

    if (currentPhaseIndex >= totalPhases) {
      return { data: this.currentData, isComplete: true };
    }

    const isUpPhase = currentPhaseIndex < gears.length;
    const gearIndex = isUpPhase 
      ? currentPhaseIndex 
      : gears.length - 1 - (currentPhaseIndex - gears.length);

    const gear = gears[Math.min(gearIndex, gears.length - 1)];
    const phaseProgress = (this.autoRunPhase * totalPhases) % 1;

    let targetRPM: number;
    if (isUpPhase) {
      targetRPM = this.lerp(dropRPM, shiftRPM, phaseProgress);
    } else {
      targetRPM = this.lerp(shiftRPM, gearIndex === 0 ? idleRPM : dropRPM, phaseProgress);
    }

    this.currentRPM = this.lerp(this.currentRPM, targetRPM, 0.1);
    this.currentGear = gear;

    const data = this.generateRandomData();
    data.rpm = Math.round(this.currentRPM);
    data.gear = gear;

    return { data, isComplete: false };
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
    // P(kW) = (M × n) / 9549
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
    this.autoRunPhase = 0;
  }

  getCurrentPhase(): RealisticPhase {
    return this.realisticPhase;
  }
}

// Singleton Export
export const mockDataService = new MockDataService();
export default MockDataService;




hooks/index.ts:export { useMockData } from './useMockData';
export { useTheme } from './useTheme';

hooks/useMockData.ts:
// ============================================
// useMockData Hook - Live-Daten Updates
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { mockDataService } from '../services/MockDataService';
import { 
  DashboardData, 
  MockDataMode, 
  GearPosition 
} from '../types/dashboard.types';

interface UseMockDataOptions {
  mode?: MockDataMode;
  updateInterval?: number;
  autoStart?: boolean;
}

interface UseMockDataReturn {
  data: DashboardData;
  isConnected: boolean;
  isRunning: boolean;
  mode: MockDataMode;
  setMode: (mode: MockDataMode) => void;
  setGear: (gear: GearPosition) => void;
  setTargetRPM: (rpm: number) => void;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

const initialData: DashboardData = {
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

export function useMockData(options: UseMockDataOptions = {}): UseMockDataReturn {
  const {
    mode: initialMode = 'random',
    updateInterval = 50,
    autoStart = true,
  } = options;

  const [data, setData] = useState<DashboardData>(initialData);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [mode, setModeState] = useState<MockDataMode>(initialMode);
  const intervalRef = useRef<number | null>(null);

  // Set mode
  const setMode = useCallback((newMode: MockDataMode) => {
    setModeState(newMode);
    mockDataService.setMode(newMode);
  }, []);

  // Set gear
  const setGear = useCallback((gear: GearPosition) => {
    mockDataService.setGear(gear);
  }, []);

  // Set target RPM
  const setTargetRPM = useCallback((rpm: number) => {
    mockDataService.setTargetRPM(rpm);
  }, []);

  // Start data generation
  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  // Stop data generation
  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  // Reset
  const reset = useCallback(() => {
    mockDataService.reset();
    setData(initialData);
  }, []);

  // Update loop
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    mockDataService.setMode(mode);

    intervalRef.current = window.setInterval(() => {
      const newData = mockDataService.generateData();
      setData(newData);
    }, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, mode, updateInterval]);

  return {
    data,
    isConnected: data.isConnected,
    isRunning,
    mode,
    setMode,
    setGear,
    setTargetRPM,
    start,
    stop,
    reset,
  };
}

export default useMockData;

hooks/zseTheme.ts:
// ============================================
// useTheme Hook - Light/Dark Mode Toggle
// ============================================

import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface UseThemeReturn {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const THEME_STORAGE_KEY = 'pruefstand-theme';

export function useTheme(): UseThemeReturn {
  // Initialize with stored preference or default to 'light'
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    }
    return 'light'; // Default to light mode
  });

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    
    // Save preference
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // Set specific theme
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme,
  };
}

export default useTheme;



components/Dashboard/DashboardWarpper.css:
/* ============================================
   Dashboard Wrapper Styles
   Light Mode (Default) & Dark Mode Support
   ============================================ */

   .dashboard-wrapper {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg-gradient);
    padding: 12px;
    padding-bottom: 80px; /* Platz für Bottom Menu */
    transition: padding-bottom 0.4s ease, background 0.3s ease;
  }
  
  .dashboard-wrapper.menu-open {
    padding-bottom: 480px; /* Mehr Platz wenn Menu offen */
  }
  
  /* Header */
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    margin-bottom: 12px;
    box-shadow: var(--shadow-sm);
    transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  }
  
  .dashboard-title {
    font-size: 18px;
    font-weight: 500;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--text-primary);
  }
  
  .dashboard-header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .connection-status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: var(--text-secondary);
  }
  
  .connection-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-green);
    animation: pulse 2s infinite;
  }
  
  .connection-dot.disconnected {
    background: var(--color-red);
    animation: none;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  .dashboard-datetime {
    font-size: 11px;
    color: var(--text-dim);
  }
  
  /* Main Content */
  .dashboard-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  /* Gauge Section */
  .dashboard-gauges {
    transition: all 0.4s ease;
  }
  
  /* Lower Section (Log + Stats) */
  .dashboard-lower {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  
  .dashboard-lower.compact {
    grid-template-columns: 1fr;
  }
  
  /* Stats Panel */
  .dashboard-stats {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    padding: 16px;
    box-shadow: var(--shadow-sm);
    transition: background 0.3s ease, border-color 0.3s ease;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
  
  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  
  .stat-value {
    font-size: 24px;
    font-weight: 300;
    color: var(--text-primary);
  }
  
  .stat-label {
    font-size: 9px;
    font-weight: 500;
    color: var(--text-dim);
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  
  /* Footer Stats */
  .dashboard-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    font-size: 10px;
    color: var(--text-dim);
    margin-top: auto;
    box-shadow: var(--shadow-sm);
    transition: background 0.3s ease, border-color 0.3s ease;
  }
  
  .footer-stats {
    display: flex;
    gap: 30px;
  }
  
  .footer-stat {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .footer-stat-value {
    color: var(--text-secondary);
    font-weight: 500;
  }
  
  /* Mode Indicator */
  .mode-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 12px;
    background: rgba(0, 149, 255, 0.1);
    border: 1px solid rgba(0, 149, 255, 0.3);
    border-radius: 20px;
    font-size: 10px;
    color: var(--color-blue);
    transition: background 0.3s ease, border-color 0.3s ease;
  }
  
  [data-theme="dark"] .mode-indicator {
    background: rgba(0, 212, 255, 0.1);
    border-color: rgba(0, 212, 255, 0.3);
  }
  
  .mode-indicator.realistic {
    background: rgba(0, 200, 83, 0.1);
    border-color: rgba(0, 200, 83, 0.3);
    color: var(--color-green);
  }
  
  [data-theme="dark"] .mode-indicator.realistic {
    background: rgba(0, 230, 118, 0.1);
    border-color: rgba(0, 230, 118, 0.3);
  }
  
  /* Emergency Overlay */
  .emergency-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(229, 57, 53, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: emergencyPulse 0.5s ease infinite;
    backdrop-filter: blur(4px);
  }
  
  @keyframes emergencyPulse {
    0%, 100% { background: rgba(229, 57, 53, 0.25); }
    50% { background: rgba(229, 57, 53, 0.4); }
  }
  
  .emergency-content {
    background: var(--bg-panel);
    border: 3px solid var(--color-red);
    border-radius: 20px;
    padding: 40px 60px;
    text-align: center;
    box-shadow: var(--shadow-lg);
  }
  
  .emergency-icon {
    font-size: 64px;
    margin-bottom: 20px;
  }
  
  .emergency-title {
    font-size: 32px;
    font-weight: 600;
    color: var(--color-red);
    letter-spacing: 4px;
    margin-bottom: 12px;
  }
  
  .emergency-text {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 24px;
  }
  
  .emergency-reset-btn {
    padding: 14px 40px;
    background: var(--color-red);
    border: none;
    border-radius: 8px;
    color: white;
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 2px;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 12px rgba(229, 57, 53, 0.3);
  }
  
  .emergency-reset-btn:hover {
    background: #ef5350;
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(229, 57, 53, 0.4);
  }
  
  /* Responsive */
  @media (max-width: 900px) {
    .dashboard-lower {
      grid-template-columns: 1fr;
    }
  
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  
    .footer-stats {
      gap: 16px;
    }
    
    .dashboard-header-right {
      gap: 12px;
    }
  }
  
  @media (max-width: 600px) {
    .dashboard-header {
      flex-direction: column;
      gap: 12px;
      text-align: center;
    }
    
    .dashboard-header-right {
      flex-wrap: wrap;
      justify-content: center;
    }
  }
/* ============================================
   Dashboard Wrapper Styles
   Light Mode (Default) & Dark Mode Support
   ============================================ */

   .dashboard-wrapper {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg-gradient);
    padding: 12px;
    padding-bottom: 80px; /* Platz für Bottom Menu */
    transition: padding-bottom 0.4s ease, background 0.3s ease;
  }
  
  .dashboard-wrapper.menu-open {
    padding-bottom: 480px; /* Mehr Platz wenn Menu offen */
  }
  
  /* Header */
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    margin-bottom: 12px;
    box-shadow: var(--shadow-sm);
    transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  }
  
  .dashboard-title {
    font-size: 18px;
    font-weight: 500;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--text-primary);
  }
  
  .dashboard-header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .connection-status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: var(--text-secondary);
  }
  
  .connection-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-green);
    animation: pulse 2s infinite;
  }
  
  .connection-dot.disconnected {
    background: var(--color-red);
    animation: none;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  .dashboard-datetime {
    font-size: 11px;
    color: var(--text-dim);
  }
  
  /* Main Content */
  .dashboard-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  /* Gauge Section */
  .dashboard-gauges {
    transition: all 0.4s ease;
  }
  
  /* Lower Section (Log + Stats) */
  .dashboard-lower {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  
  .dashboard-lower.compact {
    grid-template-columns: 1fr;
  }
  
  /* Stats Panel */
  .dashboard-stats {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    padding: 16px;
    box-shadow: var(--shadow-sm);
    transition: background 0.3s ease, border-color 0.3s ease;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
  
  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  
  .stat-value {
    font-size: 24px;
    font-weight: 300;
    color: var(--text-primary);
  }
  
  .stat-label {
    font-size: 9px;
    font-weight: 500;
    color: var(--text-dim);
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  
  /* Footer Stats */
  .dashboard-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    font-size: 10px;
    color: var(--text-dim);
    margin-top: auto;
    box-shadow: var(--shadow-sm);
    transition: background 0.3s ease, border-color 0.3s ease;
  }
  
  .footer-stats {
    display: flex;
    gap: 30px;
  }
  
  .footer-stat {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .footer-stat-value {
    color: var(--text-secondary);
    font-weight: 500;
  }
  
  /* Mode Indicator */
  .mode-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 12px;
    background: rgba(0, 149, 255, 0.1);
    border: 1px solid rgba(0, 149, 255, 0.3);
    border-radius: 20px;
    font-size: 10px;
    color: var(--color-blue);
    transition: background 0.3s ease, border-color 0.3s ease;
  }
  
  [data-theme="dark"] .mode-indicator {
    background: rgba(0, 212, 255, 0.1);
    border-color: rgba(0, 212, 255, 0.3);
  }
  
  .mode-indicator.realistic {
    background: rgba(0, 200, 83, 0.1);
    border-color: rgba(0, 200, 83, 0.3);
    color: var(--color-green);
  }
  
  [data-theme="dark"] .mode-indicator.realistic {
    background: rgba(0, 230, 118, 0.1);
    border-color: rgba(0, 230, 118, 0.3);
  }
  
  /* Emergency Overlay */
  .emergency-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(229, 57, 53, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: emergencyPulse 0.5s ease infinite;
    backdrop-filter: blur(4px);
  }
  
  @keyframes emergencyPulse {
    0%, 100% { background: rgba(229, 57, 53, 0.25); }
    50% { background: rgba(229, 57, 53, 0.4); }
  }
  
  .emergency-content {
    background: var(--bg-panel);
    border: 3px solid var(--color-red);
    border-radius: 20px;
    padding: 40px 60px;
    text-align: center;
    box-shadow: var(--shadow-lg);
  }
  
  .emergency-icon {
    font-size: 64px;
    margin-bottom: 20px;
  }
  
  .emergency-title {
    font-size: 32px;
    font-weight: 600;
    color: var(--color-red);
    letter-spacing: 4px;
    margin-bottom: 12px;
  }
  
  .emergency-text {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 24px;
  }
  
  .emergency-reset-btn {
    padding: 14px 40px;
    background: var(--color-red);
    border: none;
    border-radius: 8px;
    color: white;
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 2px;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 12px rgba(229, 57, 53, 0.3);
  }
  
  .emergency-reset-btn:hover {
    background: #ef5350;
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(229, 57, 53, 0.4);
  }
  
  /* Responsive */
  @media (max-width: 900px) {
    .dashboard-lower {
      grid-template-columns: 1fr;
    }
  
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  
    .footer-stats {
      gap: 16px;
    }
    
    .dashboard-header-right {
      gap: 12px;
    }
  }
  
  @media (max-width: 600px) {
    .dashboard-header {
      flex-direction: column;
      gap: 12px;
      text-align: center;
    }
    
    .dashboard-header-right {
      flex-wrap: wrap;
      justify-content: center;
    }
  }

  
  DashboardWrapper.tsx:
  // ============================================
// DashboardWrapper - Haupt-Container
// ============================================

import React, { useState, useCallback, useEffect } from 'react';
import { GaugeGrid } from '../Gauges';
import { StatusLog } from '../StatusLog';
import { BottomMenu } from '../Menu';
import { useMockData } from '../../hooks/useMockData';
import { useTheme } from '../../hooks/useTheme';
import { 
  MenuPanel, 
  LogEntry, 
  GearPosition,
  MockDataMode,
  GAUGE_CONSTANTS 
} from '../../types/dashboard.types';
import './DashboardWrapper.css';

const DashboardWrapper: React.FC = () => {
  // State
  const [activePanel, setActivePanel] = useState<MenuPanel>('none');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedGear, setSelectedGear] = useState<GearPosition>('N');
  const [manualRPM, setManualRPM] = useState(0);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [autoSpeed, setAutoSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [mockMode, setMockMode] = useState<MockDataMode>('random');
  const [isEmergencyStop, setIsEmergencyStop] = useState(false);
  const [datetime, setDatetime] = useState(new Date());

  // Theme Hook
  const { isDark, toggleTheme } = useTheme();

  // Mock Data Hook
  const { data, isConnected, setMode, setGear, setTargetRPM, reset } = useMockData({
    mode: mockMode,
    updateInterval: 50,
  });

  // Update datetime
  useEffect(() => {
    const interval = setInterval(() => setDatetime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Add Log Entry
  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    const newEntry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      message,
    };
    setLogs(prev => [newEntry, ...prev].slice(0, 100)); // Keep last 100
  }, []);

  // Clear Logs
  const clearLogs = useCallback(() => {
    setLogs([]);
    addLog('info', 'Log gelöscht');
  }, [addLog]);

  // Handle Panel Change
  const handlePanelChange = useCallback((panel: MenuPanel) => {
    setActivePanel(panel);
    if (panel !== 'none') {
      addLog('info', `${panel.charAt(0).toUpperCase() + panel.slice(1)} geöffnet`);
    }
  }, [addLog]);

  // Handle Gear Select
  const handleGearSelect = useCallback((gear: string) => {
    setSelectedGear(gear as GearPosition);
    setGear(gear as GearPosition);
    addLog('success', `Gang ${gear} ausgewählt`);
  }, [addLog, setGear]);

  // Handle RPM Change
  const handleRPMChange = useCallback((rpm: number) => {
    setManualRPM(rpm);
    setTargetRPM(rpm);
  }, [setTargetRPM]);

  // Handle Auto Run Toggle
  const handleAutoRunToggle = useCallback(() => {
    if (isAutoRunning) {
      setIsAutoRunning(false);
      addLog('info', 'Automatischer Durchlauf gestoppt');
    } else {
      setIsAutoRunning(true);
      addLog('info', `Automatischer Durchlauf gestartet (${autoSpeed})`);
    }
  }, [isAutoRunning, autoSpeed, addLog]);

  // Handle Mock Mode Change
  const handleMockModeChange = useCallback((mode: MockDataMode) => {
    setMockMode(mode);
    setMode(mode);
    addLog('info', `Mock-Modus: ${mode === 'random' ? 'Zufällig' : 'Realistisch'}`);
  }, [addLog, setMode]);

  // Handle Emergency Stop
  const handleEmergencyStop = useCallback(() => {
    setIsEmergencyStop(true);
    setIsAutoRunning(false);
    reset();
    addLog('error', '🛑 NOT-AUS AKTIVIERT!');
    addLog('error', 'Alle Systeme werden gestoppt...');
  }, [addLog, reset]);

  // Reset Emergency
  const handleEmergencyReset = useCallback(() => {
    setIsEmergencyStop(false);
    addLog('warning', 'System wird zurückgesetzt...');
    setTimeout(() => {
      addLog('success', 'System bereit');
    }, 1000);
  }, [addLog]);

  // Generate sensor data for SensorPanel
  type SensorStatus = 'normal' | 'warning' | 'danger';
  const sensorData: { name: string; value: number; unit: string; status: SensorStatus }[] = [
    { name: 'Drehzahl', value: data.rpm, unit: 'U/min', status: (data.rpm > GAUGE_CONSTANTS.RPM.REDLINE ? 'danger' : 'normal') as SensorStatus },
    { name: 'Öldruck 1', value: data.oilPressures[0], unit: 'bar', status: (data.oilPressures[0] > 15 ? 'danger' : data.oilPressures[0] > 12 ? 'warning' : 'normal') as SensorStatus },
    { name: 'Öldruck 2', value: data.oilPressures[1], unit: 'bar', status: (data.oilPressures[1] > 15 ? 'danger' : data.oilPressures[1] > 12 ? 'warning' : 'normal') as SensorStatus },
    { name: 'Motor 1', value: data.brakeMotors.motor1.torque, unit: 'Nm', status: (data.brakeMotors.motor1.load > 85 ? 'danger' : data.brakeMotors.motor1.load > 70 ? 'warning' : 'normal') as SensorStatus },
    { name: 'Motor 2', value: data.brakeMotors.motor2.torque, unit: 'Nm', status: (data.brakeMotors.motor2.load > 85 ? 'danger' : data.brakeMotors.motor2.load > 70 ? 'warning' : 'normal') as SensorStatus },
    { name: 'Temperatur', value: data.temperature, unit: '°C', status: (data.temperature > 90 ? 'danger' : data.temperature > 75 ? 'warning' : 'normal') as SensorStatus },
  ];

  // Format runtime
  const formatRuntime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const isCompact = activePanel !== 'none';

  return (
    <div className={`dashboard-wrapper ${isCompact ? 'menu-open' : ''}`}>
      {/* Header */}
      <header className="dashboard-header">
        <h1 className="dashboard-title">🔧 Prüfstand Dashboard</h1>
        <div className="dashboard-header-right">
          <div className={`mode-indicator ${mockMode === 'realistic' ? 'realistic' : ''}`}>
            {mockMode === 'random' ? '🎲 Random' : '📊 Realistic'}
          </div>
          <div className="connection-status">
            <div className={`connection-dot ${isConnected ? '' : 'disconnected'}`} />
            <span>{isConnected ? 'Verbunden' : 'Getrennt'}</span>
          </div>
          <span className="dashboard-datetime">
            {datetime.toLocaleString('de-DE')}
          </span>
          {/* Theme Toggle */}
          <button 
            className="theme-toggle" 
            onClick={toggleTheme}
            title={isDark ? 'Zum Light Mode wechseln' : 'Zum Dark Mode wechseln'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Gauges */}
        <section className="dashboard-gauges">
          <GaugeGrid data={data} isCompact={isCompact} />
        </section>

        {/* Lower Section */}
        <section className={`dashboard-lower ${isCompact ? 'compact' : ''}`}>
          {/* Status Log */}
          <StatusLog
            logs={logs}
            maxVisible={5}
            onClear={clearLogs}
          />

          {/* Stats Panel (nur wenn nicht kompakt) */}
          {!isCompact && (
            <div className="dashboard-stats">
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-value">{formatRuntime(data.runtime)}</span>
                  <span className="stat-label">Laufzeit</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{data.cycles}</span>
                  <span className="stat-label">Zyklen</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{data.temperature.toFixed(0)}°C</span>
                  <span className="stat-label">Temperatur</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value" style={{ color: 'var(--color-cyan)' }}>
                    {data.gear}
                  </span>
                  <span className="stat-label">Gang</span>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="footer-stats">
          <div className="footer-stat">
            <span>Laufzeit:</span>
            <span className="footer-stat-value">{formatRuntime(data.runtime)}</span>
          </div>
          <div className="footer-stat">
            <span>Zyklen:</span>
            <span className="footer-stat-value">{data.cycles}</span>
          </div>
          <div className="footer-stat">
            <span>Max RPM:</span>
            <span className="footer-stat-value">{GAUGE_CONSTANTS.RPM.MAX.toLocaleString('de-DE')}</span>
          </div>
        </div>
        <span>Prüfstand v2.0 | {isConnected ? 'Mock Data Active' : 'Disconnected'}</span>
      </footer>

      {/* Bottom Menu */}
      <BottomMenu
        activePanel={activePanel}
        onPanelChange={handlePanelChange}
        onEmergencyStop={handleEmergencyStop}
        selectedGear={selectedGear}
        onGearSelect={handleGearSelect}
        manualRPM={manualRPM}
        onRPMChange={handleRPMChange}
        isAutoRunning={isAutoRunning}
        onAutoRunToggle={handleAutoRunToggle}
        autoSpeed={autoSpeed}
        onAutoSpeedChange={setAutoSpeed}
        sensorData={sensorData}
        mockMode={mockMode}
        onMockModeChange={handleMockModeChange}
      />

      {/* Emergency Overlay */}
      {isEmergencyStop && (
        <div className="emergency-overlay">
          <div className="emergency-content">
            <div className="emergency-icon">🛑</div>
            <h2 className="emergency-title">NOT-AUS</h2>
            <p className="emergency-text">Alle Systeme wurden gestoppt</p>
            <button className="emergency-reset-btn" onClick={handleEmergencyReset}>
              System zurücksetzen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardWrapper;



indexed.ts:
export { default as DashboardWrapper } from './DashboardWrapper';


components/Gauges/BaseGauge.tsx:
// ============================================
// BaseGauge - Wiederverwendbare Gauge-Komponente
// ============================================

import React, { useMemo, useId } from 'react';
import { GaugeProps, GaugeStatus, GaugeSize, COLORS } from '../../types/dashboard.types';
import { useTheme } from '../../hooks/useTheme';
import './gauges.css';

interface BaseGaugeProps extends GaugeProps {
  showNeedle?: boolean;
  showTicks?: boolean;
  tickInterval?: { major: number; minor: number };
  startAngle?: number;
  endAngle?: number;
  formatValue?: (value: number) => string;
  children?: React.ReactNode;
  className?: string;
}

// SVG Viewbox dimensions
const getViewBoxSize = (size: GaugeSize) => {
  switch (size) {
    case 'small': return 200;
    case 'medium': return 260;
    case 'large': return 320;
  }
};

const getTrackRadius = (size: GaugeSize) => {
  switch (size) {
    case 'small': return 70;
    case 'medium': return 95;
    case 'large': return 125;
  }
};

const getTickConfig = (size: GaugeSize) => {
  switch (size) {
    case 'small': return { outerRadius: 58, majorLength: 10, minorLength: 5, labelRadius: 42 };
    case 'medium': return { outerRadius: 78, majorLength: 14, minorLength: 7, labelRadius: 55 };
    case 'large': return { outerRadius: 105, majorLength: 18, minorLength: 9, labelRadius: 75 };
  }
};

const getNeedleConfig = (size: GaugeSize) => {
  const viewBox = getViewBoxSize(size);
  const center = viewBox / 2;
  switch (size) {
    case 'small': return { length: 45, width: 3, center };
    case 'medium': return { length: 65, width: 4, center };
    case 'large': return { length: 90, width: 5, center };
  }
};

// Helper: Polar to Cartesian
function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

// Helper: Arc Path
function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

const BaseGauge: React.FC<BaseGaugeProps> = ({
  value,
  maxValue,
  minValue = 0,
  warningThreshold,
  dangerThreshold,
  unit,
  label,
  size,
  accentColor,
  warningColor = COLORS.AMBER,
  dangerColor = COLORS.RED,
  showNeedle = true,
  showTicks = true,
  tickInterval = { major: 0, minor: 0 },
  startAngle = -135,
  endAngle = 135,
  formatValue,
  children,
  className = '',
}) => {
  const uniqueId = useId();
  const { isDark } = useTheme();
  const viewBox = getViewBoxSize(size);
  const center = viewBox / 2;
  const trackRadius = getTrackRadius(size);
  const tickConfig = getTickConfig(size);
  const needleConfig = getNeedleConfig(size);
  const totalAngle = endAngle - startAngle;
  
  // Theme-dependent colors for needle and hub
  const needleColors = isDark 
    ? { start: '#ffffff', mid: '#e0e0e0', end: '#a0a0a0' }
    : { start: '#2d3748', mid: '#4a5568', end: '#718096' };
  
  const hubColors = isDark
    ? { start: '#3a3a4a', end: '#1a1a24' }
    : { start: '#e0e5ec', end: '#c8cfd8' };
  
  const hubInnerColor = isDark ? '#1a1a24' : '#d4dae3';

  // Calculate status
  const status: GaugeStatus = useMemo(() => {
    if (dangerThreshold && value >= dangerThreshold) return 'danger';
    if (warningThreshold && value >= warningThreshold) return 'warning';
    return 'normal';
  }, [value, warningThreshold, dangerThreshold]);

  // Calculate progress
  const progress = Math.min(Math.max((value - minValue) / (maxValue - minValue), 0), 1);
  const needleAngle = startAngle + progress * totalAngle;
  const arcLength = (totalAngle / 360) * 2 * Math.PI * trackRadius;
  const progressOffset = arcLength * (1 - progress);

  // Determine current color
  const currentColor = status === 'danger' ? dangerColor : status === 'warning' ? warningColor : accentColor;
  const currentGlow = status === 'danger' 
    ? 'rgba(255, 59, 92, 0.4)' 
    : status === 'warning' 
    ? 'rgba(255, 171, 0, 0.4)' 
    : accentColor.replace(')', ', 0.4)').replace('rgb', 'rgba');

  // Generate ticks
  const ticks = useMemo(() => {
    if (!showTicks || tickInterval.minor === 0) return [];

    const tickElements: React.ReactElement[] = [];
    for (let val = minValue; val <= maxValue; val += tickInterval.minor) {
      const angle = startAngle + ((val - minValue) / (maxValue - minValue)) * totalAngle;
      const isMajor = tickInterval.major > 0 && (val - minValue) % tickInterval.major === 0;
      const isWarning = warningThreshold && val >= warningThreshold && (!dangerThreshold || val < dangerThreshold);
      const isDanger = dangerThreshold && val >= dangerThreshold;

      const tickLength = isMajor ? tickConfig.majorLength : tickConfig.minorLength;
      const outer = polarToCartesian(center, center, tickConfig.outerRadius, angle);
      const inner = polarToCartesian(center, center, tickConfig.outerRadius - tickLength, angle);

      let tickClass = 'gauge-tick';
      if (isMajor) tickClass += ' major';
      if (isDanger) tickClass += ' danger';
      else if (isWarning) tickClass += ' warning';

      tickElements.push(
        <line
          key={`tick-${val}`}
          x1={outer.x}
          y1={outer.y}
          x2={inner.x}
          y2={inner.y}
          className={tickClass}
        />
      );

      // Labels for major ticks
      if (isMajor && tickInterval.major > 0) {
        const labelPos = polarToCartesian(center, center, tickConfig.labelRadius, angle);
        let labelClass = 'gauge-tick-label';
        if (isDanger) labelClass += ' danger';
        else if (isWarning) labelClass += ' warning';

        tickElements.push(
          <text
            key={`label-${val}`}
            x={labelPos.x}
            y={labelPos.y}
            className={labelClass}
          >
            {val}
          </text>
        );
      }
    }
    return tickElements;
  }, [showTicks, tickInterval, minValue, maxValue, startAngle, totalAngle, center, tickConfig, warningThreshold, dangerThreshold]);

  // Format display value
  const displayValue = formatValue ? formatValue(value) : value.toFixed(value >= 100 ? 0 : 1);

  return (
    <div 
      className={`gauge-container ${size} ${className}`}
      style={{ '--current-glow': currentGlow } as React.CSSProperties}
    >
      <span className="gauge-title">{label}</span>
      
      <div className="gauge-svg-wrapper">
        <svg className="gauge-svg" viewBox={`0 0 ${viewBox} ${viewBox}`}>
          <defs>
            <linearGradient id={`progress-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={currentColor} />
              <stop offset="100%" stopColor={currentColor} stopOpacity={0.7} />
            </linearGradient>
            <linearGradient id={`needle-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={needleColors.start} />
              <stop offset="40%" stopColor={needleColors.mid} />
              <stop offset="100%" stopColor={needleColors.end} />
            </linearGradient>
            <radialGradient id={`hub-${uniqueId}`} cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor={hubColors.start} />
              <stop offset="100%" stopColor={hubColors.end} />
            </radialGradient>
          </defs>

          {/* Outer Ring */}
          <circle
            className="gauge-outer-ring"
            cx={center}
            cy={center}
            r={center - 5}
          />

          {/* Track Background */}
          <path
            className="gauge-track-bg"
            d={describeArc(center, center, trackRadius, startAngle, endAngle)}
          />

          {/* Track Progress */}
          <path
            className={`gauge-track-progress ${status}`}
            d={describeArc(center, center, trackRadius, startAngle, endAngle)}
            stroke={`url(#progress-${uniqueId})`}
            style={{
              strokeDasharray: arcLength,
              strokeDashoffset: progressOffset,
            }}
          />

          {/* Ticks */}
          <g>{ticks}</g>

          {/* Needle */}
          {showNeedle && (
            <g
              className="gauge-needle-group"
              style={{
                transform: `rotate(${needleAngle}deg)`,
                transformOrigin: `${center}px ${center}px`,
              }}
            >
              {/* Needle Glow */}
              <polygon
                className={`gauge-needle-glow ${status}`}
                points={`
                  ${center},${center - needleConfig.length - 5}
                  ${center - needleConfig.width},${center - 10}
                  ${center},${center + 8}
                  ${center + needleConfig.width},${center - 10}
                `}
                fill={currentColor}
              />
              {/* Needle */}
              <polygon
                className="gauge-needle"
                points={`
                  ${center},${center - needleConfig.length}
                  ${center - needleConfig.width + 1},${center - 8}
                  ${center},${center + 5}
                  ${center + needleConfig.width - 1},${center - 8}
                `}
                fill={`url(#needle-${uniqueId})`}
              />
            </g>
          )}

          {/* Center Hub */}
          <circle
            className="gauge-center-hub-outer"
            cx={center}
            cy={center}
            r={size === 'small' ? 10 : size === 'medium' ? 14 : 18}
            fill={`url(#hub-${uniqueId})`}
          />
          <circle
            className="gauge-center-hub-inner"
            cx={center}
            cy={center}
            r={size === 'small' ? 7 : size === 'medium' ? 10 : 13}
            fill={hubInnerColor}
          />
          <circle
            className="gauge-center-hub-dot"
            cx={center}
            cy={center}
            r={size === 'small' ? 3 : size === 'medium' ? 4 : 5}
            fill={currentColor}
            style={{
              filter: `drop-shadow(0 0 ${size === 'small' ? 4 : 8}px ${currentGlow})`,
            }}
          />
        </svg>

        {/* Digital Display */}
        <div className="gauge-digital-display">
          <div className={`gauge-value ${status}`} style={{ color: currentColor }}>
            {displayValue}
          </div>
          <div className="gauge-unit">{unit}</div>
        </div>
      </div>

      {/* Status Badge */}
      <div className={`gauge-status-badge ${status}`}>
        {status === 'danger' ? 'Kritisch' : status === 'warning' ? 'Hoch' : 'Normal'}
      </div>

      {/* Additional children (motor ID, sensor ID, etc.) */}
      {children}

      {/* Warning Alert */}
      {(status === 'warning' || status === 'danger') && (
        <div className={`gauge-warning-alert ${status} visible`}>
          <div className="gauge-warning-dot" />
          <span className="gauge-warning-text">
            {status === 'danger' ? 'Kritisch!' : 'Warnung'}
          </span>
        </div>
      )}
    </div>
  );
};

export default BaseGauge;


BrakeMotorGauge.tsx:
// ============================================
// BrakeMotorGauge - Bremsmotor Drehmoment (0-1500 Nm)
// ============================================

import React from 'react';
import BaseGauge from './BaseGauge';
import { GaugeSize, GAUGE_CONSTANTS, COLORS } from '../../types/dashboard.types';

interface BrakeMotorGaugeProps {
  value: number; // Torque in Nm
  size: GaugeSize;
  motorId: 1 | 2;
  label?: string;
}

const BrakeMotorGauge: React.FC<BrakeMotorGaugeProps> = ({
  value,
  size,
  motorId,
  label,
}) => {
  const displayLabel = label || `Bremsmotor M${motorId}`;
  
  // Motor 1 = Cyan, Motor 2 = Purple
  const accentColor = motorId === 1 ? COLORS.CYAN : COLORS.PURPLE;

  const warningThreshold = GAUGE_CONSTANTS.BRAKE_MOTOR.MAX_TORQUE * 
    (GAUGE_CONSTANTS.BRAKE_MOTOR.WARNING_PERCENT / 100);
  const dangerThreshold = GAUGE_CONSTANTS.BRAKE_MOTOR.MAX_TORQUE * 
    (GAUGE_CONSTANTS.BRAKE_MOTOR.DANGER_PERCENT / 100);

  // Calculate kW
  const kw = (value * GAUGE_CONSTANTS.BRAKE_MOTOR.MOTOR_RPM) / 9549;
  const loadPercent = (value / GAUGE_CONSTANTS.BRAKE_MOTOR.MAX_TORQUE) * 100;

  return (
    <BaseGauge
      value={value}
      maxValue={GAUGE_CONSTANTS.BRAKE_MOTOR.MAX_TORQUE}
      minValue={0}
      warningThreshold={warningThreshold}
      dangerThreshold={dangerThreshold}
      unit="Nm"
      label={displayLabel}
      size={size}
      accentColor={accentColor}
      warningColor={COLORS.ORANGE}
      dangerColor={COLORS.RED}
      showNeedle={true}
      showTicks={true}
      tickInterval={{ major: 300, minor: 150 }}
      formatValue={(v) => Math.round(v).toString()}
      className="brake-motor-gauge"
    >
      {/* Motor ID Badge */}
      <div 
        className="gauge-motor-badge" 
        style={{ 
          color: value >= dangerThreshold ? COLORS.RED : 
                 value >= warningThreshold ? COLORS.ORANGE : accentColor 
        }}
      >
        M{motorId}
      </div>

      {/* Additional Info (nur bei medium/large) */}
      {size !== 'small' && (
        <div 
          style={{
            position: 'absolute',
            bottom: size === 'large' ? '45px' : '35px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: size === 'large' ? '16px' : '10px',
            fontSize: size === 'large' ? '11px' : '9px',
            color: 'var(--text-dim)',
          }}
        >
          <span>
            <strong style={{ color: accentColor }}>{kw.toFixed(1)}</strong> kW
          </span>
          <span>
            <strong style={{ color: 'var(--text-secondary)' }}>{loadPercent.toFixed(0)}</strong>%
          </span>
        </div>
      )}
    </BaseGauge>
  );
};

export default BrakeMotorGauge;

GaugeGrid.css:
/* ============================================
   GaugeGrid Layout Styles
   ============================================ */

   .gauge-grid {
    display: grid;
    gap: 12px;
    width: 100%;
    transition: all 0.4s ease;
  }
  
  /* Expanded Layout - Full View */
  .gauge-grid.expanded {
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: auto auto;
    grid-template-areas:
      "oil1 oil2 rpm motor1 placeholder1"
      "oil3 oil4 rpm motor2 placeholder2";
  }
  
  .gauge-grid.expanded .gauge-grid-item.rpm {
    grid-area: rpm;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .gauge-grid.expanded .gauge-grid-item.oil1 { grid-area: oil1; }
  .gauge-grid.expanded .gauge-grid-item.oil2 { grid-area: oil2; }
  .gauge-grid.expanded .gauge-grid-item.oil3 { grid-area: oil3; }
  .gauge-grid.expanded .gauge-grid-item.oil4 { grid-area: oil4; }
  .gauge-grid.expanded .gauge-grid-item.motor1 { grid-area: motor1; }
  .gauge-grid.expanded .gauge-grid-item.motor2 { grid-area: motor2; }
  .gauge-grid.expanded .gauge-grid-item.placeholder1 { grid-area: placeholder1; }
  .gauge-grid.expanded .gauge-grid-item.placeholder2 { grid-area: placeholder2; }
  
  /* Compact Layout - When Menu is Open */
  .gauge-grid.compact {
    grid-template-columns: repeat(9, 1fr);
    grid-template-rows: 1fr;
    gap: 8px;
    padding: 8px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
  }
  
  .gauge-grid.compact .gauge-grid-item {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  /* Grid Item Styling */
  .gauge-grid-item {
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.3s ease;
  }
  
  /* Hover Effects */
  .gauge-grid-item:hover {
    transform: scale(1.02);
    z-index: 10;
  }
  
  .gauge-grid.compact .gauge-grid-item:hover {
    transform: scale(1.05);
  }
  
  /* Animation for mode switch */
  @keyframes gaugeAppear {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .gauge-grid-item {
    animation: gaugeAppear 0.3s ease forwards;
  }
  
  .gauge-grid-item:nth-child(1) { animation-delay: 0ms; }
  .gauge-grid-item:nth-child(2) { animation-delay: 30ms; }
  .gauge-grid-item:nth-child(3) { animation-delay: 60ms; }
  .gauge-grid-item:nth-child(4) { animation-delay: 90ms; }
  .gauge-grid-item:nth-child(5) { animation-delay: 120ms; }
  .gauge-grid-item:nth-child(6) { animation-delay: 150ms; }
  .gauge-grid-item:nth-child(7) { animation-delay: 180ms; }
  .gauge-grid-item:nth-child(8) { animation-delay: 210ms; }
  .gauge-grid-item:nth-child(9) { animation-delay: 240ms; }
  
  /* Responsive Adjustments */
  @media (max-width: 1200px) {
    .gauge-grid.expanded {
      grid-template-columns: repeat(4, 1fr);
      grid-template-areas:
        "rpm rpm oil1 oil2"
        "rpm rpm oil3 oil4"
        "motor1 motor2 placeholder1 placeholder2";
    }
  }
  
  @media (max-width: 900px) {
    .gauge-grid.expanded {
      grid-template-columns: repeat(3, 1fr);
      grid-template-areas:
        "rpm rpm rpm"
        "oil1 oil2 oil3"
        "oil4 motor1 motor2"
        "placeholder1 placeholder2 .";
    }
  
    .gauge-grid.compact {
      grid-template-columns: repeat(5, 1fr);
      grid-template-rows: auto auto;
    }
  }
  
  @media (max-width: 600px) {
    .gauge-grid.expanded {
      grid-template-columns: repeat(2, 1fr);
      grid-template-areas:
        "rpm rpm"
        "oil1 oil2"
        "oil3 oil4"
        "motor1 motor2"
        "placeholder1 placeholder2";
    }
  
    .gauge-grid.compact {
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: auto auto auto;
    }
  }
  

  
GaugeGrid.tsx:
// ============================================
// GaugeGrid - Container für alle Gauges
// ============================================

import React from 'react';
import RPMGauge from './RPMGauge';
import OilPressureGauge from './OilPressureGauge';
import BrakeMotorGauge from './BrakeMotorGauge';
import PlaceholderGauge from './PlaceholderGauge';
import { DashboardData, GaugeSize } from '../../types/dashboard.types';
import './GaugeGrid.css';

interface GaugeGridProps {
  data: DashboardData;
  isCompact: boolean;
}

const GaugeGrid: React.FC<GaugeGridProps> = ({ data, isCompact }) => {
  const gaugeSize: GaugeSize = isCompact ? 'small' : 'medium';
  const rpmSize: GaugeSize = isCompact ? 'small' : 'large';

  return (
    <div className={`gauge-grid ${isCompact ? 'compact' : 'expanded'}`}>
      {/* RPM Gauge - Prominent in der Mitte */}
      <div className="gauge-grid-item rpm">
        <RPMGauge
          value={data.rpm}
          size={rpmSize}
          gear={data.gear}
        />
      </div>

      {/* Oil Pressure Gauges */}
      <div className="gauge-grid-item oil1">
        <OilPressureGauge
          value={data.oilPressures[0]}
          size={gaugeSize}
          sensorId={1}
        />
      </div>
      <div className="gauge-grid-item oil2">
        <OilPressureGauge
          value={data.oilPressures[1]}
          size={gaugeSize}
          sensorId={2}
        />
      </div>
      <div className="gauge-grid-item oil3">
        <OilPressureGauge
          value={data.oilPressures[2]}
          size={gaugeSize}
          sensorId={3}
        />
      </div>
      <div className="gauge-grid-item oil4">
        <OilPressureGauge
          value={data.oilPressures[3]}
          size={gaugeSize}
          sensorId={4}
        />
      </div>

      {/* Brake Motor Gauges */}
      <div className="gauge-grid-item motor1">
        <BrakeMotorGauge
          value={data.brakeMotors.motor1.torque}
          size={gaugeSize}
          motorId={1}
        />
      </div>
      <div className="gauge-grid-item motor2">
        <BrakeMotorGauge
          value={data.brakeMotors.motor2.torque}
          size={gaugeSize}
          motorId={2}
        />
      </div>

      {/* Placeholder Gauges */}
      <div className="gauge-grid-item placeholder1">
        <PlaceholderGauge
          label="Temperatur"
          size={gaugeSize}
        />
      </div>
      <div className="gauge-grid-item placeholder2">
        <PlaceholderGauge
          label="Durchfluss"
          size={gaugeSize}
        />
      </div>
    </div>
  );
};

export default GaugeGrid;

gauges.css:
/* ============================================
   Gauge Styles für Prüfstand Dashboard
   Light Mode (Default) & Dark Mode Support
   ============================================ */

/* Gauge Container */
.gauge-container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    padding: 12px;
    transition: all 0.3s ease;
    box-shadow: var(--shadow-sm);
  }
  
  .gauge-container:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
  
  /* Size Variants */
  .gauge-container.small {
    width: 120px;
    height: 140px;
    padding: 8px;
  }
  
  .gauge-container.medium {
    width: 180px;
    height: 200px;
    padding: 12px;
  }
  
  .gauge-container.large {
    width: 260px;
    height: 280px;
    padding: 16px;
  }
  
  /* SVG Container */
  .gauge-svg-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .gauge-container.small .gauge-svg-wrapper {
    width: 100px;
    height: 100px;
  }
  
  .gauge-container.medium .gauge-svg-wrapper {
    width: 150px;
    height: 150px;
  }
  
  .gauge-container.large .gauge-svg-wrapper {
    width: 220px;
    height: 220px;
  }
  
  .gauge-svg {
    width: 100%;
    height: 100%;
    filter: drop-shadow(var(--shadow-sm));
  }
  
  /* Gauge Elements */
  .gauge-outer-ring {
    fill: none;
    stroke: var(--glass-border);
    stroke-width: 1;
  }
  
  .gauge-track-bg {
    fill: none;
    stroke: var(--gauge-track-bg);
    stroke-linecap: round;
  }
  
  .gauge-container.small .gauge-track-bg {
    stroke-width: 14;
  }
  
  .gauge-container.medium .gauge-track-bg {
    stroke-width: 18;
  }
  
  .gauge-container.large .gauge-track-bg {
    stroke-width: 24;
  }
  
  .gauge-track-progress {
    fill: none;
    stroke-linecap: round;
    transition: stroke-dashoffset 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .gauge-container.small .gauge-track-progress {
    stroke-width: 14;
  }
  
  .gauge-container.medium .gauge-track-progress {
    stroke-width: 18;
  }
  
  .gauge-container.large .gauge-track-progress {
    stroke-width: 24;
  }
  
  .gauge-track-progress.normal {
    filter: drop-shadow(0 0 8px var(--current-glow));
  }
  
  .gauge-track-progress.warning {
    filter: drop-shadow(0 0 12px var(--glow-orange));
  }
  
  .gauge-track-progress.danger {
    filter: drop-shadow(0 0 16px var(--glow-red));
  }
  
  /* Ticks - Light Mode */
  .gauge-tick {
    stroke: rgba(0, 0, 0, 0.15);
    stroke-width: 1.5;
    stroke-linecap: round;
  }
  
  .gauge-tick.major {
    stroke: rgba(0, 0, 0, 0.3);
    stroke-width: 2;
  }
  
  /* Ticks - Dark Mode */
  [data-theme="dark"] .gauge-tick {
    stroke: rgba(255, 255, 255, 0.2);
  }
  
  [data-theme="dark"] .gauge-tick.major {
    stroke: rgba(255, 255, 255, 0.4);
  }
  
  .gauge-tick.warning {
    stroke: var(--color-amber);
    opacity: 0.8;
  }
  
  .gauge-tick.danger {
    stroke: var(--color-red);
    opacity: 0.8;
  }
  
  /* Tick Labels */
  .gauge-tick-label {
    fill: var(--text-secondary);
    font-family: 'Outfit', sans-serif;
    text-anchor: middle;
    dominant-baseline: middle;
  }
  
  .gauge-container.small .gauge-tick-label {
    font-size: 8px;
    font-weight: 400;
  }
  
  .gauge-container.medium .gauge-tick-label {
    font-size: 11px;
    font-weight: 400;
  }
  
  .gauge-container.large .gauge-tick-label {
    font-size: 14px;
    font-weight: 400;
  }
  
  .gauge-tick-label.warning {
    fill: var(--color-amber);
  }
  
  .gauge-tick-label.danger {
    fill: var(--color-red);
  }
  
  /* Needle */
  .gauge-needle-group {
    transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .gauge-needle {
    filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.3));
  }
  
  .gauge-needle-glow {
    filter: blur(3px);
    opacity: 0.4;
    transition: fill 0.3s, opacity 0.3s;
  }
  
  [data-theme="dark"] .gauge-needle-glow {
    opacity: 0.5;
  }
  
  .gauge-needle-glow.warning {
    opacity: 0.6;
  }
  
  .gauge-needle-glow.danger {
    opacity: 0.7;
  }
  
  /* Center Hub - Light Mode */
  .gauge-center-hub-outer {
    filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.2));
  }
  
  .gauge-center-hub-inner {
    fill: var(--gauge-hub-inner);
  }
  
  .gauge-center-hub-dot {
    transition: fill 0.3s, filter 0.3s;
  }
  
  /* Digital Display */
  .gauge-digital-display {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, 15%);
    text-align: center;
    pointer-events: none;
  }
  
  .gauge-container.small .gauge-digital-display {
    transform: translate(-50%, 10%);
  }
  
  .gauge-value {
    font-weight: 300;
    color: var(--text-primary);
    letter-spacing: -1px;
    line-height: 1;
    transition: color 0.3s, text-shadow 0.3s;
  }
  
  [data-theme="dark"] .gauge-value {
    font-weight: 200;
  }
  
  .gauge-container.small .gauge-value {
    font-size: 20px;
  }
  
  .gauge-container.medium .gauge-value {
    font-size: 32px;
  }
  
  .gauge-container.large .gauge-value {
    font-size: 48px;
  }
  
  .gauge-value.warning {
    color: var(--color-orange);
    text-shadow: 0 0 20px var(--glow-orange);
  }
  
  .gauge-value.danger {
    color: var(--color-red);
    text-shadow: 0 0 20px var(--glow-red);
  }
  
  .gauge-unit {
    font-weight: 400;
    color: var(--text-dim);
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-top: 2px;
  }
  
  .gauge-container.small .gauge-unit {
    font-size: 8px;
    letter-spacing: 1px;
  }
  
  .gauge-container.medium .gauge-unit {
    font-size: 10px;
  }
  
  .gauge-container.large .gauge-unit {
    font-size: 12px;
  }
  
  /* Gauge Title */
  .gauge-title {
    font-weight: 500;
    color: var(--text-dim);
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  
  .gauge-container.small .gauge-title {
    font-size: 8px;
    letter-spacing: 1px;
  }
  
  .gauge-container.medium .gauge-title {
    font-size: 10px;
  }
  
  .gauge-container.large .gauge-title {
    font-size: 11px;
  }
  
  /* Status Badge */
  .gauge-status-badge {
    padding: 3px 8px;
    border-radius: 10px;
    font-size: 9px;
    font-weight: 500;
    margin-top: 6px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  .gauge-container.small .gauge-status-badge {
    font-size: 7px;
    padding: 2px 6px;
    margin-top: 4px;
  }
  
  .gauge-status-badge.normal {
    background: rgba(0, 200, 83, 0.12);
    color: var(--color-green);
    border: 1px solid rgba(0, 200, 83, 0.25);
  }
  
  .gauge-status-badge.warning {
    background: rgba(255, 109, 0, 0.12);
    color: var(--color-orange);
    border: 1px solid rgba(255, 109, 0, 0.25);
  }
  
  .gauge-status-badge.danger {
    background: rgba(229, 57, 53, 0.12);
    color: var(--color-red);
    border: 1px solid rgba(229, 57, 53, 0.25);
  }
  
  /* Placeholder Gauge */
  .gauge-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--glass-bg);
    border: 2px dashed var(--glass-border);
    border-radius: 12px;
    color: var(--text-dim);
  }
  
  .gauge-placeholder-icon {
    font-size: 32px;
    margin-bottom: 8px;
    opacity: 0.5;
  }
  
  .gauge-container.small .gauge-placeholder-icon {
    font-size: 20px;
    margin-bottom: 4px;
  }
  
  .gauge-placeholder-text {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  
  .gauge-container.small .gauge-placeholder-text {
    font-size: 8px;
  }
  
  /* Motor ID Badge */
  .gauge-motor-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 1px;
    transition: color 0.3s;
  }
  
  .gauge-container.small .gauge-motor-badge {
    font-size: 9px;
    top: 6px;
    right: 6px;
  }
  
  /* Sensor ID Badge */
  .gauge-sensor-badge {
    position: absolute;
    top: 8px;
    left: 8px;
    font-size: 10px;
    font-weight: 500;
    color: var(--text-dim);
    letter-spacing: 1px;
  }
  
  .gauge-container.small .gauge-sensor-badge {
    font-size: 8px;
    top: 6px;
    left: 6px;
  }
  
  /* Warning Alert */
  .gauge-warning-alert {
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 10px;
    opacity: 0;
    transition: opacity 0.3s;
    z-index: 10;
  }
  
  .gauge-warning-alert.visible {
    opacity: 1;
  }
  
  .gauge-warning-alert.warning {
    background: rgba(255, 109, 0, 0.15);
    border: 1px solid rgba(255, 109, 0, 0.3);
  }
  
  .gauge-warning-alert.danger {
    background: rgba(229, 57, 53, 0.15);
    border: 1px solid rgba(229, 57, 53, 0.3);
  }
  
  .gauge-warning-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    animation: pulse-dot 0.8s ease-in-out infinite;
  }
  
  .gauge-warning-alert.warning .gauge-warning-dot {
    background: var(--color-amber);
  }
  
  .gauge-warning-alert.danger .gauge-warning-dot {
    background: var(--color-red);
  }
  
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }
  
  .gauge-warning-text {
    font-size: 8px;
    font-weight: 500;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  
  .gauge-warning-alert.warning .gauge-warning-text {
    color: var(--color-amber);
  }
  
  .gauge-warning-alert.danger .gauge-warning-text {
    color: var(--color-red);
  }

  
  index.ts:
  // ============================================
// Gauge Components Export
// ============================================

export { default as BaseGauge } from './BaseGauge';
export { default as RPMGauge } from './RPMGauge';
export { default as OilPressureGauge } from './OilPressureGauge';
export { default as BrakeMotorGauge } from './BrakeMotorGauge';
export { default as PlaceholderGauge } from './PlaceholderGauge';
export { default as GaugeGrid } from './GaugeGrid';

// Re-export types
export type { GaugeProps, GaugeSize, GaugeStatus } from '../../types/dashboard.types';



PlaceholderGauge.tsx:
// ============================================
// PlaceholderGauge - Platzhalter für zukünftige Gauges
// ============================================

import React from 'react';
import { GaugeSize } from '../../types/dashboard.types';
import './gauges.css';

interface PlaceholderGaugeProps {
  label: string;
  size: GaugeSize;
  id?: string;
}

const PlaceholderGauge: React.FC<PlaceholderGaugeProps> = ({
  label,
  size,
  id,
}) => {
  return (
    <div className={`gauge-container gauge-placeholder ${size}`} id={id}>
      <div className="gauge-placeholder-icon">📊</div>
      <div className="gauge-placeholder-text">{label}</div>
    </div>
  );
};

export default PlaceholderGauge;



RPMGauge.tsx
// ============================================
// RPMGauge - Drehzahlanzeige (0-12000 U/min)
// ============================================

import React from 'react';
import BaseGauge from './BaseGauge';
import { GaugeSize, GearPosition, GAUGE_CONSTANTS, COLORS } from '../../types/dashboard.types';

interface RPMGaugeProps {
  value: number;
  size: GaugeSize;
  gear?: GearPosition;
  redlineRPM?: number;
  label?: string;
}

const RPMGauge: React.FC<RPMGaugeProps> = ({
  value,
  size,
  gear = 'N',
  redlineRPM = GAUGE_CONSTANTS.RPM.REDLINE,
  label = 'Drehzahl',
}) => {
  // Format als x.x für Tausender-Anzeige
  const formatRPM = (rpm: number) => {
    return (rpm / 1000).toFixed(1);
  };

  return (
    <BaseGauge
      value={value}
      maxValue={GAUGE_CONSTANTS.RPM.MAX}
      minValue={0}
      warningThreshold={redlineRPM - 1000}
      dangerThreshold={redlineRPM}
      unit="× 1000 U/min"
      label={label}
      size={size}
      accentColor={COLORS.BLUE}
      warningColor={COLORS.ORANGE}
      dangerColor={COLORS.RED}
      showNeedle={true}
      showTicks={true}
      tickInterval={{ major: 1000, minor: 500 }}
      formatValue={formatRPM}
      className="rpm-gauge"
    >
      {/* Gear Display */}
      <div 
        className="gauge-motor-badge" 
        style={{ 
          color: value >= redlineRPM ? COLORS.RED : COLORS.BLUE,
          fontSize: size === 'small' ? '14px' : size === 'medium' ? '18px' : '24px',
          fontWeight: 300,
        }}
      >
        {gear}
      </div>
    </BaseGauge>
  );
};

export default RPMGauge;



StatusLogs.css: 
/* ============================================
   StatusLog Styles
   Light Mode (Default) & Dark Mode Support
   ============================================ */

   .status-log {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    max-height: 200px;
    box-shadow: var(--shadow-sm);
    transition: background 0.3s ease, border-color 0.3s ease;
  }
  
  .status-log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--glass-border);
  }
  
  .status-log-title {
    font-size: 11px;
    font-weight: 500;
    color: var(--text-secondary);
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  
  .status-log-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .status-log-count {
    font-size: 9px;
    color: var(--text-dim);
  }
  
  .status-log-clear {
    font-size: 9px;
    color: var(--text-dim);
    cursor: pointer;
    padding: 4px 10px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.05);
    border: none;
    font-family: 'Outfit', sans-serif;
    transition: all 0.2s;
  }
  
  [data-theme="dark"] .status-log-clear {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .status-log-clear:hover {
    background: rgba(0, 0, 0, 0.1);
    color: var(--text-secondary);
  }
  
  [data-theme="dark"] .status-log-clear:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .status-log-content {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .status-log-empty {
    padding: 20px;
    text-align: center;
    color: var(--text-dim);
    font-size: 11px;
  }
  
  .status-log-entry {
    padding: 6px 10px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 11px;
    animation: logEntryAppear 0.3s ease forwards;
    opacity: 0;
    transform: translateY(-5px);
  }
  
  @keyframes logEntryAppear {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .status-log-entry.info {
    background: rgba(0, 168, 204, 0.08);
    border-left: 3px solid var(--color-cyan);
  }
  
  [data-theme="dark"] .status-log-entry.info {
    background: rgba(0, 188, 212, 0.1);
  }
  
  .status-log-entry.success {
    background: rgba(0, 200, 83, 0.08);
    border-left: 3px solid var(--color-green);
  }
  
  [data-theme="dark"] .status-log-entry.success {
    background: rgba(0, 230, 118, 0.1);
  }
  
  .status-log-entry.warning {
    background: rgba(255, 109, 0, 0.08);
    border-left: 3px solid var(--color-orange);
  }
  
  [data-theme="dark"] .status-log-entry.warning {
    background: rgba(255, 152, 0, 0.1);
  }
  
  .status-log-entry.error {
    background: rgba(229, 57, 53, 0.08);
    border-left: 3px solid var(--color-red);
  }
  
  [data-theme="dark"] .status-log-entry.error {
    background: rgba(255, 59, 92, 0.1);
  }
  
  .status-log-icon {
    font-size: 12px;
    min-width: 16px;
    text-align: center;
  }
  
  .status-log-time {
    color: var(--text-dim);
    min-width: 60px;
    font-size: 10px;
  }
  
  .status-log-message {
    flex: 1;
    color: var(--text-secondary);
  }
  
  .status-log-entry.info .status-log-message {
    color: var(--color-cyan);
  }
  
  .status-log-entry.success .status-log-message {
    color: var(--color-green);
  }
  
  .status-log-entry.warning .status-log-message {
    color: var(--color-orange);
  }
  
  .status-log-entry.error .status-log-message {
    color: var(--color-red);
  }
  
  .status-log-more {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--glass-border);
    text-align: center;
    font-size: 9px;
    color: var(--text-dim);
  }
  
  /* Scrollbar */
  .status-log-content::-webkit-scrollbar {
    width: 4px;
  }
  
  .status-log-content::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .status-log-content::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 2px;
  }
  
  [data-theme="dark"] .status-log-content::-webkit-scrollbar-thumb {
    background: var(--glass-border);
  }
  
  .status-log-content::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.2);
  }
  
  [data-theme="dark"] .status-log-content::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  

  StatusLog.tsx:
  // ============================================
// StatusLog - Log-Anzeige mit neueste oben
// ============================================

import React from 'react';
import { LogEntry } from '../../types/dashboard.types';
import './StatusLog.css';

interface StatusLogProps {
  logs: LogEntry[];
  maxVisible?: number;
  onClear?: () => void;
}

const StatusLog: React.FC<StatusLogProps> = ({
  logs,
  maxVisible = 5,
  onClear,
}) => {
  // Logs sind bereits nach Datum sortiert (neueste zuerst)
  const visibleLogs = logs.slice(0, maxVisible);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getTypeIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
    }
  };

  return (
    <div className="status-log">
      <div className="status-log-header">
        <span className="status-log-title">📋 Status Log</span>
        <div className="status-log-actions">
          <span className="status-log-count">
            {logs.length} Einträge
          </span>
          {onClear && (
            <button className="status-log-clear" onClick={onClear}>
              Löschen
            </button>
          )}
        </div>
      </div>

      <div className="status-log-content">
        {visibleLogs.length === 0 ? (
          <div className="status-log-empty">
            Keine Log-Einträge vorhanden
          </div>
        ) : (
          visibleLogs.map((log, index) => (
            <div
              key={log.id}
              className={`status-log-entry ${log.type}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="status-log-icon">{getTypeIcon(log.type)}</span>
              <span className="status-log-time">{formatTime(log.timestamp)}</span>
              <span className="status-log-message">{log.message}</span>
            </div>
          ))
        )}
      </div>

      {logs.length > maxVisible && (
        <div className="status-log-more">
          +{logs.length - maxVisible} weitere Einträge
        </div>
      )}
    </div>
  );
};

export default StatusLog;

index.ts:
export { default as StatusLog } from './StatusLog';



Menu/BottomMenu.tsx:
// ============================================
// BottomMenu - Ausklappbares Menü unten
// ============================================

import React from 'react';
import { MenuPanel, MenuItem } from '../../types/dashboard.types';
import GearSelectionPanel from './GearSelectionPanel';
import ProgramPanel from './ProgramPanel';
import SensorPanel from './SensorPanel';
import './menu.css';

interface BottomMenuProps {
  activePanel: MenuPanel;
  onPanelChange: (panel: MenuPanel) => void;
  onEmergencyStop: () => void;
  // Gear Panel Props
  selectedGear: string;
  onGearSelect: (gear: string) => void;
  manualRPM: number;
  onRPMChange: (rpm: number) => void;
  isAutoRunning: boolean;
  onAutoRunToggle: () => void;
  autoSpeed: 'slow' | 'normal' | 'fast';
  onAutoSpeedChange: (speed: 'slow' | 'normal' | 'fast') => void;
  // Sensor Data
  sensorData: { name: string; value: number; unit: string; status: 'normal' | 'warning' | 'danger' }[];
  // Mock Mode
  mockMode: 'random' | 'realistic';
  onMockModeChange: (mode: 'random' | 'realistic') => void;
}

const menuItems: MenuItem[] = [
  { id: 'gear', label: 'Gang', icon: '⚙️', subtitle: 'Gangauswahl' },
  { id: 'program', label: 'Programm', icon: '▶️', subtitle: 'Testprogramme' },
  { id: 'sensors', label: 'Sensoren', icon: '📊', subtitle: 'Live-Daten' },
  { id: 'regelung', label: 'Regelung', icon: '🎛️', subtitle: 'PID' },
  { id: 'config', label: 'Config', icon: '⚡', subtitle: 'Einstellungen' },
  { id: 'dsg', label: 'DSG', icon: '🔀', subtitle: 'Kupplung' },
];

const BottomMenu: React.FC<BottomMenuProps> = ({
  activePanel,
  onPanelChange,
  onEmergencyStop,
  selectedGear,
  onGearSelect,
  manualRPM,
  onRPMChange,
  isAutoRunning,
  onAutoRunToggle,
  autoSpeed,
  onAutoSpeedChange,
  sensorData,
  mockMode,
  onMockModeChange,
}) => {
  const handlePanelToggle = (panel: MenuPanel) => {
    if (activePanel === panel) {
      onPanelChange('none');
    } else {
      onPanelChange(panel);
    }
  };

  const getPanelTitle = () => {
    switch (activePanel) {
      case 'gear': return '⚙️ Gangauswahl & Drehzahlsteuerung';
      case 'program': return '▶️ Testprogramme';
      case 'sensors': return '📊 Sensorwerte';
      case 'regelung': return '🎛️ Regelungslauf';
      case 'config': return '⚡ Konfiguration';
      case 'dsg': return '🔀 DSG Anzeige';
      default: return '';
    }
  };

  const renderPanelContent = () => {
    switch (activePanel) {
      case 'gear':
        return (
          <GearSelectionPanel
            selectedGear={selectedGear}
            onGearSelect={onGearSelect}
            manualRPM={manualRPM}
            onRPMChange={onRPMChange}
            isAutoRunning={isAutoRunning}
            onAutoRunToggle={onAutoRunToggle}
            autoSpeed={autoSpeed}
            onAutoSpeedChange={onAutoSpeedChange}
          />
        );
      case 'program':
        return <ProgramPanel />;
      case 'sensors':
        return <SensorPanel sensors={sensorData} />;
      case 'config':
        return (
          <div className="config-section">
            <div className="config-section-title">Mock-Modus</div>
            <div className="mode-toggle">
              <button
                className={`mode-toggle-btn ${mockMode === 'random' ? 'active' : ''}`}
                onClick={() => onMockModeChange('random')}
              >
                Zufällig
              </button>
              <button
                className={`mode-toggle-btn ${mockMode === 'realistic' ? 'active' : ''}`}
                onClick={() => onMockModeChange('realistic')}
              >
                Realistisch
              </button>
            </div>
          </div>
        );
      case 'regelung':
      case 'dsg':
        return (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: 'var(--text-dim)',
            fontSize: '12px' 
          }}>
            Funktion wird noch implementiert...
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bottom-menu">
      {/* Expandable Panel */}
      <div className={`bottom-menu-panel ${activePanel !== 'none' ? 'open' : ''}`}>
        {activePanel !== 'none' && (
          <>
            <div className="bottom-menu-panel-header">
              <span className="bottom-menu-panel-title">{getPanelTitle()}</span>
              <button 
                className="bottom-menu-panel-close"
                onClick={() => onPanelChange('none')}
              >
                ✕
              </button>
            </div>
            <div className="bottom-menu-panel-content">
              {renderPanelContent()}
            </div>
          </>
        )}
      </div>

      {/* Menu Bar */}
      <div className="bottom-menu-bar">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`menu-btn ${activePanel === item.id ? 'active' : ''}`}
            onClick={() => handlePanelToggle(item.id)}
          >
            <span className="menu-btn-icon">{item.icon}</span>
            <span className="menu-btn-label">{item.label}</span>
          </button>
        ))}
        
        {/* Emergency Stop Button */}
        <button className="menu-btn emergency" onClick={onEmergencyStop}>
          <span className="menu-btn-icon">🛑</span>
          <span className="menu-btn-label">NOT-AUS</span>
        </button>
      </div>
    </div>
  );
};

export default BottomMenu;



GearSelectionPanel.tsx:
// ============================================
// GearSelectionPanel - Gangauswahl & Drehzahlsteuerung
// ============================================

import React from 'react';
import { GearPosition, GAUGE_CONSTANTS } from '../../types/dashboard.types';
import './menu.css';

interface GearSelectionPanelProps {
  selectedGear: string;
  onGearSelect: (gear: string) => void;
  manualRPM: number;
  onRPMChange: (rpm: number) => void;
  isAutoRunning: boolean;
  onAutoRunToggle: () => void;
  autoSpeed: 'slow' | 'normal' | 'fast';
  onAutoSpeedChange: (speed: 'slow' | 'normal' | 'fast') => void;
}

const gears: { value: GearPosition; label: string }[] = [
  { value: 'R', label: 'Rückwärts' },
  { value: 'N', label: 'Neutral' },
  { value: '1', label: '1. Gang' },
  { value: '2', label: '2. Gang' },
  { value: '3', label: '3. Gang' },
  { value: '4', label: '4. Gang' },
  { value: '5', label: '5. Gang' },
  { value: '6', label: '6. Gang' },
  { value: '7', label: '7. Gang' },
];

const GearSelectionPanel: React.FC<GearSelectionPanelProps> = ({
  selectedGear,
  onGearSelect,
  manualRPM,
  onRPMChange,
  isAutoRunning,
  onAutoRunToggle,
  autoSpeed,
  onAutoSpeedChange,
}) => {
  const rpmPercent = (manualRPM / GAUGE_CONSTANTS.RPM.MAX) * 100;

  return (
    <div className="gear-panel">
      {/* Gang-Auswahl */}
      <div className="gear-panel-section">
        <div className="gear-panel-section-title">Gang auswählen</div>
        <div className="gear-grid">
          {gears.map(({ value, label }) => (
            <button
              key={value}
              className={`gear-btn ${selectedGear === value ? 'active' : ''}`}
              onClick={() => onGearSelect(value)}
              disabled={isAutoRunning}
            >
              <span className="gear-num">{value}</span>
              <span className="gear-label">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Drehzahl-Steuerung */}
      <div className="gear-panel-section">
        <div className="gear-panel-section-title">Manuelle Drehzahl</div>
        <div className="rpm-control">
          <div className="rpm-slider-container">
            <div className="rpm-slider-track">
              <div 
                className="rpm-slider-fill" 
                style={{ width: `${rpmPercent}%` }}
              />
            </div>
            <input
              type="range"
              className="rpm-slider"
              min="0"
              max={GAUGE_CONSTANTS.RPM.MAX}
              step="100"
              value={manualRPM}
              onChange={(e) => onRPMChange(parseInt(e.target.value))}
              disabled={isAutoRunning}
            />
          </div>
          <div className="rpm-value-display">
            <span>0</span>
            <span className="rpm-value">{manualRPM.toLocaleString('de-DE')}</span>
            <span>{GAUGE_CONSTANTS.RPM.MAX.toLocaleString('de-DE')}</span>
          </div>
        </div>

        <div className="gear-panel-section-title" style={{ marginTop: '20px' }}>
          Automatischer Durchlauf
        </div>
        
        {/* Geschwindigkeits-Auswahl */}
        <div className="speed-select">
          {(['slow', 'normal', 'fast'] as const).map((speed) => (
            <button
              key={speed}
              className={`speed-btn ${autoSpeed === speed ? 'active' : ''}`}
              onClick={() => onAutoSpeedChange(speed)}
              disabled={isAutoRunning}
            >
              {speed === 'slow' ? 'Langsam' : speed === 'normal' ? 'Normal' : 'Schnell'}
            </button>
          ))}
        </div>

        {/* Auto-Run Button */}
        <div className="auto-mode-controls">
          <button
            className={`auto-mode-btn ${isAutoRunning ? 'running' : ''}`}
            onClick={onAutoRunToggle}
          >
            {isAutoRunning ? '⏹️ Stoppen' : '🔄 Alle Gänge durchfahren'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GearSelectionPanel;

index.ts:
export { default as BottomMenu } from './BottomMenu';
export { default as GearSelectionPanel } from './GearSelectionPanel';
export { default as ProgramPanel } from './ProgramPanel';
export { default as SensorPanel } from './SensorPanel';


menu.css:
/* ============================================
   Menu Styles
   Light Mode (Default) & Dark Mode Support
   ============================================ */

/* Bottom Menu Container */
.bottom-menu {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    z-index: 100;
    transition: transform 0.4s ease;
  }
  
  /* Menu Panel (expandable content) */
  .bottom-menu-panel {
    background: var(--bg-panel);
    border-top: 1px solid var(--glass-border);
    border-radius: 16px 16px 0 0;
    overflow: hidden;
    max-height: 0;
    transition: max-height 0.4s ease, padding 0.4s ease, background 0.3s ease;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  }
  
  [data-theme="dark"] .bottom-menu-panel {
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
  }
  
  .bottom-menu-panel.open {
    max-height: 400px;
    padding: 20px;
  }
  
  .bottom-menu-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--glass-border);
  }
  
  .bottom-menu-panel-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  
  .bottom-menu-panel-close {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 8px;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s;
  }
  
  .bottom-menu-panel-close:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--text-primary);
  }
  
  [data-theme="dark"] .bottom-menu-panel-close:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  
  .bottom-menu-panel-content {
    animation: panelContentAppear 0.3s ease forwards;
  }
  
  @keyframes panelContentAppear {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Menu Bar */
  .bottom-menu-bar {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: var(--bg-panel);
    border-top: 1px solid var(--glass-border);
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
    transition: background 0.3s ease, border-color 0.3s ease;
  }
  
  [data-theme="dark"] .bottom-menu-bar {
    background: var(--bg-dark);
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
  }
  
  /* Menu Button */
  .menu-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 10px 16px;
    min-width: 70px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .menu-btn:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.12);
  }
  
  .menu-btn.active {
    background: rgba(0, 212, 255, 0.1);
    border-color: var(--color-blue);
  }
  
  .menu-btn.emergency {
    border-color: rgba(255, 59, 92, 0.3);
    background: rgba(255, 59, 92, 0.1);
  }
  
  .menu-btn.emergency:hover {
    background: rgba(255, 59, 92, 0.2);
    border-color: rgba(255, 59, 92, 0.5);
  }
  
  .menu-btn-icon {
    font-size: 20px;
  }
  
  .menu-btn-label {
    font-size: 9px;
    font-weight: 500;
    color: var(--text-dim);
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  
  .menu-btn.active .menu-btn-label {
    color: var(--color-blue);
  }
  
  .menu-btn.emergency .menu-btn-icon,
  .menu-btn.emergency .menu-btn-label {
    color: var(--color-red);
  }
  
  /* Gear Selection Panel */
  .gear-panel {
    display: flex;
    gap: 24px;
  }
  
  .gear-panel-section {
    flex: 1;
  }
  
  .gear-panel-section-title {
    font-size: 10px;
    font-weight: 500;
    color: var(--text-dim);
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 12px;
  }
  
  /* Gear Grid */
  .gear-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
  }
  
  .gear-btn {
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.05);
    border: 2px solid var(--glass-border);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  [data-theme="dark"] .gear-btn {
    background: rgba(0, 0, 0, 0.3);
  }
  
  .gear-btn:hover {
    border-color: var(--color-blue);
    background: rgba(0, 149, 255, 0.1);
  }
  
  [data-theme="dark"] .gear-btn:hover {
    background: rgba(0, 212, 255, 0.1);
  }
  
  .gear-btn.active {
    border-color: var(--color-green);
    background: rgba(0, 200, 83, 0.12);
  }
  
  [data-theme="dark"] .gear-btn.active {
    background: rgba(0, 230, 118, 0.15);
  }
  
  .gear-btn .gear-num {
    font-size: 24px;
    font-weight: 300;
    color: var(--text-primary);
  }
  
  .gear-btn.active .gear-num {
    color: var(--color-green);
  }
  
  .gear-btn .gear-label {
    font-size: 8px;
    color: var(--text-dim);
    margin-top: 2px;
  }
  
  /* RPM Control */
  .rpm-control {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .rpm-slider-container {
    position: relative;
  }
  
  .rpm-slider-track {
    position: absolute;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
  }
  
  .rpm-slider-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-cyan), var(--color-blue));
    border-radius: 3px;
    transition: width 0.1s;
  }
  
  .rpm-slider {
    -webkit-appearance: none;
    width: 100%;
    height: 24px;
    background: transparent;
    cursor: pointer;
    position: relative;
    z-index: 2;
  }
  
  .rpm-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    background: var(--text-primary);
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    transition: transform 0.2s;
  }
  
  .rpm-slider::-webkit-slider-thumb:hover {
    transform: scale(1.15);
  }
  
  .rpm-value-display {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    color: var(--text-dim);
  }
  
  .rpm-value {
    font-size: 24px;
    font-weight: 200;
    color: var(--color-blue);
  }
  
  /* Auto Mode Controls */
  .auto-mode-controls {
    display: flex;
    gap: 12px;
    margin-top: 12px;
  }
  
  .auto-mode-btn {
    flex: 1;
    padding: 12px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 8px;
    color: var(--text-secondary);
    font-family: 'Outfit', sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 1px;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .auto-mode-btn:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.12);
  }
  
  .auto-mode-btn.active {
    background: rgba(0, 230, 118, 0.1);
    border-color: var(--color-green);
    color: var(--color-green);
  }
  
  .auto-mode-btn.running {
    background: rgba(255, 152, 0, 0.1);
    border-color: var(--color-orange);
    color: var(--color-orange);
    animation: pulse-border 1s ease-in-out infinite;
  }
  
  @keyframes pulse-border {
    0%, 100% { border-color: var(--color-orange); }
    50% { border-color: rgba(255, 152, 0, 0.3); }
  }
  
  /* Speed Select */
  .speed-select {
    display: flex;
    gap: 8px;
  }
  
  .speed-btn {
    flex: 1;
    padding: 8px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 6px;
    color: var(--text-dim);
    font-family: 'Outfit', sans-serif;
    font-size: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .speed-btn:hover {
    background: rgba(255, 255, 255, 0.06);
  }
  
  .speed-btn.active {
    border-color: var(--color-cyan);
    color: var(--color-cyan);
    background: rgba(0, 188, 212, 0.1);
  }
  
  /* Program Panel */
  .program-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .program-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--glass-border);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .program-item:hover {
    border-color: rgba(255, 255, 255, 0.12);
    background: rgba(0, 0, 0, 0.3);
  }
  
  .program-item.running {
    border-color: var(--color-green);
    background: rgba(0, 230, 118, 0.1);
  }
  
  .program-icon {
    font-size: 24px;
  }
  
  .program-info {
    flex: 1;
  }
  
  .program-name {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 4px;
  }
  
  .program-desc {
    font-size: 10px;
    color: var(--text-dim);
  }
  
  .program-status {
    font-size: 9px;
    padding: 4px 10px;
    border-radius: 4px;
    background: var(--glass-bg);
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  .program-item.running .program-status {
    background: rgba(0, 230, 118, 0.2);
    color: var(--color-green);
  }
  
  /* Sensor Panel */
  .sensor-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  
  .sensor-card {
    padding: 16px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--glass-border);
    border-radius: 10px;
    text-align: center;
  }
  
  .sensor-name {
    font-size: 10px;
    color: var(--text-dim);
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  
  .sensor-value {
    font-size: 28px;
    font-weight: 200;
    color: var(--text-primary);
  }
  
  .sensor-unit {
    font-size: 10px;
    color: var(--text-dim);
    margin-top: 4px;
  }
  
  .sensor-card.warning {
    border-color: rgba(255, 152, 0, 0.3);
  }
  
  .sensor-card.warning .sensor-value {
    color: var(--color-orange);
  }
  
  .sensor-card.danger {
    border-color: rgba(255, 59, 92, 0.3);
  }
  
  .sensor-card.danger .sensor-value {
    color: var(--color-red);
  }
  
  /* Config Panel */
  .config-section {
    margin-bottom: 20px;
  }
  
  .config-section:last-child {
    margin-bottom: 0;
  }
  
  .config-section-title {
    font-size: 11px;
    font-weight: 500;
    color: var(--text-secondary);
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 12px;
  }
  
  .config-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid var(--glass-border);
  }
  
  .config-row:last-child {
    border-bottom: none;
  }
  
  .config-label {
    font-size: 12px;
    color: var(--text-secondary);
  }
  
  .config-value {
    font-size: 12px;
    color: var(--text-primary);
    font-weight: 500;
  }
  
  /* Mode Toggle */
  .mode-toggle {
    display: flex;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 8px;
    overflow: hidden;
  }
  
  .mode-toggle-btn {
    flex: 1;
    padding: 8px 16px;
    background: transparent;
    border: none;
    color: var(--text-dim);
    font-family: 'Outfit', sans-serif;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 1px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .mode-toggle-btn:hover {
    color: var(--text-secondary);
  }
  
  .mode-toggle-btn.active {
    background: rgba(0, 212, 255, 0.15);
    color: var(--color-blue);
  }
  
  ProgramPanel.tsx:
  // ============================================
// ProgramPanel - Testprogramme
// ============================================

import React, { useState } from 'react';
import { TestProgram } from '../../types/dashboard.types';
import './menu.css';

const defaultPrograms: TestProgram[] = [
  { 
    id: 'autotest', 
    name: 'Automatischer Testlauf', 
    icon: '🔄', 
    status: 'ready',
    description: 'Vollständiger automatischer Testdurchlauf'
  },
  { 
    id: 'warmup', 
    name: 'Aufwärmprogramm', 
    icon: '🔥', 
    status: 'ready',
    description: 'Schonendes Aufwärmen aller Komponenten'
  },
  { 
    id: 'stress', 
    name: 'Belastungstest', 
    icon: '⚡', 
    status: 'ready',
    description: 'Maximale Belastung über Zeit'
  },
  { 
    id: 'calibrate', 
    name: 'Kalibrierung', 
    icon: '📐', 
    status: 'ready',
    description: 'Sensoren und Aktoren kalibrieren'
  },
  { 
    id: 'endurance', 
    name: 'Dauertest', 
    icon: '⏱️', 
    status: 'ready',
    description: 'Langzeittest über mehrere Stunden'
  },
  { 
    id: 'quick', 
    name: 'Schnelltest', 
    icon: '🚀', 
    status: 'ready',
    description: 'Schnelle Funktionsprüfung'
  },
];

const ProgramPanel: React.FC = () => {
  const [programs, setPrograms] = useState<TestProgram[]>(defaultPrograms);
  const [runningProgram, setRunningProgram] = useState<string | null>(null);

  const handleProgramClick = (programId: string) => {
    if (runningProgram === programId) {
      // Stop program
      setRunningProgram(null);
      setPrograms(prev => 
        prev.map(p => p.id === programId ? { ...p, status: 'ready' } : p)
      );
    } else if (!runningProgram) {
      // Start program
      setRunningProgram(programId);
      setPrograms(prev => 
        prev.map(p => p.id === programId ? { ...p, status: 'running' } : p)
      );
    }
  };

  const getStatusText = (status: TestProgram['status']) => {
    switch (status) {
      case 'ready': return 'Bereit';
      case 'running': return 'Läuft...';
      case 'paused': return 'Pausiert';
      case 'completed': return 'Fertig';
      case 'error': return 'Fehler';
    }
  };

  return (
    <div className="program-list">
      {programs.map((program) => (
        <div
          key={program.id}
          className={`program-item ${program.status === 'running' ? 'running' : ''}`}
          onClick={() => handleProgramClick(program.id)}
        >
          <span className="program-icon">{program.icon}</span>
          <div className="program-info">
            <div className="program-name">{program.name}</div>
            <div className="program-desc">{program.description}</div>
          </div>
          <span className="program-status">{getStatusText(program.status)}</span>
        </div>
      ))}
    </div>
  );
};

export default ProgramPanel;



SensorPanel.tsx:
// ============================================
// SensorPanel - Sensorwerte-Anzeige
// ============================================

import React from 'react';
import './menu.css';

interface Sensor {
  name: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'danger';
}

interface SensorPanelProps {
  sensors: Sensor[];
}

const SensorPanel: React.FC<SensorPanelProps> = ({ sensors }) => {
  return (
    <div className="sensor-grid">
      {sensors.map((sensor, index) => (
        <div
          key={index}
          className={`sensor-card ${sensor.status}`}
        >
          <div className="sensor-name">{sensor.name}</div>
          <div className="sensor-value">
            {typeof sensor.value === 'number' 
              ? sensor.value.toFixed(1) 
              : sensor.value}
          </div>
          <div className="sensor-unit">{sensor.unit}</div>
        </div>
      ))}
    </div>
  );
};

export default SensorPanel;




types/dashboard.types.ts:
// ============================================
// Dashboard Types für Prüfstand HMI
// ============================================

// Gauge Types
export type GaugeSize = 'small' | 'medium' | 'large';
export type GaugeStatus = 'normal' | 'warning' | 'danger';

export interface GaugeProps {
  value: number;
  maxValue: number;
  minValue?: number;
  warningThreshold?: number;
  dangerThreshold?: number;
  unit: string;
  label: string;
  size: GaugeSize;
  accentColor: string;
  warningColor?: string;
  dangerColor?: string;
  id?: string;
}

export interface GaugeState {
  currentValue: number;
  status: GaugeStatus;
  isAnimating: boolean;
}

// RPM Gauge spezifisch
export interface RPMGaugeProps extends Omit<GaugeProps, 'maxValue' | 'unit'> {
  redlineRPM?: number;
  gear?: GearPosition;
}

// Öldruck Gauge
export interface OilPressureGaugeProps extends Omit<GaugeProps, 'maxValue' | 'unit'> {
  sensorId: number; // 1-4
}

// Bremsmotor Gauge
export interface BrakeMotorGaugeProps extends Omit<GaugeProps, 'maxValue' | 'unit'> {
  motorId: 1 | 2;
  rpm?: number;
}

// Platzhalter Gauge
export interface PlaceholderGaugeProps {
  label: string;
  size: GaugeSize;
  id?: string;
}

// ============================================
// Gear / Gang Types
// ============================================

export type GearPosition = 'R' | 'N' | '1' | '2' | '3' | '4' | '5' | '6' | '7';

export interface GearPanelState {
  selectedGear: GearPosition;
  manualRPM: number;
  autoMode: boolean;
  autoModeSpeed: 'slow' | 'normal' | 'fast';
  isRunning: boolean;
}

export interface GearCommand {
  gear: GearPosition;
  targetRPM?: number;
}

// ============================================
// Status Log Types
// ============================================

export type LogType = 'info' | 'success' | 'warning' | 'error';

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: LogType;
  message: string;
}

// ============================================
// Menu Types
// ============================================

export type MenuPanel = 
  | 'none' 
  | 'gear' 
  | 'program' 
  | 'sensors' 
  | 'regelung' 
  | 'config' 
  | 'dsg';

export interface MenuItem {
  id: MenuPanel;
  label: string;
  icon: string;
  subtitle?: string;
}

// ============================================
// Program Types
// ============================================

export type ProgramStatus = 'ready' | 'running' | 'paused' | 'completed' | 'error';

export interface TestProgram {
  id: string;
  name: string;
  icon: string;
  status: ProgramStatus;
  progress?: number;
  description?: string;
}

// ============================================
// Sensor Types
// ============================================

export interface SensorReading {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: GaugeStatus;
  timestamp: Date;
}

export interface SensorConfig {
  id: string;
  name: string;
  minValue: number;
  maxValue: number;
  warningThreshold: number;
  dangerThreshold: number;
  unit: string;
}

// ============================================
// Dashboard State
// ============================================

export interface DashboardData {
  rpm: number;
  gear: GearPosition;
  oilPressures: number[]; // 4 Werte für 4 Sensoren
  brakeMotors: {
    motor1: { torque: number; kw: number; load: number };
    motor2: { torque: number; kw: number; load: number };
  };
  temperature: number;
  runtime: number; // Sekunden
  cycles: number;
  isConnected: boolean;
}

export interface DashboardState {
  data: DashboardData;
  activePanel: MenuPanel;
  isCompactMode: boolean;
  logs: LogEntry[];
  mockMode: 'random' | 'realistic';
  isEmergencyStop: boolean;
}

// ============================================
// Mock Data Types
// ============================================

export type MockDataMode = 'random' | 'realistic';

export interface MockDataConfig {
  mode: MockDataMode;
  updateInterval: number; // ms
  realisticCyclePhase?: 'idle' | 'warmup' | 'running' | 'stress' | 'cooldown';
}

// ============================================
// Tauri Command Types (für Rust Backend)
// ============================================

export interface TauriSensorData {
  rpm: number;
  gear: string;
  oil_pressures: number[];
  motor1_torque: number;
  motor2_torque: number;
  temperature: number;
  is_connected: boolean;
}

export interface TauriCommandResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// Event Types
// ============================================

export interface GaugeUpdateEvent {
  gaugeId: string;
  value: number;
  timestamp: number;
}

export interface SystemEvent {
  type: 'connection' | 'error' | 'warning' | 'status';
  message: string;
  timestamp: Date;
  data?: unknown;
}

// ============================================
// Constants
// ============================================

export const GAUGE_CONSTANTS = {
  RPM: {
    MAX: 12000,
    REDLINE: 8000,
    IDLE: 800,
  },
  OIL_PRESSURE: {
    MAX: 20,
    WARNING: 12,
    DANGER: 15,
  },
  BRAKE_MOTOR: {
    MAX_TORQUE: 1500,
    WARNING_PERCENT: 70,
    DANGER_PERCENT: 85,
    MOTOR_RPM: 1450,
  },
} as const;

export const COLORS = {
  // Accent Colors
  CYAN: '#00bcd4',
  BLUE: '#00d4ff',
  GREEN: '#00e676',
  PURPLE: '#ab47bc',
  ORANGE: '#ff9800',
  RED: '#ff3b5c',
  AMBER: '#ffab00',
  YELLOW: '#ffeb3b',
  
  // Background Colors
  BG_DARK: '#0a0a0f',
  BG_PANEL: '#0d0d14',
  GLASS_BG: 'rgba(255, 255, 255, 0.03)',
  GLASS_BORDER: 'rgba(255, 255, 255, 0.08)',
  
  // Text Colors
  TEXT_PRIMARY: '#ffffff',
  TEXT_SECONDARY: 'rgba(255, 255, 255, 0.5)',
  TEXT_DIM: 'rgba(255, 255, 255, 0.25)',
} as const;







