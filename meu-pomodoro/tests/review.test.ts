import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createTestDatabase } from "./helpers/sqlite";

vi.mock("../src/database/database", () => ({ getDatabase: vi.fn() }));

import { getDatabase } from "../src/database/database";
import { runMigrations } from "../src/database/migrations";
import {
  getReviewEngagement,
  getReviewState,
  insertSession,
  updateReviewState,
} from "../src/database/repositories";
import { flushPersistence } from "../src/services/PersistenceQueue";
import {
  REVIEW_FEEDBACK_COOLDOWN_DAYS,
  REVIEW_FEEDBACK_EMAIL,
  REVIEW_SNOOZE_DAYS,
  buildFeedbackMailtoUrl,
  getReviewStateAfterAnswer,
  parseStoredTimestamp,
  shouldPromptReview,
} from "../src/services/ReviewPolicy";
import type { ReviewEligibilityInput } from "../src/services/ReviewPolicy";
import { useReviewStore } from "../src/store/reviewStore";
import { SessionType } from "../src/types";

const NOW = new Date("2026-10-22T21:00:00.000Z");
const DAY = 86_400_000;

const eligible: ReviewEligibilityInput = {
  firstSeenAt: "2026-10-10T12:00:00.000Z",
  completed: false,
  snoozeCount: 0,
  nextPromptAt: null,
  daysWithFocus: 5,
  completedFocus: 8,
  justCompletedFocus: true,
};

describe("shouldPromptReview", () => {
  it("exibe o pedido quando todas as condições são atendidas", () => {
    expect(shouldPromptReview(eligible, NOW)).toBe(true);
  });

  it("aceita engajamento por total de focos mesmo com poucos dias de uso", () => {
    expect(shouldPromptReview({ ...eligible, daysWithFocus: 2, completedFocus: 15 }, NOW)).toBe(true);
  });

  it("só aparece logo após concluir um foco", () => {
    expect(shouldPromptReview({ ...eligible, justCompletedFocus: false }, NOW)).toBe(false);
  });

  it("espera pelo menos 3 dias desde o primeiro uso", () => {
    expect(shouldPromptReview({ ...eligible, firstSeenAt: "2026-10-19T21:00:01.000Z" }, NOW)).toBe(false);
  });

  it("exige engajamento mínimo", () => {
    expect(shouldPromptReview({ ...eligible, daysWithFocus: 3, completedFocus: 14 }, NOW)).toBe(false);
  });

  it("respeita a data do próximo pedido e libera depois dela", () => {
    expect(shouldPromptReview({ ...eligible, nextPromptAt: "2026-11-30T00:00:00.000Z" }, NOW)).toBe(false);
    expect(shouldPromptReview({ ...eligible, nextPromptAt: "2026-10-22T20:59:59.000Z" }, NOW)).toBe(true);
  });

  it("nunca mais pergunta após avaliar ou após 3 adiamentos", () => {
    expect(shouldPromptReview({ ...eligible, completed: true }, NOW)).toBe(false);
    expect(shouldPromptReview({ ...eligible, snoozeCount: 3 }, NOW)).toBe(false);
  });

  it("entende o formato datetime('now') do SQLite", () => {
    expect(parseStoredTimestamp("2026-10-10 12:00:00")).toBe(Date.parse("2026-10-10T12:00:00Z"));
    expect(shouldPromptReview({ ...eligible, firstSeenAt: "2026-10-10 12:00:00" }, NOW)).toBe(true);
    expect(parseStoredTimestamp("não é data")).toBeNull();
  });
});

describe("getReviewStateAfterAnswer", () => {
  it("marca como concluído quando o usuário responde sim", () => {
    expect(getReviewStateAfterAnswer("yes", 1, NOW)).toEqual({ completed: true, nextPromptAt: null });
  });

  it("adia 30 dias e conta o adiamento em 'agora não'", () => {
    const change = getReviewStateAfterAnswer("later", 1, NOW);
    expect(change.snoozeCount).toBe(2);
    expect(change.nextPromptAt).toBe(new Date(NOW.getTime() + REVIEW_SNOOZE_DAYS * DAY).toISOString());
  });

  it("aguarda 60 dias após 'pode melhorar' sem contar como adiamento", () => {
    const change = getReviewStateAfterAnswer("improve", 1, NOW);
    expect(change.snoozeCount).toBeUndefined();
    expect(change.nextPromptAt).toBe(
      new Date(NOW.getTime() + REVIEW_FEEDBACK_COOLDOWN_DAYS * DAY).toISOString(),
    );
  });
});

