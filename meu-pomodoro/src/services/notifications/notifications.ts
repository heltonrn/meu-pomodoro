import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { SessionType } from '../../types';
import { useSettingsStore } from '../../store/settingsStore';

/**
 * Fase 6 — notificações locais (requisito 16).
 * A notificação é AGENDADA para o horário real de término da sessão, então
 * ela dispara mesmo com o app em segundo plano ou fechado.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => {
    const { soundEnabled } = useSettingsStore.getState().settings;
    return {
      shouldShowAlert: true,
      shouldPlaySound: soundEnabled,
      shouldSetBadge: false,
    };
  },
});

export async function setupNotifications(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('pomodoro', {
      name: 'Sessões Pomodoro',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }
}

function contentFor(finishedType: SessionType): Notifications.NotificationContentInput {
  const { shortBreakDurationMin } = useSettingsStore.getState().settings;
  if (finishedType === SessionType.Focus) {
    return {
      title: '🍅 Meu Pomodoro',
      body: `Pomodoro concluído! Hora de fazer uma pausa de ${shortBreakDurationMin} minutos.`,
    };
  }
  return {
    title: '🍅 Meu Pomodoro',
    body: 'Pausa concluída! Hora de voltar ao foco.',
  };
}

export async function scheduleSessionEndNotification(
  sessionType: SessionType,
  endsAtMs: number,
): Promise<void> {
  await cancelSessionEndNotification();
  const secondsUntil = Math.max(1, Math.round((endsAtMs - Date.now()) / 1000));
  const { soundEnabled } = useSettingsStore.getState().settings;
  await Notifications.scheduleNotificationAsync({
    identifier: 'session-end',
    content: {
      ...contentFor(sessionType),
      sound: soundEnabled,
    },
    trigger: {
      seconds: secondsUntil,
      channelId: 'pomodoro',
    },
  });
}

export async function cancelSessionEndNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync('session-end').catch(() => {
    // Sem notificação agendada: nada a cancelar.
  });
}
