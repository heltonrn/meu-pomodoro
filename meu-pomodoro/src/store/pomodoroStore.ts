import { create } from "zustand";

import { getDatabase } from "../database/database";
import {
  clearSessions,
  focusStatsBetween,
  insertSession,
  loadTimerState,
  saveTimerState,
} from "../database/repositories";
import { FRESH_FINISH_MS, MAX_AUTO_CHAIN_SESSIONS } from "../constants/defaults";
import {
  catchUpChain,
  computeNext,
  projectChain,
  type TimedSession,
} from "../services/CycleService";
import { getCurrentTimestamp } from "../services/DateService";
import {
  cancelSessionEndNotification,
  scheduleSessionEndNotifications,
} from "../services/NotificationService";
import { enqueuePersistence } from "../services/PersistenceQueue";
import { SessionType, TimerStatus } from "../types";
import type { NewSessionRecord } from "../types/Session";
import type { TimerStateRecord } from "../types/TimerState";
import { minutesToMs, remainingFromTarget, startOfToday } from "../utils/time";
import { useSettingsStore, type StoreStatus } from "./settingsStore";

interface PomodoroState {
  status: TimerStatus;
  sessionType: SessionType;
  /** Posição do Pomodoro dentro do ciclo (1-based). */
  currentPomodoro: number;
  /** Quantos focos foram CONCLUÍDOS (não pulados) no ciclo atual. */
  completedInCycle: number;
  /** Concluídos hoje, hidratado do SQLite. */
  completedToday: number;
  /** Tempo de foco concluído hoje (ms), hidratado do SQLite. */
  focusTimeTodayMs: number;
  task: string;
  /** Duração total da sessão atual, para o progresso. */
  sessionDurationMs: number;
  /** Timestamp real de término previsto. Null quando não está rodando. */
  targetEndsAt: number | null;
  /** Tempo restante conhecido (IDLE/PAUSED/FINISHED, e sincronizado no RUNNING). */
  remainingMs: number;
  /** Quando a sessão atual começou de fato (primeiro start). */
  startedAt: number | null;
  /** Quando a última sessão terminou naturalmente (null se não terminou agora). */
  finishedAt: number | null;
  /** A última sessão terminou naturalmente? (Regras 3 e 4) */
  finishedNaturally: boolean;
  /** Incrementado quando o histórico muda, para telas reagirem. */
  historyVersion: number;
  loadStatus: StoreStatus;
  error: string | null;

  hydrate: () => Promise<void>;
  setTask: (task: string) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  skip: () => void;
  syncFromClock: (now: number) => void;
  /** `anchorAt`: início automático da sessão que acabou de terminar (sem perder tempo). */
  startNext: (anchorAt?: number) => void;
  acknowledgeFinish: () => void;
  refreshIdleDuration: () => void;
  /** Reagenda as notificações das sessões futuras (ex.: após mudar as configurações). */
  refreshScheduledChain: () => void;
  clearHistory: () => Promise<void>;
  clearError: () => void;
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

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
}

const INITIAL_DURATION = minutesToMs(25);

