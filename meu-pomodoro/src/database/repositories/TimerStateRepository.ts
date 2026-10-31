import type { SQLiteDatabase } from "expo-sqlite";

import { TimerStatus } from "../../types";
import type { TimerStateRecord } from "../../types/TimerState";
import { toSessionType } from "./SessionRepository";

interface TimerStateRow {
  status: string;
  session_type: string;
  current_pomodoro: number;
  completed_in_cycle: number;
  task: string;
  session_duration_ms: number;
  target_ends_at: number | null;
  remaining_ms: number;
  started_at: number | null;
  finished_naturally: number;
}

export function toTimerStatus(value: string): TimerStatus {
  switch (value) {
    case TimerStatus.Running:
      return TimerStatus.Running;
    case TimerStatus.Paused:
      return TimerStatus.Paused;
    case TimerStatus.Finished:
      return TimerStatus.Finished;
    default:
      return TimerStatus.Idle;
  }
}

function mapRow(row: TimerStateRow): TimerStateRecord {
  return {
    status: toTimerStatus(row.status),
    sessionType: toSessionType(row.session_type),
    currentPomodoro: Math.max(1, row.current_pomodoro),
    completedInCycle: Math.max(0, row.completed_in_cycle),
    task: row.task,
    sessionDurationMs: row.session_duration_ms,
    targetEndsAt: row.target_ends_at,
    remainingMs: row.remaining_ms,
    startedAt: row.started_at,
    finishedNaturally: row.finished_naturally === 1,
  };
}

export async function saveTimerState(
  database: SQLiteDatabase,
  state: TimerStateRecord,
  timestamp: string,
): Promise<void> {
  await database.runAsync(
    `INSERT INTO timer_state (
       id, status, session_type, current_pomodoro, completed_in_cycle, task,
       session_duration_ms, target_ends_at, remaining_ms, started_at,
       finished_naturally, updated_at
     ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET
       status = excluded.status,
       session_type = excluded.session_type,
       current_pomodoro = excluded.current_pomodoro,
       completed_in_cycle = excluded.completed_in_cycle,
       task = excluded.task,
       session_duration_ms = excluded.session_duration_ms,
       target_ends_at = excluded.target_ends_at,
       remaining_ms = excluded.remaining_ms,
       started_at = excluded.started_at,
       finished_naturally = excluded.finished_naturally,
       updated_at = excluded.updated_at;`,
    state.status,
    state.sessionType,
    state.currentPomodoro,
    state.completedInCycle,
    state.task,
    state.sessionDurationMs,
    state.targetEndsAt,
    state.remainingMs,
    state.startedAt,
    state.finishedNaturally ? 1 : 0,
    timestamp,
  );
}

export async function loadTimerState(
  database: SQLiteDatabase,
): Promise<TimerStateRecord | null> {
  const row = await database.getFirstAsync<TimerStateRow>(
    "SELECT * FROM timer_state WHERE id = 1 LIMIT 1;",
  );
  return row ? mapRow(row) : null;
}

export async function clearTimerState(database: SQLiteDatabase): Promise<void> {
  await database.runAsync("DELETE FROM timer_state;");
}

