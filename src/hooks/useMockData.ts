// ============================================
// useMockData Hook - Live-Daten Updates
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { mockDataService } from '../services/MockDataService';
import type { 
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

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    mockDataService.reset();
    setData(initialData);
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