describe("buildFeedbackMailtoUrl", () => {
  it("monta o mailto com assunto, mensagem e dados do app codificados", () => {
    const url = buildFeedbackMailtoUrl({
      category: "Notificações",
      message: "Quero sons diferentes & mais.",
      appVersion: "1.0.0",
      platform: "android",
      osVersion: "35",
    });

    expect(url.startsWith(`mailto:${REVIEW_FEEDBACK_EMAIL}?subject=`)).toBe(true);
    const query = new URLSearchParams(url.slice(url.indexOf("?") + 1));
    expect(query.get("subject")).toBe("Sugestão — Meu Pomodoro (Notificações)");
    expect(query.get("body")).toContain("Quero sons diferentes & mais.");
    expect(query.get("body")).toContain("Meu Pomodoro 1.0.0 · android 35");
  });
});

async function freshDatabase() {
  const database = createTestDatabase();
  await runMigrations(database);
  vi.mocked(getDatabase).mockResolvedValue(database);
  return database;
}

function focus(startedAt: number, completed = true) {
  return {
    type: SessionType.Focus,
    task: "",
    startedAt,
    finishedAt: startedAt + 25 * 60_000,
    duration: 25 * 60_000,
    completed,
  };
}

describe("ReviewRepository", () => {
  it("cria o estado inicial na migration, com o primeiro uso e sem pedido feito", async () => {
    const database = await freshDatabase();
    const state = await getReviewState(database);

    expect(state.completed).toBe(false);
    expect(state.snoozeCount).toBe(0);
    expect(state.nextPromptAt).toBeNull();
    expect(parseStoredTimestamp(state.firstSeenAt)).not.toBeNull();
  });

  it("grava só os campos informados", async () => {
    const database = await freshDatabase();
    await updateReviewState(database, { snoozeCount: 2, nextPromptAt: "2026-11-01T00:00:00.000Z" });
    await updateReviewState(database, {});
    const state = await getReviewState(database);

    expect(state).toMatchObject({ completed: false, snoozeCount: 2, nextPromptAt: "2026-11-01T00:00:00.000Z" });
  });

  it("conta dias distintos e focos concluídos, ignorando pulados e pausas", async () => {
    const database = await freshDatabase();
    const base = new Date("2026-10-10T15:00:00.000Z").getTime();
    await insertSession(database, focus(base));
    await insertSession(database, focus(base + 3_600_000));
    await insertSession(database, focus(base + 2 * DAY));
    await insertSession(database, focus(base + 3 * DAY, false));
    await insertSession(database, { ...focus(base + 4 * DAY), type: SessionType.ShortBreak });

    expect(await getReviewEngagement(database)).toEqual({ daysWithFocus: 2, completedFocus: 3 });
  });
});

describe("reviewStore", () => {
  beforeEach(() => {
    useReviewStore.setState({ state: null, engagement: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("carrega estado e engajamento do banco", async () => {
    const database = await freshDatabase();
    await insertSession(database, focus(Date.now() - DAY));

    await useReviewStore.getState().refresh();

    expect(useReviewStore.getState().state?.completed).toBe(false);
    expect(useReviewStore.getState().engagement).toEqual({ daysWithFocus: 1, completedFocus: 1 });
  });

  it("responder atualiza a memória na hora e grava no banco", async () => {
    const database = await freshDatabase();
    await useReviewStore.getState().refresh();

    useReviewStore.getState().answer("later");
    expect(useReviewStore.getState().state?.snoozeCount).toBe(1);

    await flushPersistence();
    const saved = await getReviewState(database);
    expect(saved.snoozeCount).toBe(1);
    expect(saved.nextPromptAt).not.toBeNull();

    useReviewStore.getState().answer("yes");
    await flushPersistence();
    expect((await getReviewState(database)).completed).toBe(true);
  });

  it("falha de banco não derruba nada", async () => {
    vi.mocked(getDatabase).mockRejectedValue(new Error("SQLite indisponível"));

    await expect(useReviewStore.getState().refresh()).resolves.toBeUndefined();
    expect(useReviewStore.getState().state).toBeNull();
  });
});
