import { useEffect, useState } from "react";

import {
  configureNotificationHandler,
  setupNotifications,
} from "@/src/services/NotificationService";
import { usePomodoroStore } from "@/src/store/pomodoroStore";
import { useSettingsStore } from "@/src/store/settingsStore";

/**
 * Inicialização na ordem correta: banco → configurações → estado do
 * cronômetro → notificações. Retorna `true` quando a UI pode ser exibida.
 * Falhas de banco não travam o app: as stores guardam o erro e seguem em memória.
 */
export function useAppBootstrap(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    // Com o cronômetro parado, a duração exibida acompanha as configurações;
    // com ele rodando, as notificações das sessões futuras são reagendadas.
    const unsubscribe = useSettingsStore.subscribe((state, previous) => {
      if (state.settings !== previous.settings) {
        usePomodoroStore.getState().refreshIdleDuration();
        usePomodoroStore.getState().refreshScheduledChain();
      }
    });

    async function bootstrap(): Promise<void> {
      await useSettingsStore.getState().hydrate();
      await usePomodoroStore.getState().hydrate();

      configureNotificationHandler();

      if (active) {
        setReady(true);
      }

      try {
        // Os canais precisam existir antes de agendar; reagendar também cobre
        // notificações perdidas (ex.: reinício do aparelho) com o cronômetro rodando.
        await setupNotifications();
        usePomodoroStore.getState().refreshScheduledChain();
      } catch (error: unknown) {
        usePomodoroStore.setState({
          error: error instanceof Error ? error.message : "Falha ao configurar as notificações.",
        });
      }
    }

    void bootstrap();

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return ready;
}
