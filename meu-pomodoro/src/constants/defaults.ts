import type { SettingsValues } from "../types/Settings";

export const DEFAULT_FOCUS_DURATION_MIN = 25;
export const DEFAULT_SHORT_BREAK_DURATION_MIN = 5;
export const DEFAULT_LONG_BREAK_DURATION_MIN = 15;
export const DEFAULT_POMODOROS_PER_CYCLE = 4;

export const SETTINGS_RANGES = {
  focusDurationMin: { min: 1, max: 120 },
  shortBreakDurationMin: { min: 1, max: 60 },
  longBreakDurationMin: { min: 1, max: 60 },
  pomodorosPerCycle: { min: 1, max: 10 },
} as const;

/** Intervalo de releitura do relógio; o tempo NUNCA é decrementado (req. 10). */
export const TICK_INTERVAL_MS = 250;

/**
 * Início automático com o app fechado: quantas sessões (a atual incluída) são
 * agendadas e recuperadas. Cerca de um ciclo completo; depois disso o
 * cronômetro espera o usuário, para não gravar horas de foco que não houve.
 */
export const MAX_AUTO_CHAIN_SESSIONS = 8;

/** Janela em que o fim de uma sessão ainda é "agora" (vibra, toca, inicia a próxima). */
export const FRESH_FINISH_MS = 5000;

export const DEFAULT_SETTINGS: SettingsValues = {
  focusDurationMin: DEFAULT_FOCUS_DURATION_MIN,
  shortBreakDurationMin: DEFAULT_SHORT_BREAK_DURATION_MIN,
  longBreakDurationMin: DEFAULT_LONG_BREAK_DURATION_MIN,
  pomodorosPerCycle: DEFAULT_POMODOROS_PER_CYCLE,
  autoStart: false,
  soundEnabled: true,
  vibrationEnabled: true,
  keepScreenAwake: false,
};
