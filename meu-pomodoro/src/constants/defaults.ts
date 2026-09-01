import { Settings } from '../types';

export const DEFAULT_SETTINGS: Settings = {
  focusDurationMin: 25,
  shortBreakDurationMin: 5,
  longBreakDurationMin: 15,
  pomodorosPerCycle: 4,
  autoStart: false,
  soundEnabled: true,
  vibrationEnabled: true,
  keepScreenAwake: false,
};

export const SETTINGS_RANGES = {
  focusDurationMin: { min: 1, max: 120 },
  shortBreakDurationMin: { min: 1, max: 60 },
  longBreakDurationMin: { min: 1, max: 60 },
  pomodorosPerCycle: { min: 1, max: 10 },
} as const;

export const TICK_INTERVAL_MS = 250;
