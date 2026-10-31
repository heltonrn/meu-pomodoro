import { create } from "zustand";

import { DEFAULT_SETTINGS } from "../constants/defaults";
import { getDatabase } from "../database/database";
import { getSettings, resetSettings, updateSettings } from "../database/repositories";
import { enqueuePersistence } from "../services/PersistenceQueue";
import { getCurrentTimestamp } from "../services/DateService";
import type { SettingsRecord, SettingsUpdate, SettingsValues } from "../types/Settings";

export type StoreStatus = "idle" | "loading" | "ready" | "error";

interface SettingsState {
  settings: SettingsValues;
  status: StoreStatus;
  error: string | null;
  hydrate: () => Promise<void>;
  updateSettings: (update: SettingsUpdate) => void;
  resetToDefaults: () => void;
  clearError: () => void;
}

function toValues(record: SettingsRecord): SettingsValues {
  return {
    focusDurationMin: record.focusDurationMin,
    shortBreakDurationMin: record.shortBreakDurationMin,
    longBreakDurationMin: record.longBreakDurationMin,
    pomodorosPerCycle: record.pomodorosPerCycle,
    autoStart: record.autoStart,
    soundEnabled: record.soundEnabled,
    vibrationEnabled: record.vibrationEnabled,
    keepScreenAwake: record.keepScreenAwake,
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
}

/**
 * Configurações persistidas no SQLite (Regra 8). A memória é atualizada de
 * imediato (os steppers respondem sem esperar o banco) e a gravação entra
 * numa fila serial; se falhar, o estado volta ao que está salvo.
 */
export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  status: "idle",
  error: null,

  hydrate: async () => {
    set({ status: "loading", error: null });

    try {
      const database = await getDatabase();
      const record = await getSettings(database);
      set({ settings: toValues(record), status: "ready", error: null });
    } catch (error: unknown) {
      // Sem banco o app continua com os padrões em memória.
      set({ status: "error", error: getErrorMessage(error) });
    }
  },

  updateSettings: (update) => {
    const previous = get().settings;
    set({ settings: { ...previous, ...update }, error: null });

    void enqueuePersistence(
      async () => {
        const database = await getDatabase();
        await updateSettings(database, update, getCurrentTimestamp());
      },
      (error) => {
        set({ settings: previous, error: getErrorMessage(error) });
      },
    );
  },

  resetToDefaults: () => {
    const previous = get().settings;
    set({ settings: DEFAULT_SETTINGS, error: null });

    void enqueuePersistence(
      async () => {
        const database = await getDatabase();
        await resetSettings(database, getCurrentTimestamp());
      },
      (error) => {
        set({ settings: previous, error: getErrorMessage(error) });
      },
    );
  },

  clearError: () => set({ error: null }),
}));
