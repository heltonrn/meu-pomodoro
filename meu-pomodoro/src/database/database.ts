import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";

import { runMigrations } from "./migrations";

const DATABASE_NAME = "meupomodoro.db";

let databasePromise: Promise<SQLiteDatabase> | null = null;

async function initializeDatabase(): Promise<SQLiteDatabase> {
  const database = await openDatabaseAsync(DATABASE_NAME);
  await runMigrations(database);
  return database;
}

export function getDatabase(): Promise<SQLiteDatabase> {
  databasePromise ??= initializeDatabase().catch((error: unknown) => {
    databasePromise = null;
    throw error;
  });

  return databasePromise;
}

export function resetDatabaseConnection(): void {
  databasePromise = null;
}
