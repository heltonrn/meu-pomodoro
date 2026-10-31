export interface SettingsRecord {
  id: 1;
  focusDurationMin: number;
  shortBreakDurationMin: number;
  longBreakDurationMin: number;
  pomodorosPerCycle: number;
  autoStart: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  keepScreenAwake: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SettingsUpdate = Partial<
  Omit<SettingsRecord, "id" | "createdAt" | "updatedAt">
>;

/** Valores de configuração usados pelo app (sem metadados de persistência). */
export type SettingsValues = Omit<SettingsRecord, "id" | "createdAt" | "updatedAt">;
