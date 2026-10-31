import { SessionType } from "../types";

export interface CycleState {
  sessionType: SessionType;
  /** Posição do Pomodoro dentro do ciclo (1-based). */
  currentPomodoro: number;
  /** Quantos focos foram CONCLUÍDOS (não pulados) no ciclo atual. */
  completedInCycle: number;
}

/**
 * Regra do ciclo (requisito 7): foco → pausa curta, repetindo até o último
 * foco do ciclo, que leva à pausa longa; após a pausa longa, novo ciclo.
 * Função pura: não depende de store, relógio ou banco.
 */
export function computeNext(
  state: CycleState,
  focusWasCompleted: boolean,
  pomodorosPerCycle: number,
): CycleState {
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
    return { sessionType: SessionType.Focus, currentPomodoro: 1, completedInCycle: 0 };
  }

  return {
    sessionType: SessionType.Focus,
    currentPomodoro: state.currentPomodoro + 1,
    completedInCycle: state.completedInCycle,
  };
}

/** Tipo da sessão que vem depois, sem alterar contadores (usado pela UI). */
export function nextTypeAfter(
  sessionType: SessionType,
  currentPomodoro: number,
  pomodorosPerCycle: number,
): SessionType {
  return computeNext(
    { sessionType, currentPomodoro, completedInCycle: 0 },
    false,
    pomodorosPerCycle,
  ).sessionType;
}

/** Uma sessão do futuro projetada pela cadeia de início automático. */
export interface ProjectedSession {
  finishedType: SessionType;
  nextType: SessionType;
  /** Quando a sessão `finishedType` termina. */
  endsAt: number;
  /** Duração da sessão seguinte. */
  nextDurationMs: number;
}

/**
 * Projeta o fim das próximas `limit` sessões a partir da atual, assumindo que
 * cada foco é concluído e que a seguinte começa assim que a anterior termina.
 * Serve para agendar as notificações com o app fechado.
 */
export function projectChain(
  current: CycleState,
  currentEndsAt: number,
  durationFor: (type: SessionType) => number,
  pomodorosPerCycle: number,
  limit: number,
): ProjectedSession[] {
  const chain: ProjectedSession[] = [];
  let cursor = current;
  let endsAt = currentEndsAt;

  for (let index = 0; index < limit; index += 1) {
    const next = computeNext(cursor, true, pomodorosPerCycle);
    const nextDurationMs = durationFor(next.sessionType);
    chain.push({
      finishedType: cursor.sessionType,
      nextType: next.sessionType,
      endsAt,
      nextDurationMs,
    });
    cursor = next;
    endsAt += nextDurationMs;
  }

  return chain;
}

export interface TimedSession extends CycleState {
  startedAt: number;
  durationMs: number;
  endsAt: number;
}

export interface CatchUpResult {
  /** Sessões que terminaram por completo (todas concluídas naturalmente). */
  completed: TimedSession[];
  /** Sessão ainda em andamento em `now`; null se a cadeia se esgotou. */
  current: TimedSession | null;
}

/**
 * Recupera o que aconteceu com o app fechado: a partir da sessão salva, avança
 * as sessões cujo fim já passou. No máximo `limit` sessões são cobertas
 * (a mesma quantidade que foi agendada), depois disso a cadeia para e o
 * cronômetro fica no fim da última, sem inventar horas de foco no histórico.
 */
export function catchUpChain(
  first: TimedSession,
  now: number,
  durationFor: (type: SessionType) => number,
  pomodorosPerCycle: number,
  limit: number,
): CatchUpResult {
  const completed: TimedSession[] = [];
  let cursor = first;

  for (let index = 0; index < limit; index += 1) {
    if (cursor.endsAt > now) {
      return { completed, current: cursor };
    }
    completed.push(cursor);
    if (index === limit - 1) {
      break;
    }
    const next = computeNext(cursor, true, pomodorosPerCycle);
    const durationMs = durationFor(next.sessionType);
    cursor = { ...next, startedAt: cursor.endsAt, durationMs, endsAt: cursor.endsAt + durationMs };
  }

  return { completed, current: null };
}
