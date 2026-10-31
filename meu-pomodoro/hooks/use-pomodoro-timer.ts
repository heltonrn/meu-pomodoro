import { useEffect } from "react";
import { AppState, Vibration } from "react-native";
import { useAudioPlayer } from "expo-audio";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";

import { FRESH_FINISH_MS, TICK_INTERVAL_MS } from "@/src/constants/defaults";
import { usePomodoroStore } from "@/src/store/pomodoroStore";
import { useSettingsStore } from "@/src/store/settingsStore";
import { TimerStatus } from "@/src/types";

const KEEP_AWAKE_TAG = "pomodoro-timer";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const CHIME_SOURCE = require("@/assets/sounds/chime.wav") as number;

/**
 * Mantém o cronômetro sincronizado com o relógio real.
 *
 * O intervalo NÃO decrementa o tempo: apenas dispara uma releitura do
 * relógio (requisito 10). Assim, se o JS ficar suspenso em segundo plano,
 * o retorno ao app recalcula tudo a partir do timestamp alvo.
 */
export function usePomodoroTimer(): void {
  const status = usePomodoroStore((state) => state.status);
  const finishedAt = usePomodoroStore((state) => state.finishedAt);
  const finishedNaturally = usePomodoroStore((state) => state.finishedNaturally);
  const syncFromClock = usePomodoroStore((state) => state.syncFromClock);
  const startNext = usePomodoroStore((state) => state.startNext);
  const autoStart = useSettingsStore((state) => state.settings.autoStart);
  const vibrationEnabled = useSettingsStore((state) => state.settings.vibrationEnabled);
  const soundEnabled = useSettingsStore((state) => state.settings.soundEnabled);
  const chime = useAudioPlayer(CHIME_SOURCE);
  const keepScreenAwake = useSettingsStore((state) => state.settings.keepScreenAwake);

  // Tick periódico enquanto estiver rodando.
  useEffect(() => {
    if (status !== TimerStatus.Running) {
      return;
    }
    const interval = setInterval(() => {
      syncFromClock(Date.now());
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [status, syncFromClock]);

  // Ressincroniza imediatamente quando o app volta ao primeiro plano.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        syncFromClock(Date.now());
      }
    });
    return () => subscription.remove();
  }, [syncFromClock]);

  // Aviso ao finalizar (requisitos 17 e 19), só se a sessão acabou agora; ao
  // reabrir horas depois, nada vibra nem toca. Em segundo plano quem avisa é a
  // notificação, com o som do canal.
  useEffect(() => {
    if (
      status !== TimerStatus.Finished ||
      finishedAt === null ||
      Date.now() - finishedAt >= FRESH_FINISH_MS
    ) {
      return;
    }
    if (vibrationEnabled) {
      Vibration.vibrate([0, 300, 150, 300]);
    }
    if (soundEnabled) {
      void chime.seekTo(0).then(() => chime.play());
    }
    // Só reage a uma nova sessão finalizada, não a mudanças de configuração.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, finishedAt]);

  // Manter a tela ligada enquanto o cronômetro roda (requisito 18).
  useEffect(() => {
    if (status === TimerStatus.Running && keepScreenAwake) {
      void activateKeepAwakeAsync(KEEP_AWAKE_TAG);
      return () => {
        void deactivateKeepAwake(KEEP_AWAKE_TAG);
      };
    }
    return undefined;
  }, [status, keepScreenAwake]);

  // Início automático da próxima sessão, quando habilitado. Só se o fim é
  // recente: depois da cadeia agendada (app fechado) o cronômetro espera o
  // usuário. A próxima sessão começa no instante em que a anterior terminou.
  useEffect(() => {
    if (
      status === TimerStatus.Finished &&
      finishedNaturally &&
      autoStart &&
      finishedAt !== null &&
      Date.now() - finishedAt < FRESH_FINISH_MS
    ) {
      startNext(finishedAt);
    }
  }, [status, finishedNaturally, autoStart, finishedAt, startNext]);
}
