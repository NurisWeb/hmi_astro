// ============================================
// useMockData Hook - Live-Daten Updates mit DSG
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { mockDataService } from '../services/MockDataService';
import type { 
  DashboardDataWithDSG, 
  MockDataMode, 
  GearPosition,
  DSGState,
} from '../types/dashboard.types';

interface UseMockDataOptions {
  mode?: MockDataMode;
  updateInterval?: number;
  autoStart?: boolean;
}

interface UseMockDataReturn {
  data: DashboardDataWithDSG;
  dsgState: DSGState;
  isConnected: boolean;
  isRunning: boolean;
  isAutoModeActive: boolean;
  mode: MockDataMode;
  setMode: (mode: MockDataMode) => void;
  setGear: (gear: GearPosition) => void;
  setTargetRPM: (rpm: number) => void;
  setLoad: (load: number) => void;
  startAutoMode: (speed?: 'slow' | 'normal' | 'fast') => void;
  stopAutoMode: () => void;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

const getInitialDSGState = (): DSGState => ({
  activeGear: 'N',
  preselectedGear: '1',
  clutch1: {
    engagement: 0,
    pressure: 0,
    temperature: 25,
    gears: ['1', '3', '5', '7'],
    isActive: false,
  },
  clutch2: {
    engagement: 0,
    pressure: 0,
    temperature: 25,
    gears: ['R', '2', '4', '6'],
    isActive: false,
  },
  shiftPhase: 'idle',
  shiftTimeMs: 0,
  isShifting: false,
  targetRPM: 800,
  load: 0,
});

const initialData: DashboardDataWithDSG = {
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
  dsg: getInitialDSGState(),
};

export function useMockData(options: UseMockDataOptions = {}): UseMockDataReturn {
  const {
    mode: initialMode = 'random',
    updateInterval = 50,
    autoStart = true,
  } = options;

  const [data, setData] = useState<DashboardDataWithDSG>(initialData);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isAutoModeActive, setIsAutoModeActive] = useState(false);
  const [mode, setModeState] = useState<MockDataMode>(initialMode);
  const intervalRef = useRef<number | null>(null);

  const setMode = useCallback((newMode: MockDataMode) => {
    setModeState(newMode);
    mockDataService.setMode(newMode);
  }, []);

  const setGear = useCallback((gear: GearPosition) => {
    mockDataService.setGear(gear);
  }, []);

  const setTargetRPM = useCallback((rpm: number) => {
    mockDataService.setTargetRPM(rpm);
  }, []);

  const setLoad = useCallback((load: number) => {
    mockDataService.setLoad(load);
  }, []);

  const startAutoMode = useCallback((speed: 'slow' | 'normal' | 'fast' = 'normal') => {
    mockDataService.startAutoMode(speed);
    setIsAutoModeActive(true);
  }, []);

  const stopAutoMode = useCallback(() => {
    mockDataService.stopAutoMode();
    setIsAutoModeActive(false);
  }, []);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    mockDataService.reset();
    setData(initialData);
    setIsAutoModeActive(false);
  }, []);

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
      // Sync auto-mode state
      setIsAutoModeActive(mockDataService.isAutoModeActive());
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
    dsgState: data.dsg,
    isConnected: data.isConnected,
    isRunning,
    isAutoModeActive,
    mode,
    setMode,
    setGear,
    setTargetRPM,
    setLoad,
    startAutoMode,
    stopAutoMode,
    start,
    stop,
    reset,
  };
}

export default useMockData;
