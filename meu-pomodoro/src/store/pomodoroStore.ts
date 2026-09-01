import { create } from 'zustand';
import { SessionType, TimerStatus } from '../types';
import { minutesToMs, remainingFromTarget, startOfToday } from '../utils/time';
import { useSettingsStore } from './settingsStore';
import {
  clearActiveState,
  focusStatsBetween,
  insertSession,
  loadActiveState,
  PersistedTimerState,
  saveActiveState,
} from '../services/database/db';
import {
  cancelSessionEndNotification,
  scheduleSessionEndNotification,
} from '../services/notifications/notifications';

interface PomodoroState {
  status: TimerStatus;
  sessionType: SessionType;
  /** Posição do Pomodoro dentro do ciclo (1-based). */
  currentPomodoro: number;
  /** Quantos focos foram CONCLUÍDOS (não pulados) no ciclo atual. */
  completedInCycle: number;
  /** Concluídos hoje, hidratado do SQLite. */
  completedToday: number;
  task: string;
  /** Duração total da sessão atual, para o progresso. */
  sessionDurationMs: number;
  /** Timestamp real de término previsto. Null quando não está rodando. */
  targetEndsAt: number | null;
  /** Tempo restante conhecido (IDLE/PAUSED/FINISHED, e sincronizado no RUNNING). */
  remainingMs: number;
  /** Quando a sessão atual começou de fato (primeiro start). */
  startedAt: number | null;
  /** A última sessão terminou naturalmente? (Regras 3 e 4) */
  finishedNaturally: boolean;
  /** Incrementado quando o histórico muda, para telas reagirem. */
  historyVersion: number;

  hydrate: () => void;
  setTask: (task: string) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  skip: () => void;
  syncFromClock: (now: number) => void;
  startNext: () => void;
  acknowledgeFinish: () => void;
  notifyHistoryCleared: () => void;
}

function durationForType(type: SessionType): number {
  const { settings } = useSettingsStore.getState();
  switch (type) {
    case SessionType.Focus:
      return minutesToMs(settings.focusDurationMin);
    case SessionType.ShortBreak:
      return minutesToMs(settings.shortBreakDurationMin);
    case SessionType.LongBreak:
      return minutesToMs(settings.longBreakDurationMin);
  }
}

interface AdvanceResult {
  sessionType: SessionType;
  currentPomodoro: number;
  completedInCycle: number;
}

/**
 * Regra do ciclo (requisito 7): foco → pausa curta, repetindo até o último
 * foco do ciclo, que leva à pausa longa; após a pausa longa, novo ciclo.
 */
function computeNext(
  state: Pick<PomodoroState, 'sessionType' | 'currentPomodoro' | 'completedInCycle'>,
  focusWasCompleted: boolean,
): AdvanceResult {
  const { pomodorosPerCycle } = useSettingsStore.getState().settings;

  if (state.sessionType === SessionType.Focus) {
    const completedInCycle = focusWasCompleted
      ? state.completedInCycle + 1
      : state.completedInCycle;
    const isLastOfCycle = state.currentPomodoro >= pomodorosPerCycle;
    return {
      sessionType: isLastOfCycle ? SessionType.LongBreak : SessionType.ShortBreak,
      currentPomodoro: state.currentPomodoro,
      completedInCycle,
    };
  }

  if (state.sessionType === SessionType.LongBreak) {
    // Pausa longa encerrada: novo ciclo.
    return { sessionType: SessionType.Focus, currentPomodoro: 1, completedInCycle: 0 };
  }

  // Pausa curta encerrada: próximo foco do mesmo ciclo.
  return {
    sessionType: SessionType.Focus,
    currentPomodoro: state.currentPomodoro + 1,
    completedInCycle: state.completedInCycle,
  };
}

function persist(state: PomodoroState): void {
  const snapshot: PersistedTimerState = {
    status: state.status,
    sessionType: state.sessionType,
    currentPomodoro: state.currentPomodoro,
    completedInCycle: state.completedInCycle,
    task: state.task,
    sessionDurationMs: state.sessionDurationMs,
    targetEndsAt: state.targetEndsAt,
    remainingMs: state.remainingMs,
    startedAt: state.startedAt,
    finishedNaturally: state.finishedNaturally,
  };
  saveActiveState(snapshot);
}

