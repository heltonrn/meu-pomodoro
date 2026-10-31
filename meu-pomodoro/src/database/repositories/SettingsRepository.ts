import type { SQLiteBindValue, SQLiteDatabase } from "expo-sqlite";

import {
  DEFAULT_FOCUS_DURATION_MIN,
  DEFAULT_LONG_BREAK_DURATION_MIN,
  DEFAULT_POMODOROS_PER_CYCLE,
  DEFAULT_SHORT_BREAK_DURATION_MIN,
  SETTINGS_RANGES,
} from "../../constants/defaults";
import type { SettingsRecord, SettingsUpdate } from "../../types/Settings";
import { assertIntegerInRange } from "../validation";

interface SettingsRow {
  id: 1;
  focus_duration_min: number;
  short_break_duration_min: number;
  long_break_duration_min: number;
  pomodoros_per_cycle: number;
  auto_start: number;
  sound_enabled: number;
  vibration_enabled: number;
  keep_screen_awake: number;
  created_at: string;
  updated_at: string;
}

function mapRow(row: SettingsRow): SettingsRecord {
  return {
    id: row.id,
    focusDurationMin: row.focus_duration_min,
    shortBreakDurationMin: row.short_break_duration_min,
    longBreakDurationMin: row.long_break_duration_min,
    pomodorosPerCycle: row.pomodoros_per_cycle,
    autoStart: row.auto_start === 1,
    soundEnabled: row.sound_enabled === 1,
    vibrationEnabled: row.vibration_enabled === 1,
    keepScreenAwake: row.keep_screen_awake === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getSettings(database: SQLiteDatabase): Promise<SettingsRecord> {
  const row = await database.getFirstAsync<SettingsRow>(
    "SELECT * FROM settings WHERE id = 1 LIMIT 1;",
  );

  if (!row) {
    throw new Error("Configurações do Meu Pomodoro não encontradas.");
  }

  return mapRow(row);
}

export function validateSettingsUpdate(update: SettingsUpdate): void {
  const ranges = SETTINGS_RANGES;

  if (update.focusDurationMin !== undefined) {
    assertIntegerInRange(
      update.focusDurationMin,
      ranges.focusDurationMin.min,
      ranges.focusDurationMin.max,
      "A duração do foco",
    );
  }
  if (update.shortBreakDurationMin !== undefined) {
    assertIntegerInRange(
      update.shortBreakDurationMin,
      ranges.shortBreakDurationMin.min,
      ranges.shortBreakDurationMin.max,
      "A duração da pausa curta",
    );
  }
  if (update.longBreakDurationMin !== undefined) {
    assertIntegerInRange(
      update.longBreakDurationMin,
      ranges.longBreakDurationMin.min,
      ranges.longBreakDurationMin.max,
      "A duração da pausa longa",
    );
  }
  if (update.pomodorosPerCycle !== undefined) {
    assertIntegerInRange(
      update.pomodorosPerCycle,
      ranges.pomodorosPerCycle.min,
      ranges.pomodorosPerCycle.max,
      "A quantidade de Pomodoros por ciclo",
    );
  }
}

export async function updateSettings(
  database: SQLiteDatabase,
  update: SettingsUpdate,
  timestamp: string,
): Promise<SettingsRecord> {
  validateSettingsUpdate(update);

  const assignments: string[] = [];
  const values: SQLiteBindValue[] = [];

  const numeric: [keyof SettingsUpdate, string][] = [
    ["focusDurationMin", "focus_duration_min"],
    ["shortBreakDurationMin", "short_break_duration_min"],
    ["longBreakDurationMin", "long_break_duration_min"],
    ["pomodorosPerCycle", "pomodoros_per_cycle"],
  ];
  const flags: [keyof SettingsUpdate, string][] = [
    ["autoStart", "auto_start"],
    ["soundEnabled", "sound_enabled"],
    ["vibrationEnabled", "vibration_enabled"],
    ["keepScreenAwake", "keep_screen_awake"],
  ];

  for (const [key, column] of numeric) {
    const value = update[key];
    if (typeof value === "number") {
      assignments.push(`${column} = ?`);
      values.push(value);
    }
  }
  for (const [key, column] of flags) {
    const value = update[key];
    if (typeof value === "boolean") {
      assignments.push(`${column} = ?`);
      values.push(value ? 1 : 0);
    }
  }

  if (assignments.length === 0) {
    return getSettings(database);
  }

  assignments.push("updated_at = ?");
  values.push(timestamp);

  await database.runAsync(
    `UPDATE settings SET ${assignments.join(", ")} WHERE id = 1;`,
    ...values,
  );

  return getSettings(database);
}

export async function resetSettings(
  database: SQLiteDatabase,
  timestamp: string,
): Promise<SettingsRecord> {
  await database.runAsync(
    `UPDATE settings
     SET focus_duration_min = ?,
         short_break_duration_min = ?,
         long_break_duration_min = ?,
         pomodoros_per_cycle = ?,
         auto_start = 0,
         sound_enabled = 1,
         vibration_enabled = 1,
         keep_screen_awake = 0,
         updated_at = ?
     WHERE id = 1;`,
    DEFAULT_FOCUS_DURATION_MIN,
    DEFAULT_SHORT_BREAK_DURATION_MIN,
    DEFAULT_LONG_BREAK_DURATION_MIN,
    DEFAULT_POMODOROS_PER_CYCLE,
    timestamp,
  );

  return getSettings(database);
}
