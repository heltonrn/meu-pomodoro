import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({ Platform: { OS: "android" } }));
vi.mock("expo-constants", () => ({
  default: { executionEnvironment: "bare" },
  ExecutionEnvironment: { StoreClient: "storeClient" },
}));

import { buildNotificationText, channelIdFor } from "../src/services/NotificationService";
import { SessionType } from "../src/types";

describe("texto da notificação (req. 16)", () => {
  it("fim de foco informa a pausa curta com a duração configurada", () => {
    const text = buildNotificationText({
      finishedType: SessionType.Focus,
      nextType: SessionType.ShortBreak,
      nextDurationMin: 5,
      autoStart: true,
    });
    expect(text.title).toBe("🍅 Meu Pomodoro");
    expect(text.body).toBe("Pomodoro concluído!\nPausa de 5 minutos iniciada.");
  });

  it("fim do último foco do ciclo informa a pausa LONGA, não a curta", () => {
    const text = buildNotificationText({
      finishedType: SessionType.Focus,
      nextType: SessionType.LongBreak,
      nextDurationMin: 15,
      autoStart: false,
    });
    expect(text.body).toBe("Pomodoro concluído!\nHora da pausa de 15 minutos.");
  });

  it("usa o singular para 1 minuto e o texto de fim de pausa", () => {
    expect(
      buildNotificationText({
        finishedType: SessionType.Focus,
        nextType: SessionType.ShortBreak,
        nextDurationMin: 1,
        autoStart: false,
      }).body,
    ).toContain("1 minuto.");

    expect(
      buildNotificationText({
        finishedType: SessionType.ShortBreak,
        nextType: SessionType.Focus,
        nextDurationMin: 25,
        autoStart: false,
      }).body,
    ).toBe("Pausa concluída!\nHora de voltar ao foco.");
  });

  it("escolhe um canal Android por combinação de som e vibração", () => {
    const ids = new Set([
      channelIdFor({ soundEnabled: true, vibrationEnabled: true }),
      channelIdFor({ soundEnabled: true, vibrationEnabled: false }),
      channelIdFor({ soundEnabled: false, vibrationEnabled: true }),
      channelIdFor({ soundEnabled: false, vibrationEnabled: false }),
    ]);
    expect(ids.size).toBe(4);
  });

  it("fim de pausa com início automático informa o foco que já começou", () => {
    expect(
      buildNotificationText({
        finishedType: SessionType.ShortBreak,
        nextType: SessionType.Focus,
        nextDurationMin: 25,
        autoStart: true,
      }).body,
    ).toBe("Pausa concluída!\nFoco de 25 minutos iniciado.");
  });
});
