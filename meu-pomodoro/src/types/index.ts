export enum TimerStatus {
  Idle = 'IDLE',
  Running = 'RUNNING',
  Paused = 'PAUSED',
  Finished = 'FINISHED',
}

export enum SessionType {
  Focus = 'FOCUS',
  ShortBreak = 'SHORT_BREAK',
  LongBreak = 'LONG_BREAK',
}

export interface Settings {
  focusDurationMin: number;
  shortBreakDurationMin: number;
  longBreakDurationMin: number;
  pomodorosPerCycle: number;
  autoStart: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  keepScreenAwake: boolean;
}

export interface SessionSnapshot {
  type: SessionType;
  task: string;
  durationMs: number;
}
