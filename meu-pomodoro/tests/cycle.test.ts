import { describe, expect, it } from "vitest";

import {
  catchUpChain,
  computeNext,
  nextTypeAfter,
  projectChain,
} from "../src/services/CycleService";
import { SessionType } from "../src/types";

const PER_CYCLE = 4;

describe("CycleService.computeNext", () => {
  it("segue foco → pausa curta → foco até a pausa longa no último Pomodoro", () => {
    let state = { sessionType: SessionType.Focus, currentPomodoro: 1, completedInCycle: 0 };
    const sequence: SessionType[] = [];

    for (let step = 0; step < 8; step++) {
      state = computeNext(state, true, PER_CYCLE);
      sequence.push(state.sessionType);
    }

    expect(sequence).toEqual([
      SessionType.ShortBreak,
      SessionType.Focus,
      SessionType.ShortBreak,
      SessionType.Focus,
      SessionType.ShortBreak,
      SessionType.Focus,
      SessionType.LongBreak,
      SessionType.Focus,
    ]);
  });

  it("conta o foco concluído no ciclo e reinicia o ciclo após a pausa longa", () => {
    const afterFocus = computeNext(
      { sessionType: SessionType.Focus, currentPomodoro: 4, completedInCycle: 3 },
      true,
      PER_CYCLE,
    );
    expect(afterFocus).toEqual({
      sessionType: SessionType.LongBreak,
      currentPomodoro: 4,
      completedInCycle: 4,
    });

    expect(computeNext(afterFocus, false, PER_CYCLE)).toEqual({
      sessionType: SessionType.Focus,
      currentPomodoro: 1,
      completedInCycle: 0,
    });
  });

  it("Regra 4: foco pulado avança mas não conta como concluído", () => {
    const next = computeNext(
      { sessionType: SessionType.Focus, currentPomodoro: 2, completedInCycle: 1 },
      false,
      PER_CYCLE,
    );
    expect(next.completedInCycle).toBe(1);
    expect(next.sessionType).toBe(SessionType.ShortBreak);
  });

  it("vai para a pausa longa se o ciclo foi reduzido abaixo do Pomodoro atual", () => {
    const next = computeNext(
      { sessionType: SessionType.Focus, currentPomodoro: 3, completedInCycle: 2 },
      true,
      2,
    );
    expect(next.sessionType).toBe(SessionType.LongBreak);
  });

  it("nextTypeAfter não depende dos contadores", () => {
    expect(nextTypeAfter(SessionType.Focus, 4, 4)).toBe(SessionType.LongBreak);
    expect(nextTypeAfter(SessionType.Focus, 1, 4)).toBe(SessionType.ShortBreak);
    expect(nextTypeAfter(SessionType.ShortBreak, 1, 4)).toBe(SessionType.Focus);
    expect(nextTypeAfter(SessionType.LongBreak, 4, 4)).toBe(SessionType.Focus);
  });
});

const MIN = 60_000;
const durationFor = (type: SessionType): number =>
  type === SessionType.Focus ? 25 * MIN : type === SessionType.LongBreak ? 15 * MIN : 5 * MIN;

describe("CycleService.projectChain", () => {
  it("projeta o fim de cada sessão, com pausa longa no último foco", () => {
    const chain = projectChain(
      { sessionType: SessionType.Focus, currentPomodoro: 1, completedInCycle: 0 },
      1000,
      durationFor,
      PER_CYCLE,
      8,
    );

    expect(chain.map((item) => item.finishedType)).toEqual([
      SessionType.Focus, SessionType.ShortBreak, SessionType.Focus, SessionType.ShortBreak,
      SessionType.Focus, SessionType.ShortBreak, SessionType.Focus, SessionType.LongBreak,
    ]);
    expect(chain[0]?.endsAt).toBe(1000);
    expect(chain[1]?.endsAt).toBe(1000 + 5 * MIN);
    expect(chain[6]?.nextType).toBe(SessionType.LongBreak);
    expect(chain[7]?.nextType).toBe(SessionType.Focus);
  });
});

describe("CycleService.catchUpChain", () => {
  const first = {
    sessionType: SessionType.Focus,
    currentPomodoro: 1,
    completedInCycle: 0,
    startedAt: 0,
    durationMs: 25 * MIN,
    endsAt: 25 * MIN,
  };

  it("não avança nada se a sessão ainda não terminou", () => {
    const result = catchUpChain(first, 10 * MIN, durationFor, PER_CYCLE, 8);
    expect(result.completed).toHaveLength(0);
    expect(result.current).toEqual(first);
  });

  it("encadeia as sessões já passadas com início no fim da anterior", () => {
    const result = catchUpChain(first, 40 * MIN, durationFor, PER_CYCLE, 8);

    expect(result.completed.map((item) => item.sessionType)).toEqual([
      SessionType.Focus,
      SessionType.ShortBreak,
    ]);
    expect(result.completed[1]).toMatchObject({ startedAt: 25 * MIN, endsAt: 30 * MIN });
    expect(result.current).toMatchObject({
      sessionType: SessionType.Focus,
      currentPomodoro: 2,
      completedInCycle: 1,
      startedAt: 30 * MIN,
      endsAt: 55 * MIN,
    });
  });

  it("respeita o limite e devolve current nulo quando a cadeia se esgota", () => {
    const result = catchUpChain(first, 1000 * MIN, durationFor, PER_CYCLE, 3);
    expect(result.completed).toHaveLength(3);
    expect(result.current).toBeNull();
  });
});
