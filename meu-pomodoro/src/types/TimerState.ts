import type { SessionType, TimerStatus } from "./index";

/** Estado do cronômetro persistido para recuperação ao reabrir o app (req. 11). */
export interface TimerStateRecord {
  status: TimerStatus;
  sessionType: SessionType;
  currentPomodoro: number;
  completedInCycle: number;
  task: string;
  sessionDurationMs: number;
  targetEndsAt: number | null;
  remainingMs: number;
  startedAt: number | null;
  finishedNaturally: boolean;
}
