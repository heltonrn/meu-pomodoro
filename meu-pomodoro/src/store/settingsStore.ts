import { create } from 'zustand';
import { DEFAULT_SETTINGS } from '../constants/defaults';
import { loadSettings, saveSettings } from '../services/database/db';
import { Settings } from '../types';

interface SettingsState {
  settings: Settings;
  hydrated: boolean;
  hydrate: () => void;
  updateSettings: (partial: Partial<Settings>) => void;
  resetToDefaults: () => void;
}

/**
 * Fase 4: as configurações são carregadas do SQLite na inicialização e
 * persistidas a cada alteração (Regra 8).
 */
export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  hydrated: false,

  hydrate: () => {
    const stored = loadSettings();
    if (stored !== null) {
      set({ settings: stored, hydrated: true });
    } else {
      saveSettings(DEFAULT_SETTINGS);
      set({ hydrated: true });
    }
  },

  updateSettings: (partial) => {
    const next = { ...get().settings, ...partial };
    saveSettings(next);
    set({ settings: next });
  },

  resetToDefaults: () => {
    saveSettings(DEFAULT_SETTINGS);
    set({ settings: DEFAULT_SETTINGS });
  },
}));
