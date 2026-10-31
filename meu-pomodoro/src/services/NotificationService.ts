import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import type * as ExpoNotifications from "expo-notifications";

import { SessionType } from "../types";

const SESSION_NOTIFICATION_ID = "session-end";
/** Arquivo em assets/sounds, copiado para o app pelo plugin do expo-notifications. */
const SESSION_SOUND_FILE = "chime.wav";
const BASE_CHANNEL_PREFIX = "pomodoro-sessions";
// Canais do Android são imutáveis depois de criados: ao mudar som/vibração,
// incremente a versão para o sistema criar canais novos.
const CHANNEL_PREFIX = `${BASE_CHANNEL_PREFIX}-v3`;

export type NotificationPermissionStatus = "granted" | "denied" | "undetermined" | "unavailable";

export interface NotificationPreferences {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface SessionEndNotificationInput {
  finishedType: SessionType;
  nextType: SessionType;
  nextDurationMin: number;
  autoStart: boolean;
  endsAtMs: number;
  nowMs: number;
  preferences: NotificationPreferences;
}

export interface NotificationText {
  title: string;
  body: string;
}

/**
 * A partir do SDK 53, `expo-notifications` interrompe a execução (no Android)
 * assim que é importado dentro do Expo Go. O módulo é carregado sob demanda
 * e somente quando `isSupported()` garante que não estamos nesse cenário.
 */
let notificationsModule: typeof ExpoNotifications | null = null;

function getNotifications(): typeof ExpoNotifications {
  // Carregamento intencionalmente tardio: importar no topo quebra no Expo Go/Android.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  notificationsModule ??= require("expo-notifications") as typeof ExpoNotifications;
  return notificationsModule;
}

function isExpoGoAndroid(): boolean {
  return (
    Platform.OS === "android" &&
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  );
}

export function isNotificationsSupported(): boolean {
  return Platform.OS !== "web" && !isExpoGoAndroid();
}

function formatMinutes(value: number): string {
  return `${value} ${value === 1 ? "minuto" : "minutos"}`;
}

/**
 * Texto da notificação (requisito 16). Descreve a pausa que realmente vem a
 * seguir: curta ou longa, com a duração configurada para ela.
 */
export function buildNotificationText(
  input: Pick<
    SessionEndNotificationInput,
    "finishedType" | "nextType" | "nextDurationMin" | "autoStart"
  >,
): NotificationText {
  const title = "🍅 Meu Pomodoro";

  if (input.finishedType !== SessionType.Focus) {
    const tail = input.autoStart
      ? `Foco de ${formatMinutes(input.nextDurationMin)} iniciado.`
      : "Hora de voltar ao foco.";
    return { title, body: `Pausa concluída!\n${tail}` };
  }

  const breakName = input.nextType === SessionType.LongBreak ? "Pausa longa" : "Pausa";
  const minutes = formatMinutes(input.nextDurationMin);
  const tail = input.autoStart
    ? `${breakName} de ${minutes} iniciada.`
    : `Hora da pausa de ${minutes}.`;

  return { title, body: `Pomodoro concluído!\n${tail}` };
}

/** O Android decide som/vibração pelo canal; por isso um canal por combinação. */
export function channelIdFor(preferences: NotificationPreferences): string {
  const sound = preferences.soundEnabled ? "sound" : "mute";
  const vibration = preferences.vibrationEnabled ? "vibrate" : "still";
  return `${CHANNEL_PREFIX}-${sound}-${vibration}`;
}

async function ensureAndroidChannels(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  const Notifications = getNotifications();
  const options = [true, false];

  // Remove canais de versões anteriores (ex.: criados mudos por engano).
  const existing = await Notifications.getNotificationChannelsAsync();
  await Promise.all(
    existing
      .filter(
        (channel) =>
          channel.id.startsWith(BASE_CHANNEL_PREFIX) && !channel.id.startsWith(CHANNEL_PREFIX),
      )
      .map((channel) => Notifications.deleteNotificationChannelAsync(channel.id)),
  );

  await Promise.all(
    options.flatMap((soundEnabled) =>
      options.map((vibrationEnabled) =>
        Notifications.setNotificationChannelAsync(
          channelIdFor({ soundEnabled, vibrationEnabled }),
          {
            name: `Sessões${soundEnabled ? "" : " sem som"}${vibrationEnabled ? "" : " sem vibração"}`,
            importance: Notifications.AndroidImportance.HIGH,
            // Som próprio do app (o padrão do sistema é fraco em alguns aparelhos);
            // `null` silencia o canal.
            sound: soundEnabled ? SESSION_SOUND_FILE : null,
            enableVibrate: vibrationEnabled,
            vibrationPattern: vibrationEnabled ? [0, 250, 250, 250] : undefined,
            lightColor: "#2B6E52",
          },
        ),
      ),
    ),
  );
}

export function configureNotificationHandler(): void {
  if (!isNotificationsSupported()) {
    return;
  }

  getNotifications().setNotificationHandler({
    // Em primeiro plano o som é tocado pelo próprio app (expo-audio), então a
    // notificação não toca de novo; em segundo plano quem toca é o canal.
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  if (!isNotificationsSupported()) {
    return "unavailable";
  }

  const permissions = await getNotifications().getPermissionsAsync();
  return permissions.granted ? "granted" : permissions.canAskAgain ? "undetermined" : "denied";
}

export async function setupNotifications(): Promise<NotificationPermissionStatus> {
  if (!isNotificationsSupported()) {
    return "unavailable";
  }

  await ensureAndroidChannels();
  const current = await getNotificationPermissionStatus();
  if (current === "granted") {
    return current;
  }

  const permissions = await getNotifications().requestPermissionsAsync();
  return permissions.granted ? "granted" : permissions.canAskAgain ? "undetermined" : "denied";
}

async function cancelPendingSessionNotifications(): Promise<void> {
  const Notifications = getNotifications();
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    pending
      .filter((item) => item.identifier.startsWith(SESSION_NOTIFICATION_ID))
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
}

export async function cancelSessionEndNotification(): Promise<void> {
  if (!isNotificationsSupported()) {
    return;
  }

  await cancelPendingSessionNotifications();
}

/**
 * Agenda uma notificação para o fim de cada sessão informada (a atual e, com o
 * início automático, as seguintes), substituindo as que já estavam agendadas.
 */
export async function scheduleSessionEndNotifications(
  inputs: SessionEndNotificationInput[],
): Promise<void> {
  if (!isNotificationsSupported()) {
    return;
  }

  const Notifications = getNotifications();
  await cancelPendingSessionNotifications();

  for (const [index, input] of inputs.entries()) {
    const { title, body } = buildNotificationText(input);
    const seconds = Math.max(1, Math.round((input.endsAtMs - input.nowMs) / 1000));

    await Notifications.scheduleNotificationAsync({
      identifier: `${SESSION_NOTIFICATION_ID}-${index}`,
      content: {
        title,
        body,
        sound: input.preferences.soundEnabled ? SESSION_SOUND_FILE : false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        ...(Platform.OS === "android" ? { channelId: channelIdFor(input.preferences) } : {}),
      },
    });
  }
}
