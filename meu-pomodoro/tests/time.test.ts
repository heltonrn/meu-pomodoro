import { describe, expect, it } from "vitest";

import {
  formatCountdown,
  formatDurationMinutes,
  minutesToMs,
  remainingFromTarget,
  startOfWeek,
} from "../src/utils/time";

describe("utilitários de tempo", () => {
  it("deriva o restante do horário alvo, nunca negativo (req. 10)", () => {
    expect(remainingFromTarget(10_000, 4_000)).toBe(6_000);
    expect(remainingFromTarget(10_000, 12_000)).toBe(0);
  });

  it("formata a contagem arredondando para cima", () => {
    expect(formatCountdown(minutesToMs(25))).toBe("25:00");
    expect(formatCountdown(1)).toBe("00:01");
    expect(formatCountdown(0)).toBe("00:00");
    expect(formatCountdown(-500)).toBe("00:00");
  });

  it("formata durações em minutos e horas", () => {
    expect(formatDurationMinutes(minutesToMs(25))).toBe("25 min");
    expect(formatDurationMinutes(minutesToMs(75))).toBe("1h15");
    expect(formatDurationMinutes(minutesToMs(120))).toBe("2h");
  });

  it("a semana começa na segunda-feira à meia-noite", () => {
    const start = new Date(startOfWeek());
    expect(start.getDay()).toBe(1);
    expect([start.getHours(), start.getMinutes(), start.getSeconds()]).toEqual([0, 0, 0]);
  });
});
