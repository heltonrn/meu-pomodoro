import * as SQLite from 'expo-sqlite';
import { SessionType, Settings } from '../../types';

export interface SessionRecord {
  id: number;
  type: SessionType;
  task: string;
  startedAt: number;
  finishedAt: number;
  duration: number;
  completed: boolean;
}

export interface NewSessionRecord {
  type: SessionType;
  task: string;
  startedAt: number;
  finishedAt: number;
  duration: number;
  completed: boolean;
}

export interface PersistedTimerState {
  status: string;
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

interface SessionRow {
  id: number;
  type: string;
  task: string;
  startedAt: number;
  finishedAt: number;
  duration: number;
  completed: number;
}

interface SettingsRow {
  focusDurationMin: number;
  shortBreakDurationMin: number;
  longBreakDurationMin: number;
  pomodorosPerCycle: number;
  autoStart: number;
  soundEnabled: number;
  vibrationEnabled: number;
  keepScreenAwake: number;
}

const db = SQLite.openDatabaseSync('meu-pomodoro.db');

export function initDatabase(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      focusDurationMin INTEGER NOT NULL,
      shortBreakDurationMin INTEGER NOT NULL,
      longBreakDurationMin INTEGER NOT NULL,
      pomodorosPerCycle INTEGER NOT NULL,
      autoStart INTEGER NOT NULL,
      soundEnabled INTEGER NOT NULL,
      vibrationEnabled INTEGER NOT NULL,
      keepScreenAwake INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      task TEXT NOT NULL,
      startedAt INTEGER NOT NULL,
      finishedAt INTEGER NOT NULL,
      duration INTEGER NOT NULL,
      completed INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_startedAt ON sessions (startedAt);
    CREATE TABLE IF NOT EXISTS active_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      payload TEXT NOT NULL
    );
  `);
}

// ---------- settings ----------

export function loadSettings(): Settings | null {
  const row = db.getFirstSync<SettingsRow>('SELECT * FROM settings WHERE id = 1');
  if (row === null) {
    return null;
  }
  return {
    focusDurationMin: row.focusDurationMin,
    shortBreakDurationMin: row.shortBreakDurationMin,
    longBreakDurationMin: row.longBreakDurationMin,
    pomodorosPerCycle: row.pomodorosPerCycle,
    autoStart: row.autoStart === 1,
    soundEnabled: row.soundEnabled === 1,
    vibrationEnabled: row.vibrationEnabled === 1,
    keepScreenAwake: row.keepScreenAwake === 1,
  };
}

export function saveSettings(settings: Settings): void {
  db.runSync(
    `INSERT INTO settings (
      id, focusDurationMin, shortBreakDurationMin, longBreakDurationMin,
      pomodorosPerCycle, autoStart, soundEnabled, vibrationEnabled, keepScreenAwake
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (id) DO UPDATE SET
      focusDurationMin = excluded.focusDurationMin,
      shortBreakDurationMin = excluded.shortBreakDurationMin,
      longBreakDurationMin = excluded.longBreakDurationMin,
      pomodorosPerCycle = excluded.pomodorosPerCycle,
      autoStart = excluded.autoStart,
      soundEnabled = excluded.soundEnabled,
      vibrationEnabled = excluded.vibrationEnabled,
      keepScreenAwake = excluded.keepScreenAwake`,
    [
      settings.focusDurationMin,
      settings.shortBreakDurationMin,
      settings.longBreakDurationMin,
      settings.pomodorosPerCycle,
      settings.autoStart ? 1 : 0,
      settings.soundEnabled ? 1 : 0,
      settings.vibrationEnabled ? 1 : 0,
      settings.keepScreenAwake ? 1 : 0,
    ],
  );
}

// ---------- sessions (Fase 5) ----------

function toSessionType(value: string): SessionType {
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
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    duration: row.duration,
    completed: row.completed === 1,
  };
}

export function insertSession(record: NewSessionRecord): void {
  db.runSync(
    `INSERT INTO sessions (type, task, startedAt, finishedAt, duration, completed)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      record.type,
      record.task,
      record.startedAt,
      record.finishedAt,
      record.duration,
      record.completed ? 1 : 0,
    ],
  );
}

export function listSessionsBetween(fromMs: number, toMs: number): SessionRecord[] {
  const rows = db.getAllSync<SessionRow>(
    `SELECT * FROM sessions
     WHERE startedAt >= ? AND startedAt < ?
     ORDER BY startedAt DESC`,
    [fromMs, toMs],
  );
  return rows.map(mapRow);
}

export interface FocusStats {
  completedPomodoros: number;
  focusTimeMs: number;
}

export function focusStatsBetween(fromMs: number, toMs: number): FocusStats {
  const row = db.getFirstSync<{ count: number; total: number | null }>(
    `SELECT COUNT(*) AS count, SUM(duration) AS total
     FROM sessions
     WHERE type = ? AND completed = 1 AND startedAt >= ? AND startedAt < ?`,
    [SessionType.Focus, fromMs, toMs],
  );
  return {
    completedPomodoros: row?.count ?? 0,
    focusTimeMs: row?.total ?? 0,
  };
}

export function clearSessions(): void {
  db.runSync('DELETE FROM sessions');
}

// ---------- estado ativo (Fase 4 — Regras 6 e 7, requisito 11) ----------

export function saveActiveState(state: PersistedTimerState): void {
  db.runSync(
    `INSERT INTO active_state (id, payload) VALUES (1, ?)
     ON CONFLICT (id) DO UPDATE SET payload = excluded.payload`,
    [JSON.stringify(state)],
  );
}

export function loadActiveState(): PersistedTimerState | null {
  const row = db.getFirstSync<{ payload: string }>(
    'SELECT payload FROM active_state WHERE id = 1',
  );
  if (row === null) {
    return null;
  }
  try {
    return JSON.parse(row.payload) as PersistedTimerState;
  } catch {
    return null;
  }
}

export function clearActiveState(): void {
  db.runSync('DELETE FROM active_state');
}
