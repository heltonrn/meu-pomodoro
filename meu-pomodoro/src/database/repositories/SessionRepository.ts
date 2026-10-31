import type { SQLiteDatabase } from "expo-sqlite";

import { SessionType } from "../../types";
import type { FocusStats, NewSessionRecord, SessionRecord } from "../../types/Session";
import { assertNonNegativeInteger } from "../validation";

interface SessionRow {
  id: number;
  type: string;
  task: string;
  started_at: number;
  finished_at: number;
  duration_ms: number;
  completed: number;
}

export function toSessionType(value: string): SessionType {
  switch (value) {
    case SessionType.ShortBreak:
      return SessionType.ShortBreak;
    case SessionType.LongBreak:
      return SessionType.LongBreak;
    default:
      return SessionType.Focus;
  }
}

function mapRow(row: SessionRow): SessionRecord {
  return {
    id: row.id,
    type: toSessionType(row.type),
    task: row.task,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    duration: row.duration_ms,
    completed: row.completed === 1,
  };
}

export async function insertSession(
  database: SQLiteDatabase,
  record: NewSessionRecord,
): Promise<void> {
  assertNonNegativeInteger(record.duration, "A duração da sessão");

  await database.runAsync(
    `INSERT INTO sessions (type, task, started_at, finished_at, duration_ms, completed)
     VALUES (?, ?, ?, ?, ?, ?);`,
    record.type,
    record.task,
    record.startedAt,
    record.finishedAt,
    Math.round(record.duration),
    record.completed ? 1 : 0,
  );
}

export async function listSessionsBetween(
  database: SQLiteDatabase,
  fromMs: number,
  toMs: number,
): Promise<SessionRecord[]> {
  const rows = await database.getAllAsync<SessionRow>(
    `SELECT * FROM sessions
     WHERE started_at >= ? AND started_at < ?
     ORDER BY started_at DESC;`,
    fromMs,
    toMs,
  );
  return rows.map(mapRow);
}

export async function focusStatsBetween(
  database: SQLiteDatabase,
  fromMs: number,
  toMs: number,
): Promise<FocusStats> {
  const row = await database.getFirstAsync<{ count: number; total: number | null }>(
    `SELECT COUNT(*) AS count, SUM(duration_ms) AS total
     FROM sessions
     WHERE type = ? AND completed = 1 AND started_at >= ? AND started_at < ?;`,
    SessionType.Focus,
    fromMs,
    toMs,
  );
  return {
    completedPomodoros: row?.count ?? 0,
    focusTimeMs: row?.total ?? 0,
  };
}

export async function clearSessions(database: SQLiteDatabase): Promise<void> {
  await database.runAsync("DELETE FROM sessions;");
}
