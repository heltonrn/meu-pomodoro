import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createTestDatabase } from "./helpers/sqlite";

const notifications = vi.hoisted(() => ({
  scheduleSessionEndNotifications: vi.fn().mockResolvedValue(undefined),
  cancelSessionEndNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../src/services/NotificationService", () => notifications);
vi.mock("../src/database/database", () => ({ getDatabase: vi.fn() }));

import { getDatabase } from "../src/database/database";
import { runMigrations } from "../src/database/migrations";
import { listSessionsBetween, loadTimerState, saveTimerState } from "../src/database/repositories";
import { DEFAULT_SETTINGS } from "../src/constants/defaults";
import { flushPersistence } from "../src/services/PersistenceQueue";
import { usePomodoroStore } from "../src/store/pomodoroStore";
import { useSettingsStore } from "../src/store/settingsStore";
import { SessionType, TimerStatus } from "../src/types";
import { minutesToMs } from "../src/utils/time";

const T0 = new Date("2026-10-22T10:00:00.000Z").getTime();

async function resetEnvironment() {
  const database = createTestDatabase();
  await runMigrations(database);
  vi.mocked(getDatabase).mockResolvedValue(database);
  useSettingsStore.setState({ settings: DEFAULT_SETTINGS, status: "idle", error: null });
  usePomodoroStore.setState(usePomodoroStore.getInitialState(), true);
  return database;
}

const store = () => usePomodoroStore.getState();

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(T0);
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("pomodoroStore", () => {
  it("Regra 1: só inicia a partir do IDLE e deriva o fim do timestamp", async () => {
    await resetEnvironment();
    store().start();

    expect(store().status).toBe(TimerStatus.Running);
    expect(store().targetEndsAt).toBe(T0 + minutesToMs(25));

    const target = store().targetEndsAt;
    vi.setSystemTime(T0 + 60_000);
    store().start();
    expect(store().targetEndsAt).toBe(target);
    expect(notifications.scheduleSessionEndNotifications).toHaveBeenCalledTimes(1);
  });

  it("req. 10: o restante vem do relógio, mesmo após um salto de tempo", async () => {
    await resetEnvironment();
    store().start();

    vi.setSystemTime(T0 + minutesToMs(10));
    store().syncFromClock(Date.now());
    expect(store().remainingMs).toBe(minutesToMs(15));
    expect(store().status).toBe(TimerStatus.Running);
  });

  it("Regra 2: pausar congela o restante e continuar recalcula o alvo", async () => {
    await resetEnvironment();
    store().start();
    vi.setSystemTime(T0 + minutesToMs(5));
    store().pause();

    expect(store().status).toBe(TimerStatus.Paused);
    expect(store().remainingMs).toBe(minutesToMs(20));
    expect(notifications.cancelSessionEndNotification).toHaveBeenCalled();

    vi.setSystemTime(T0 + minutesToMs(60));
    store().resume();
    expect(store().targetEndsAt).toBe(T0 + minutesToMs(60) + minutesToMs(20));
  });

  it("Regra 3: término natural registra sessão concluída e atualiza estatísticas", async () => {
    const database = await resetEnvironment();
    store().setTask("Estudar Banco de Dados");
    store().start();

    vi.setSystemTime(T0 + minutesToMs(25) + 10);
    store().syncFromClock(Date.now());
    await flushPersistence();

    expect(store().status).toBe(TimerStatus.Finished);
    expect(store().finishedNaturally).toBe(true);
    expect(store().completedToday).toBe(1);
    expect(store().focusTimeTodayMs).toBe(minutesToMs(25));

    const sessions = await listSessionsBetween(database, 0, Date.now() + 1);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      type: SessionType.Focus,
      task: "Estudar Banco de Dados",
      completed: true,
      duration: minutesToMs(25),
    });
  });

  it("Regra 4: pular registra a sessão como NÃO concluída e avança", async () => {
    const database = await resetEnvironment();
    store().start();
    vi.setSystemTime(T0 + minutesToMs(10));
    store().skip();
    await flushPersistence();

    expect(store().sessionType).toBe(SessionType.ShortBreak);
    expect(store().status).toBe(TimerStatus.Idle);
    expect(store().completedInCycle).toBe(0);
    expect(store().completedToday).toBe(0);

    const [session] = await listSessionsBetween(database, 0, Date.now() + 1);
    expect(session).toMatchObject({ completed: false, duration: minutesToMs(10) });
  });

  it("Regra 5: reiniciar volta ao IDLE com a duração cheia e sem registrar", async () => {
    const database = await resetEnvironment();
    store().start();
    vi.setSystemTime(T0 + minutesToMs(3));
    store().restart();
    await flushPersistence();

    expect(store().status).toBe(TimerStatus.Idle);
    expect(store().remainingMs).toBe(minutesToMs(25));
    expect(store().startedAt).toBeNull();
    expect(await listSessionsBetween(database, 0, Date.now() + 1)).toHaveLength(0);
  });

  it("Regra 9: mudar configurações não altera a sessão em andamento", async () => {
    await resetEnvironment();
    store().start();

    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, focusDurationMin: 50 } });
    store().refreshIdleDuration();

    expect(store().sessionDurationMs).toBe(minutesToMs(25));
    expect(store().targetEndsAt).toBe(T0 + minutesToMs(25));
  });

  it("com o cronômetro parado, a duração exibida acompanha as configurações", async () => {
    await resetEnvironment();
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, focusDurationMin: 50 } });
    store().refreshIdleDuration();

    expect(store().remainingMs).toBe(minutesToMs(50));
    expect(store().sessionDurationMs).toBe(minutesToMs(50));
  });

  it("Regra 6: recupera uma sessão em andamento sem voltar no tempo", async () => {
    const database = await resetEnvironment();
    await saveTimerState(
      database,
      {
        status: TimerStatus.Running,
        sessionType: SessionType.Focus,
        currentPomodoro: 1,
        completedInCycle: 0,
        task: "Ler um livro",
        sessionDurationMs: minutesToMs(25),
        targetEndsAt: T0 + minutesToMs(15),
        remainingMs: minutesToMs(15),
        startedAt: T0 - minutesToMs(10),
        finishedNaturally: false,
      },
      "2026-10-22T10:00:00.000Z",
    );

    await store().hydrate();

    expect(store().status).toBe(TimerStatus.Running);
    expect(store().remainingMs).toBe(minutesToMs(15));
    expect(store().task).toBe("Ler um livro");
    expect(store().loadStatus).toBe("ready");
  });

  it("registra e mostra como concluída uma sessão que terminou com o app fechado", async () => {
    const database = await resetEnvironment();
    await saveTimerState(
      database,
      {
        status: TimerStatus.Running,
        sessionType: SessionType.Focus,
        currentPomodoro: 1,
        completedInCycle: 0,
        task: "",
        sessionDurationMs: minutesToMs(25),
        targetEndsAt: T0 - minutesToMs(5),
        remainingMs: minutesToMs(25),
        startedAt: T0 - minutesToMs(30),
        finishedNaturally: false,
      },
      "2026-10-22T09:00:00.000Z",
    );

    await store().hydrate();
    await flushPersistence();

    expect(store().status).toBe(TimerStatus.Finished);
    expect(store().finishedNaturally).toBe(true);
    // finishedAt no passado: o hook não deve vibrar ao reabrir.
    expect(store().finishedAt).toBe(T0 - minutesToMs(5));
    expect(store().completedToday).toBe(1);

    const saved = await loadTimerState(database);
    expect(saved?.status).toBe(TimerStatus.Finished);
    expect(await listSessionsBetween(database, 0, T0 + 1)).toHaveLength(1);
  });

  it("segue para a pausa longa após o último Pomodoro do ciclo", async () => {
    await resetEnvironment();
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, pomodorosPerCycle: 1 } });
    store().start();
    vi.setSystemTime(T0 + minutesToMs(26));
    store().syncFromClock(Date.now());
    store().startNext();

    expect(store().sessionType).toBe(SessionType.LongBreak);
    expect(store().status).toBe(TimerStatus.Running);
    expect(store().completedInCycle).toBe(1);
  });

  it("reporta falha de banco sem derrubar o cronômetro", async () => {
    await resetEnvironment();
    vi.mocked(getDatabase).mockRejectedValue(new Error("SQLite indisponível"));

    store().start();
    await flushPersistence();

    expect(store().status).toBe(TimerStatus.Running);
    expect(store().error).toBe("SQLite indisponível");
  });

  it("clearHistory zera as estatísticas e avisa as telas", async () => {
    const database = await resetEnvironment();
    store().start();
    vi.setSystemTime(T0 + minutesToMs(26));
    store().syncFromClock(Date.now());
    await flushPersistence();
    const versionBefore = store().historyVersion;

    await store().clearHistory();

    expect(store().completedToday).toBe(0);
    expect(store().historyVersion).toBeGreaterThan(versionBefore);
    expect(await listSessionsBetween(database, 0, Date.now() + 1)).toHaveLength(0);
  });

  describe("início automático com o app fechado", () => {
    const savedFocus = (endedAgoMin: number) => ({
      status: TimerStatus.Running,
      sessionType: SessionType.Focus,
      currentPomodoro: 1,
      completedInCycle: 0,
      task: "Estudar",
      sessionDurationMs: minutesToMs(25),
      targetEndsAt: T0 - minutesToMs(endedAgoMin),
      remainingMs: minutesToMs(25),
      startedAt: T0 - minutesToMs(endedAgoMin + 25),
      finishedNaturally: false,
    });

    it("sem início automático agenda só o fim da sessão atual", async () => {
      await resetEnvironment();
      store().start();

      const [inputs] = notifications.scheduleSessionEndNotifications.mock.calls[0] ?? [];
      expect(inputs).toHaveLength(1);
      expect(inputs[0].autoStart).toBe(false);
    });

    it("com início automático agenda a cadeia; só a última não inicia sozinha", async () => {
      await resetEnvironment();
      useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, autoStart: true } });
      store().start();

      const [inputs] = notifications.scheduleSessionEndNotifications.mock.calls[0] ?? [];
      expect(inputs).toHaveLength(8);
      expect(inputs.map((item: { autoStart: boolean }) => item.autoStart)).toEqual([
        true, true, true, true, true, true, true, false,
      ]);
      expect(inputs[0].endsAtMs).toBe(T0 + minutesToMs(25));
      expect(inputs[1].endsAtMs).toBe(T0 + minutesToMs(30));
      // O 4º foco termina na pausa LONGA (15 min).
      expect(inputs[6].nextDurationMin).toBe(15);
    });

    it("ao reabrir registra as sessões que passaram e continua da que está rodando", async () => {
      const database = await resetEnvironment();
      useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, autoStart: true } });
      // Foco 1 terminou há 70 min; depois: pausa, foco 2, pausa, foco 3, pausa → foco 4 roda.
      await saveTimerState(database, savedFocus(70), "2026-10-22T09:00:00.000Z");

      await store().hydrate();
      await flushPersistence();

      expect(store().status).toBe(TimerStatus.Running);
      expect(store().sessionType).toBe(SessionType.Focus);
      expect(store().currentPomodoro).toBe(4);
      expect(store().completedInCycle).toBe(3);
      expect(store().targetEndsAt).toBe(T0 + minutesToMs(20));
      expect(store().remainingMs).toBe(minutesToMs(20));

      const sessions = await listSessionsBetween(database, 0, T0 + 1);
      expect(sessions).toHaveLength(6);
      expect(sessions.filter((item) => item.type === SessionType.Focus && item.completed)).toHaveLength(3);
      expect(sessions.every((item) => item.completed)).toBe(true);
    });

    it("limita a cadeia: depois de um ciclo o cronômetro espera o usuário", async () => {
      const database = await resetEnvironment();
      useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, autoStart: true } });
      await saveTimerState(database, savedFocus(3 * 24 * 60), "2026-10-19T09:00:00.000Z");

      await store().hydrate();
      await flushPersistence();

      expect(store().status).toBe(TimerStatus.Finished);
      expect(store().finishedNaturally).toBe(true);
      expect(await listSessionsBetween(database, 0, T0 + 1)).toHaveLength(8);
    });

    it("fim recente fica FINISHED e a próxima sessão começa no instante em que a anterior terminou", async () => {
      await resetEnvironment();
      useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, autoStart: true } });
      store().start();
      const endsAt = T0 + minutesToMs(25);
      vi.setSystemTime(endsAt + 2_000);
      store().syncFromClock(Date.now());

      expect(store().status).toBe(TimerStatus.Finished);
      expect(store().finishedAt).toBe(endsAt);

      store().startNext(endsAt);
      expect(store().status).toBe(TimerStatus.Running);
      expect(store().sessionType).toBe(SessionType.ShortBreak);
      expect(store().targetEndsAt).toBe(endsAt + minutesToMs(5));
    });

    it("reagenda a cadeia quando as configurações mudam durante a sessão", async () => {
      await resetEnvironment();
      store().start();
      useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, autoStart: true } });
      store().refreshScheduledChain();

      const calls = notifications.scheduleSessionEndNotifications.mock.calls;
      expect(calls).toHaveLength(2);
      expect(calls[1]?.[0]).toHaveLength(8);
    });
  });
});
