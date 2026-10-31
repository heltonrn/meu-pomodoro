import type { SQLiteDatabase } from "expo-sqlite";

export interface DatabaseMigration {
  version: number;
  name: string;
  statements: readonly string[];
}

export const databaseMigrations: readonly DatabaseMigration[] = [
  {
    version: 1,
    name: "create_core_tables",
    statements: [
      `
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
          focus_duration_min INTEGER NOT NULL CHECK (focus_duration_min BETWEEN 1 AND 120),
          short_break_duration_min INTEGER NOT NULL CHECK (short_break_duration_min BETWEEN 1 AND 60),
          long_break_duration_min INTEGER NOT NULL CHECK (long_break_duration_min BETWEEN 1 AND 60),
          pomodoros_per_cycle INTEGER NOT NULL CHECK (pomodoros_per_cycle BETWEEN 1 AND 10),
          auto_start INTEGER NOT NULL DEFAULT 0 CHECK (auto_start IN (0, 1)),
          sound_enabled INTEGER NOT NULL DEFAULT 1 CHECK (sound_enabled IN (0, 1)),
          vibration_enabled INTEGER NOT NULL DEFAULT 1 CHECK (vibration_enabled IN (0, 1)),
          keep_screen_awake INTEGER NOT NULL DEFAULT 0 CHECK (keep_screen_awake IN (0, 1)),
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `,
      `
        INSERT OR IGNORE INTO settings (
          id, focus_duration_min, short_break_duration_min, long_break_duration_min,
          pomodoros_per_cycle, auto_start, sound_enabled, vibration_enabled,
          keep_screen_awake, created_at, updated_at
        )
        VALUES (1, 25, 5, 15, 4, 0, 1, 1, 0, datetime('now'), datetime('now'));
      `,
      `
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL CHECK (type IN ('FOCUS', 'SHORT_BREAK', 'LONG_BREAK')),
          task TEXT NOT NULL DEFAULT '',
          started_at INTEGER NOT NULL,
          finished_at INTEGER NOT NULL,
          duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
          completed INTEGER NOT NULL CHECK (completed IN (0, 1))
        );
      `,
      `
        CREATE TABLE IF NOT EXISTS timer_state (
          id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
          status TEXT NOT NULL,
          session_type TEXT NOT NULL,
          current_pomodoro INTEGER NOT NULL,
          completed_in_cycle INTEGER NOT NULL,
          task TEXT NOT NULL,
          session_duration_ms INTEGER NOT NULL,
          target_ends_at INTEGER,
          remaining_ms INTEGER NOT NULL,
          started_at INTEGER,
          finished_naturally INTEGER NOT NULL CHECK (finished_naturally IN (0, 1)),
          updated_at TEXT NOT NULL
        );
      `,
    ],
  },
  {
    version: 2,
    name: "add_query_indexes",
    statements: [
      `
        CREATE INDEX IF NOT EXISTS idx_sessions_started_at
        ON sessions (started_at);
      `,
      `
        CREATE INDEX IF NOT EXISTS idx_sessions_type_completed_started_at
        ON sessions (type, completed, started_at);
      `,
    ],
  },
  {
    version: 3,
    name: "add_review_state",
    statements: [
      `
        CREATE TABLE IF NOT EXISTS review_state (
          id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
          first_seen_at TEXT NOT NULL,
          completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
          snooze_count INTEGER NOT NULL DEFAULT 0 CHECK (snooze_count >= 0),
          next_prompt_at TEXT
        );
      `,
      `
        INSERT OR IGNORE INTO review_state (id, first_seen_at)
        VALUES (1, COALESCE((SELECT created_at FROM settings WHERE id = 1), datetime('now')));
      `,
    ],
  },
] as const;

export async function runMigrations(database: SQLiteDatabase): Promise<void> {
  await database.execAsync("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedMigrations = await database.getAllAsync<{ version: number }>(
    "SELECT version FROM schema_migrations ORDER BY version ASC;",
  );
  const appliedVersions = new Set(appliedMigrations.map((migration) => migration.version));

  for (const migration of databaseMigrations) {
    if (appliedVersions.has(migration.version)) {
      continue;
    }

    await database.withTransactionAsync(async () => {
      for (const statement of migration.statements) {
        await database.execAsync(statement);
      }

      await database.runAsync(
        "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, datetime('now'));",
        migration.version,
        migration.name,
      );
    });
  }
}
