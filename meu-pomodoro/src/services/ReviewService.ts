import Constants from "expo-constants";
import * as StoreReview from "expo-store-review";
import { Linking, Platform } from "react-native";

import { buildFeedbackMailtoUrl } from "./ReviewPolicy";
import type { FeedbackCategory } from "./ReviewPolicy";

const ANDROID_PACKAGE = "br.com.volvet.meupomodoro";

async function openStorePageUrl(): Promise<void> {
  const url =
    StoreReview.storeUrl() ??
    (Platform.OS === "android" ? `market://details?id=${ANDROID_PACKAGE}` : null);

  if (!url) {
    throw new Error("Link da loja indisponível.");
  }

  await Linking.openURL(url);
}

/**
 * Abre o diálogo nativo de avaliação. Se o sistema não oferecer (ou limitar)
 * o diálogo, cai para a página do app na loja.
 */
export async function requestStoreReview(): Promise<void> {
  try {
    if (await StoreReview.isAvailableAsync()) {
      await StoreReview.requestReview();
      return;
    }
  } catch {
    // segue para o fallback da página da loja
  }

  await openStorePageUrl();
}

/** Abre direto a página do app na loja (item permanente das Configurações). */
export async function openStorePage(): Promise<void> {
  await openStorePageUrl();
}

export async function sendFeedbackEmail(category: FeedbackCategory, message: string): Promise<void> {
  const url = buildFeedbackMailtoUrl({
    category,
    message,
    appVersion: Constants.expoConfig?.version ?? "desconhecida",
    platform: Platform.OS,
    osVersion: String(Platform.Version),
  });

  await Linking.openURL(url);
}