function recordSession(
  state: Pick<
    PomodoroState,
    'sessionType' | 'task' | 'startedAt' | 'sessionDurationMs' | 'remainingMs'
  >,
  completed: boolean,
  finishedAt: number,
): void {
  if (state.startedAt === null) {
    // Sessão nunca chegou a rodar: nada a registrar.
    return;
  }
  const elapsed = completed
    ? state.sessionDurationMs
    : Math.max(0, state.sessionDurationMs - state.remainingMs);
  insertSession({
    type: state.sessionType,
    task: state.sessionType === SessionType.Focus ? state.task : '',
    startedAt: state.startedAt,
    finishedAt,
    duration: elapsed,
    completed,
  });
}

function completedTodayFromDb(): number {
  return focusStatsBetween(startOfToday(), Date.now() + 1).completedPomodoros;
}

function toStatus(value: string): TimerStatus {
  switch (value) {
    case TimerStatus.Running:
      return TimerStatus.Running;
    case TimerStatus.Paused:
      return TimerStatus.Paused;
    case TimerStatus.Finished:
      return TimerStatus.Finished;
    default:
      return TimerStatus.Idle;
  }
}

const INITIAL_DURATION = minutesToMs(25);

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  status: TimerStatus.Idle,
  sessionType: SessionType.Focus,
  currentPomodoro: 1,
  completedInCycle: 0,
  completedToday: 0,
  task: '',
  sessionDurationMs: INITIAL_DURATION,
  targetEndsAt: null,
  remainingMs: INITIAL_DURATION,
  startedAt: null,
  finishedNaturally: false,
  historyVersion: 0,

  /**
   * Fase 4/6 — recuperação do estado (requisito 11, Regra 6): ao abrir o
   * app, restaura a sessão salva; se ela terminou enquanto o app estava
   * fechado, registra a conclusão e mostra a tela de sessão concluída.
   */
  hydrate: () => {
    const saved = loadActiveState();
    const completedToday = completedTodayFromDb();

    if (saved === null) {
      const duration = durationForType(SessionType.Focus);
      set({ completedToday, sessionDurationMs: duration, remainingMs: duration });
      return;
    }

    const status = toStatus(saved.status);
    const base = {
      sessionType: saved.sessionType,
      currentPomodoro: saved.currentPomodoro,
      completedInCycle: saved.completedInCycle,
      task: saved.task,
      sessionDurationMs: saved.sessionDurationMs,
      startedAt: saved.startedAt,
      finishedNaturally: saved.finishedNaturally,
      completedToday,
    };

    if (status === TimerStatus.Running && saved.targetEndsAt !== null) {
      const remaining = remainingFromTarget(saved.targetEndsAt, Date.now());
      if (remaining <= 0) {
        // Terminou em segundo plano (a notificação agendada já disparou).
        recordSession(
          { ...base, remainingMs: 0 },
          true,
          saved.targetEndsAt,
        );
        const next = {
          ...base,
          status: TimerStatus.Finished,
          targetEndsAt: null,
          remainingMs: 0,
          finishedNaturally: true,
          completedToday: completedTodayFromDb(),
          historyVersion: get().historyVersion + 1,
        };
        set(next);
        persist(get());
        return;
      }
      set({ ...base, status, targetEndsAt: saved.targetEndsAt, remainingMs: remaining });
      return;
    }

    set({
      ...base,
      status,
      targetEndsAt: null,
      remainingMs: saved.remainingMs,
    });
  },

  setTask: (task) => {
    set({ task });
    persist(get());
  },

  start: () => {
    const state = get();
    // Regra 1: nunca duas sessões simultâneas — start só sai do IDLE.
    if (state.status !== TimerStatus.Idle) {
      return;
    }
    const duration = durationForType(state.sessionType);
    const now = Date.now();
    const targetEndsAt = now + duration;
    set({
      status: TimerStatus.Running,
      sessionDurationMs: duration,
      remainingMs: duration,
      targetEndsAt,
      startedAt: now,
      finishedNaturally: false,
    });
    persist(get());
    void scheduleSessionEndNotification(state.sessionType, targetEndsAt);
  },

  pause: () => {
    const state = get();
    if (state.status !== TimerStatus.Running || state.targetEndsAt === null) {
      return;
    }
    // Regra 2: pausar não conclui; apenas congela o restante.
    set({
      status: TimerStatus.Paused,
      remainingMs: remainingFromTarget(state.targetEndsAt, Date.now()),
      targetEndsAt: null,
    });
    persist(get());
    void cancelSessionEndNotification();
  },

  resume: () => {
    const state = get();
    if (state.status !== TimerStatus.Paused) {
      return;
    }
    const targetEndsAt = Date.now() + state.remainingMs;
    set({ status: TimerStatus.Running, targetEndsAt });
    persist(get());
    void scheduleSessionEndNotification(state.sessionType, targetEndsAt);
  },

  restart: () => {
    const state = get();
    if (state.status === TimerStatus.Finished) {
      return;
    }
    // Regra 5: reinicia estado e contagem com a duração configurada.
    const duration = durationForType(state.sessionType);
    set({
      status: TimerStatus.Idle,
      sessionDurationMs: duration,
      remainingMs: duration,
      targetEndsAt: null,
      startedAt: null,
    });
    persist(get());
    void cancelSessionEndNotification();
  },

  skip: () => {
    const state = get();
    if (state.status === TimerStatus.Finished) {
      return;
    }
    // Regra 4: pular NÃO conta como concluído, mas fica no histórico.
    const now = Date.now();
    const runningRemaining =
      state.status === TimerStatus.Running && state.targetEndsAt !== null
        ? remainingFromTarget(state.targetEndsAt, now)
        : state.remainingMs;
    recordSession({ ...state, remainingMs: runningRemaining }, false, now);

    const next = computeNext(state, false);
    const duration = durationForType(next.sessionType);
    set({
      ...next,
      status: TimerStatus.Idle,
      sessionDurationMs: duration,
      remainingMs: duration,
      targetEndsAt: null,
      startedAt: null,
      finishedNaturally: false,
      task: next.sessionType === SessionType.Focus ? state.task : '',
      historyVersion: state.startedAt !== null ? state.historyVersion + 1 : state.historyVersion,
    });
    persist(get());
    void cancelSessionEndNotification();
  },

  syncFromClock: (now) => {
    const state = get();
    if (state.status !== TimerStatus.Running || state.targetEndsAt === null) {
      return;
    }
    const remaining = remainingFromTarget(state.targetEndsAt, now);
    if (remaining <= 0) {
      // Regra 3: chegou ao fim naturalmente → sessão concluída e registrada.
      recordSession({ ...state, remainingMs: 0 }, true, state.targetEndsAt);
      set({
        status: TimerStatus.Finished,
        remainingMs: 0,
        targetEndsAt: null,
        finishedNaturally: true,
        completedToday: completedTodayFromDb(),
        historyVersion: state.historyVersion + 1,
      });
      persist(get());
      return;
    }
    set({ remainingMs: remaining });
  },

  startNext: () => {
    const state = get();
    if (state.status !== TimerStatus.Finished) {
      return;
    }
    const next = computeNext(
      state,
      state.finishedNaturally && state.sessionType === SessionType.Focus,
    );
    const duration = durationForType(next.sessionType);
    const now = Date.now();
    const targetEndsAt = now + duration;
    set({
      ...next,
      status: TimerStatus.Running,
      sessionDurationMs: duration,
      remainingMs: duration,
      targetEndsAt,
      startedAt: now,
      finishedNaturally: false,
      task: next.sessionType === SessionType.Focus ? state.task : '',
    });
    persist(get());
    void scheduleSessionEndNotification(next.sessionType, targetEndsAt);
  },

  acknowledgeFinish: () => {
    const state = get();
    if (state.status !== TimerStatus.Finished) {
      return;
    }
    const next = computeNext(
      state,
      state.finishedNaturally && state.sessionType === SessionType.Focus,
    );
    const duration = durationForType(next.sessionType);
    set({
      ...next,
      status: TimerStatus.Idle,
      sessionDurationMs: duration,
      remainingMs: duration,
      targetEndsAt: null,
      startedAt: null,
      finishedNaturally: false,
      task: next.sessionType === SessionType.Focus ? state.task : '',
    });
    persist(get());
  },

  notifyHistoryCleared: () => {
    clearActiveState();
    set((state) => ({
      completedToday: 0,
      historyVersion: state.historyVersion + 1,
    }));
    persist(get());
  },
}));
