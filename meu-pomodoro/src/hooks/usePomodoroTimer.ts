import { useEffect } from 'react';
import { AppState, Vibration } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { TICK_INTERVAL_MS } from '../constants/defaults';
import { usePomodoroStore } from '../store/pomodoroStore';
import { useSettingsStore } from '../store/settingsStore';
import { TimerStatus } from '../types';

const KEEP_AWAKE_TAG = 'pomodoro-timer';

/**
 * Mantém o cronômetro sincronizado com o relógio real.
 *
 * O intervalo NÃO decrementa o tempo: apenas dispara uma releitura do
 * relógio (requisito 10). Assim, se o JS ficar suspenso em segundo plano,
 * o retorno ao app recalcula tudo corretamente a partir do timestamp alvo.
 */
export function usePomodoroTimer(): void {
  const status = usePomodoroStore((state) => state.status);
  const syncFromClock = usePomodoroStore((state) => state.syncFromClock);
  const startNext = usePomodoroStore((state) => state.startNext);
  const autoStart = useSettingsStore((state) => state.settings.autoStart);
  const vibrationEnabled = useSettingsStore((state) => state.settings.vibrationEnabled);
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
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        syncFromClock(Date.now());
      }
    });
    return () => subscription.remove();
  }, [syncFromClock]);

  // Fase 3/6 — vibração ao finalizar (requisito 17), se habilitada.
  useEffect(() => {
    if (status === TimerStatus.Finished && vibrationEnabled) {
      Vibration.vibrate([0, 300, 150, 300]);
    }
  }, [status, vibrationEnabled]);

  // Fase 3 — manter a tela ligada enquanto o cronômetro roda (requisito 18).
  useEffect(() => {
    if (status === TimerStatus.Running && keepScreenAwake) {
      void activateKeepAwakeAsync(KEEP_AWAKE_TAG);
      return () => {
        void deactivateKeepAwake(KEEP_AWAKE_TAG);
      };
    }
    void deactivateKeepAwake(KEEP_AWAKE_TAG);
    return undefined;
  }, [status, keepScreenAwake]);

  // Início automático da próxima sessão, quando habilitado.
  useEffect(() => {
    if (status === TimerStatus.Finished && autoStart) {
      startNext();
    }
  }, [status, autoStart, startNext]);
}
