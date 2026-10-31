import type { SessionType } from "./index";

export interface SessionRecord {
  id: number;
  type: SessionType;
  task: string;
  startedAt: number;
  finishedAt: number;
  duration: number;
  completed: boolean;
}

export type NewSessionRecord = Omit<SessionRecord, "id">;

export interface FocusStats {
  completedPomodoros: number;
  focusTimeMs: number;
}
