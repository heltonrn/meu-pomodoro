import { describe, expect, it } from "vitest";

import { databaseMigrations, runMigrations } from "../src/database/migrations";
import {
  clearSessions,
  clearTimerState,
  focusStatsBetween,
  getSettings,
  insertSession,
  listSessionsBetween,
  loadTimerState,
  resetSettings,
  saveTimerState,
  updateSettings,
} from "../src/database/repositories";
import { SessionType, TimerStatus } from "../src/types";
import { createTestDatabase } from "./helpers/sqlite";

const NOW = "2026-10-22T10:00:00.000Z";

async function freshDatabase() {
  const database = createTestDatabase();
  await runMigrations(database);
  return database;
}

describe("migrations", () => {
  it("mantém versões ordenadas e são idempotentes", async () => {
    expect(databaseMigrations.map((migration) => migration.version)).toEqual([1, 2, 3]);

    const database = createTestDatabase();
    await runMigrations(database);
    await runMigrations(database);

    const applied = await database.getAllAsync<{ version: number }>(
      "SELECT version FROM schema_migrations ORDER BY version;",
    );
    expect(applied.map((row) => row.version)).toEqual([1, 2, 3]);
  });

  it("cria as configurações padrão do requisito 5", async () => {
    const settings = await getSettings(await freshDatabase());
    expect(settings).toMatchObject({
      focusDurationMin: 25,
      shortBreakDurationMin: 5,
      longBreakDurationMin: 15,
      pomodorosPerCycle: 4,
      autoStart: false,
      soundEnabled: true,
      vibrationEnabled: true,
      keepScreenAwake: false,
    });
  });
});

describe("SettingsRepository", () => {
  it("persiste alterações parciais (Regra 8) e restaura os padrões", async () => {
    const database = await freshDatabase();

    const updated = await updateSettings(
      database,
      { focusDurationMin: 50, autoStart: true, soundEnabled: false },
      NOW,
    );
    expect(updated.focusDurationMin).toBe(50);
    expect(updated.autoStart).toBe(true);
    expect(updated.soundEnabled).toBe(false);
    expect(updated.shortBreakDurationMin).toBe(5);

    const restored = await resetSettings(database, NOW);
    expect(restored.focusDurationMin).toBe(25);
    expect(restored.autoStart).toBe(false);
    expect(restored.soundEnabled).toBe(true);
  });

  it("rejeita valores fora das faixas do requisito 5", async () => {
    const database = await freshDatabase();

    await expect(updateSettings(database, { focusDurationMin: 0 }, NOW)).rejects.toThrow();
    await expect(updateSettings(database, { focusDurationMin: 121 }, NOW)).rejects.toThrow();
    await expect(updateSettings(database, { shortBreakDurationMin: 61 }, NOW)).rejects.toThrow();
    await expect(updateSettings(database, { pomodorosPerCycle: 11 }, NOW)).rejects.toThrow();
    await expect(updateSettings(database, { pomodorosPerCycle: 2.5 }, NOW)).rejects.toThrow();
  });
});

describe("SessionRepository", () => {
  it("lista por período, soma só focos concluídos e limpa o histórico", async () => {
    const database = await freshDatabase();
    const minute = 60_000;

    await insertSession(database, {
      type: SessionType.Focus, task: "Estudar", startedAt: 1_000, finishedAt: 1_000 + 25 * minute,
      duration: 25 * minute, completed: true,
    });
    await insertSession(database, {
      type: SessionType.Focus, task: "", startedAt: 2_000_000, finishedAt: 2_500_000,
      duration: 10 * minute, completed: false,
    });
    await insertSession(database, {
      type: SessionType.ShortBreak, task: "", startedAt: 3_000_000, finishedAt: 3_300_000,
      duration: 5 * minute, completed: true,
    });

    const sessions = await listSessionsBetween(database, 0, 10_000_000);
    expect(sessions.map((session) => session.startedAt)).toEqual([3_000_000, 2_000_000, 1_000]);
    expect(sessions[2]).toMatchObject({ task: "Estudar", completed: true, type: SessionType.Focus });

    const stats = await focusStatsBetween(database, 0, 10_000_000);
    expect(stats).toEqual({ completedPomodoros: 1, focusTimeMs: 25 * minute });

    expect(await listSessionsBetween(database, 0, 2_000)).toHaveLength(1);

    await clearSessions(database);
    expect(await listSessionsBetween(database, 0, 10_000_000)).toEqual([]);
  });

  it("recusa tipos inválidos pelo CHECK do banco", async () => {
    const database = await freshDatabase();
    await expect(
      database.runAsync(
        "INSERT INTO sessions (type, task, started_at, finished_at, duration_ms, completed) VALUES ('X', '', 1, 2, 1, 1);",
      ),
    ).rejects.toThrow();
  });
});

describe("TimerStateRepository", () => {
  it("salva, sobrescreve e recupera o estado do cronômetro (req. 11)", async () => {
    const database = await freshDatabase();
    expect(await loadTimerState(database)).toBeNull();

    const running = {
      status: TimerStatus.Running,
      sessionType: SessionType.Focus,
      currentPomodoro: 2,
      completedInCycle: 1,
      task: "Preparar aula",
      sessionDurationMs: 1_500_000,
      targetEndsAt: 1_700_000_000_000,
      remainingMs: 900_000,
      startedAt: 1_699_999_000_000,
      finishedNaturally: false,
    };
    await saveTimerState(database, running, NOW);
    expect(await loadTimerState(database)).toEqual(running);

    const paused = { ...running, status: TimerStatus.Paused, targetEndsAt: null, remainingMs: 600_000 };
    await saveTimerState(database, paused, NOW);
    expect(await loadTimerState(database)).toEqual(paused);

    await clearTimerState(database);
    expect(await loadTimerState(database)).toBeNull();
  });
});