export const usePomodoroStore = create<PomodoroState>((set, get) => {
  const reportError = (error: unknown): void => {
    set({ error: getErrorMessage(error) });
  };

  /** Grava o estado atual do cronômetro (fila serial; falhas viram `error`). */
  const persist = (): void => {
    const state = get();
    const snapshot: TimerStateRecord = {
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
    const timestamp = getCurrentTimestamp();

    void enqueuePersistence(async () => {
      const database = await getDatabase();
      await saveTimerState(database, snapshot, timestamp);
    }, reportError);
  };

  /** Registra a sessão no histórico e atualiza estatísticas/versão ao terminar. */
  const recordSession = (record: NewSessionRecord): void => {
    void enqueuePersistence(async () => {
      const database = await getDatabase();
      await insertSession(database, record);
      const today = await focusStatsBetween(database, startOfToday(), Date.now() + 1);
      set((state) => ({
        completedToday: today.completedPomodoros,
        focusTimeTodayMs: today.focusTimeMs,
        historyVersion: state.historyVersion + 1,
      }));
    }, reportError);
  };

  const buildRecord = (
    state: Pick<
      PomodoroState,
      "sessionType" | "task" | "startedAt" | "sessionDurationMs" | "remainingMs"
    >,
    completed: boolean,
    finishedAt: number,
  ): NewSessionRecord | null => {
    if (state.startedAt === null) {
      // Sessão nunca chegou a rodar: nada a registrar.
      return null;
    }
    return {
      type: state.sessionType,
      task: state.sessionType === SessionType.Focus ? state.task : "",
      startedAt: state.startedAt,
      finishedAt,
      duration: completed
        ? state.sessionDurationMs
        : Math.max(0, state.sessionDurationMs - state.remainingMs),
      completed,
    };
  };

  /**
   * Agenda as notificações do fim da sessão em andamento e, com o início
   * automático, das seguintes (cadeia limitada). Com o app fechado são elas
   * que avisam o usuário; ao reabrir, `resolveElapsed` recupera o que passou.
   */
  const scheduleChain = (): void => {
    const state = get();
    if (state.status !== TimerStatus.Running || state.targetEndsAt === null) {
      return;
    }
    const { settings } = useSettingsStore.getState();
    const limit = settings.autoStart ? MAX_AUTO_CHAIN_SESSIONS : 1;
    const chain = projectChain(
      {
        sessionType: state.sessionType,
        currentPomodoro: state.currentPomodoro,
        completedInCycle: state.completedInCycle,
      },
      state.targetEndsAt,
      durationForType,
      settings.pomodorosPerCycle,
      limit,
    );
    const nowMs = Date.now();

    void scheduleSessionEndNotifications(
      chain.map((entry, index) => ({
        finishedType: entry.finishedType,
        nextType: entry.nextType,
        nextDurationMin: Math.round(entry.nextDurationMs / 60000),
        // A última da cadeia não inicia nada sozinha: o usuário precisa voltar.
        autoStart: settings.autoStart && index < limit - 1,
        endsAtMs: entry.endsAt,
        nowMs,
        preferences: {
          soundEnabled: settings.soundEnabled,
          vibrationEnabled: settings.vibrationEnabled,
        },
      })),
    ).catch(reportError);
  };

  const cancelEnd = (): void => {
    void cancelSessionEndNotification().catch(reportError);
  };

  /**
   * Resolve uma sessão em andamento cujo fim já passou (app fechado, em segundo
   * plano ou tick atrasado) e devolve o novo estado. Se o fim é "agora", a
   * sessão fica FINISHED (a UI vibra/toca e o hook inicia a próxima). Se é
   * antigo e o início automático está ligado, recupera a cadeia: registra as
   * sessões que passaram e continua da que está rodando (Regras 3 e 6).
   */
  const resolveElapsed = (
    base: Pick<
      PomodoroState,
      | "sessionType"
      | "currentPomodoro"
      | "completedInCycle"
      | "task"
      | "sessionDurationMs"
      | "startedAt"
    >,
    endsAt: number,
    now: number,
  ): Partial<PomodoroState> => {
    const { settings } = useSettingsStore.getState();
    const stale = now - endsAt >= FRESH_FINISH_MS;
    const limit = settings.autoStart && stale ? MAX_AUTO_CHAIN_SESSIONS : 1;
    const first: TimedSession = {
      sessionType: base.sessionType,
      currentPomodoro: base.currentPomodoro,
      completedInCycle: base.completedInCycle,
      startedAt: base.startedAt ?? endsAt - base.sessionDurationMs,
      durationMs: base.sessionDurationMs,
      endsAt,
    };
    const { completed, current } = catchUpChain(
      first,
      now,
      durationForType,
      settings.pomodorosPerCycle,
      limit,
    );

    completed.forEach((session, index) => {
      // Sessão que nunca chegou a rodar (sem startedAt) não entra no histórico.
      if (index === 0 && base.startedAt === null) {
        return;
      }
      recordSession({
        type: session.sessionType,
        task: index === 0 && session.sessionType === SessionType.Focus ? base.task : "",
        startedAt: session.startedAt,
        finishedAt: session.endsAt,
        duration: session.durationMs,
        completed: true,
      });
    });

    if (current !== null) {
      return {
        status: TimerStatus.Running,
        sessionType: current.sessionType,
        currentPomodoro: current.currentPomodoro,
        completedInCycle: current.completedInCycle,
        sessionDurationMs: current.durationMs,
        startedAt: current.startedAt,
        targetEndsAt: current.endsAt,
        remainingMs: remainingFromTarget(current.endsAt, now),
        finishedAt: null,
        finishedNaturally: false,
        task: "",
      };
    }

    const last = completed[completed.length - 1] as TimedSession;
    return {
      status: TimerStatus.Finished,
      sessionType: last.sessionType,
      currentPomodoro: last.currentPomodoro,
      completedInCycle: last.completedInCycle,
      sessionDurationMs: last.durationMs,
      startedAt: last.startedAt,
      targetEndsAt: null,
      remainingMs: 0,
      finishedAt: last.endsAt,
      finishedNaturally: true,
      task: completed.length === 1 ? base.task : "",
    };
  };

  const advance = (state: PomodoroState, focusWasCompleted: boolean) => {
    const { pomodorosPerCycle } = useSettingsStore.getState().settings;
    const next = computeNext(state, focusWasCompleted, pomodorosPerCycle);
    return { next, duration: durationForType(next.sessionType) };
  };

  return {
    status: TimerStatus.Idle,
    sessionType: SessionType.Focus,
    currentPomodoro: 1,
    completedInCycle: 0,
    completedToday: 0,
    focusTimeTodayMs: 0,
    task: "",
    sessionDurationMs: INITIAL_DURATION,
    targetEndsAt: null,
    remainingMs: INITIAL_DURATION,
    startedAt: null,
    finishedAt: null,
    finishedNaturally: false,
    historyVersion: 0,
    loadStatus: "idle",
    error: null,

    /**
     * Recuperação do estado (requisito 11, Regra 6): ao abrir o app, restaura
     * a sessão salva; se ela terminou enquanto o app estava fechado, registra
     * a conclusão e mostra a tela de sessão concluída.
     */
    hydrate: async () => {
      set({ loadStatus: "loading", error: null });

      try {
        const database = await getDatabase();
        const [saved, today] = await Promise.all([
          loadTimerState(database),
          focusStatsBetween(database, startOfToday(), Date.now() + 1),
        ]);
        const todayValues = {
          completedToday: today.completedPomodoros,
          focusTimeTodayMs: today.focusTimeMs,
        };

        if (saved === null) {
          const duration = durationForType(SessionType.Focus);
          set({ ...todayValues, sessionDurationMs: duration, remainingMs: duration, loadStatus: "ready" });
          return;
        }

        const base = {
          sessionType: saved.sessionType,
          currentPomodoro: saved.currentPomodoro,
          completedInCycle: saved.completedInCycle,
          task: saved.task,
          sessionDurationMs: saved.sessionDurationMs,
          startedAt: saved.startedAt,
          finishedNaturally: saved.finishedNaturally,
          finishedAt: null,
          loadStatus: "ready" as const,
          ...todayValues,
        };

        if (saved.status === TimerStatus.Running && saved.targetEndsAt !== null) {
          const remaining = remainingFromTarget(saved.targetEndsAt, Date.now());

          if (remaining <= 0) {
            // Terminou com o app fechado: registra o que passou (e, com início
            // automático, recupera a cadeia de sessões seguintes).
            set({ ...base, ...resolveElapsed(base, saved.targetEndsAt, Date.now()) });
            persist();
            return;
          }

          set({
            ...base,
            status: TimerStatus.Running,
            targetEndsAt: saved.targetEndsAt,
            remainingMs: remaining,
          });
          return;
        }

        set({
          ...base,
          status: saved.status,
          targetEndsAt: null,
          remainingMs: saved.remainingMs,
        });
      } catch (error: unknown) {
        // Sem banco o cronômetro continua funcionando em memória.
        set({ loadStatus: "error", error: getErrorMessage(error) });
      }
    },

    setTask: (task) => {
      set({ task });
      persist();
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
        finishedAt: null,
        finishedNaturally: false,
      });
      persist();
      scheduleChain();
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
      persist();
      cancelEnd();
    },

    resume: () => {
      const state = get();
      if (state.status !== TimerStatus.Paused) {
        return;
      }
      const targetEndsAt = Date.now() + state.remainingMs;
      set({ status: TimerStatus.Running, targetEndsAt });
      persist();
      scheduleChain();
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
      persist();
      cancelEnd();
    },

    skip: () => {
      const state = get();
      if (state.status === TimerStatus.Finished) {
        return;
      }
      // Regra 4: pular NÃO conta como concluído, mas fica no histórico.
      const now = Date.now();
      const remaining =
        state.status === TimerStatus.Running && state.targetEndsAt !== null
          ? remainingFromTarget(state.targetEndsAt, now)
          : state.remainingMs;
      const record = buildRecord({ ...state, remainingMs: remaining }, false, now);

      const { next, duration } = advance(state, false);
      set({
        ...next,
        status: TimerStatus.Idle,
        sessionDurationMs: duration,
        remainingMs: duration,
        targetEndsAt: null,
        startedAt: null,
        finishedAt: null,
        finishedNaturally: false,
        task: next.sessionType === SessionType.Focus ? state.task : "",
      });
      persist();
      cancelEnd();
      if (record !== null) {
        recordSession(record);
      }
    },

    syncFromClock: (now) => {
      const state = get();
      if (state.status !== TimerStatus.Running || state.targetEndsAt === null) {
        return;
      }
      const remaining = remainingFromTarget(state.targetEndsAt, now);
      if (remaining > 0) {
        set({ remainingMs: remaining });
        return;
      }

      // Regra 3: chegou ao fim naturalmente → sessão concluída e registrada.
      set(resolveElapsed(state, state.targetEndsAt, now));
      persist();
    },

    startNext: (anchorAt) => {
      const state = get();
      if (state.status !== TimerStatus.Finished) {
        return;
      }
      const { next, duration } = advance(
        state,
        state.finishedNaturally && state.sessionType === SessionType.Focus,
      );
      const now = anchorAt === undefined ? Date.now() : Math.min(anchorAt, Date.now());
      const targetEndsAt = now + duration;
      set({
        ...next,
        status: TimerStatus.Running,
        sessionDurationMs: duration,
        remainingMs: duration,
        targetEndsAt,
        startedAt: now,
        finishedAt: null,
        finishedNaturally: false,
        task: next.sessionType === SessionType.Focus ? state.task : "",
      });
      persist();
      scheduleChain();
    },

    acknowledgeFinish: () => {
      const state = get();
      if (state.status !== TimerStatus.Finished) {
        return;
      }
      const { next, duration } = advance(
        state,
        state.finishedNaturally && state.sessionType === SessionType.Focus,
      );
      set({
        ...next,
        status: TimerStatus.Idle,
        sessionDurationMs: duration,
        remainingMs: duration,
        targetEndsAt: null,
        startedAt: null,
        finishedAt: null,
        finishedNaturally: false,
        task: next.sessionType === SessionType.Focus ? state.task : "",
      });
      persist();
    },

    /**
     * Com o cronômetro parado (IDLE, sem sessão iniciada), a duração exibida
     * acompanha as configurações. Sessões em andamento não mudam (Regra 9).
     */
    refreshIdleDuration: () => {
      const state = get();
      if (state.status !== TimerStatus.Idle || state.startedAt !== null) {
        return;
      }
      const duration = durationForType(state.sessionType);
      if (duration === state.sessionDurationMs && duration === state.remainingMs) {
        return;
      }
      set({ sessionDurationMs: duration, remainingMs: duration });
      persist();
    },

    refreshScheduledChain: () => scheduleChain(),

    clearHistory: async () => {
      await enqueuePersistence(async () => {
        const database = await getDatabase();
        await clearSessions(database);
        set((state) => ({
          completedToday: 0,
          focusTimeTodayMs: 0,
          historyVersion: state.historyVersion + 1,
        }));
      }, reportError);
    },

    clearError: () => set({ error: null }),
  };
});
