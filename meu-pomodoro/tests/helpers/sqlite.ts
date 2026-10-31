import { createRequire } from "node:module";

import type { SQLiteDatabase } from "expo-sqlite";

type SQLInputValue = null | number | bigint | string | Uint8Array;

interface NodeStatement {
  run: (...params: SQLInputValue[]) => { changes: number | bigint; lastInsertRowid: number | bigint };
  get: (...params: SQLInputValue[]) => unknown;
  all: (...params: SQLInputValue[]) => unknown[];
}

interface NodeDatabase {
  exec: (source: string) => void;
  prepare: (source: string) => NodeStatement;
}

// `node:sqlite` é carregado via require porque o Vite não o reconhece como módulo nativo.
const nodeRequire = createRequire(import.meta.url);
const { DatabaseSync } = nodeRequire("node:sqlite") as {
  DatabaseSync: new (path: string) => NodeDatabase;
};

/**
 * Adaptador mínimo da API assíncrona do expo-sqlite sobre o SQLite real do
 * Node. Permite testar migrations, constraints e SQL dos repositories sem
 * dispositivo.
 */
export function createTestDatabase(): SQLiteDatabase {
  const db = new DatabaseSync(":memory:");

  const adapter = {
    execAsync: async (source: string): Promise<void> => {
      db.exec(source);
    },
    runAsync: async (source: string, ...params: SQLInputValue[]) => {
      const result = db.prepare(source).run(...params);
      return {
        changes: Number(result.changes),
        lastInsertRowId: Number(result.lastInsertRowid),
      };
    },
    getFirstAsync: async <T>(source: string, ...params: SQLInputValue[]): Promise<T | null> => {
      const row = db.prepare(source).get(...params);
      return (row as T | undefined) ?? null;
    },
    getAllAsync: async <T>(source: string, ...params: SQLInputValue[]): Promise<T[]> => {
      return db.prepare(source).all(...params) as T[];
    },
    withTransactionAsync: async (task: () => Promise<void>): Promise<void> => {
      db.exec("BEGIN");
      try {
        await task();
        db.exec("COMMIT");
      } catch (error: unknown) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };

  return adapter as unknown as SQLiteDatabase;
}
