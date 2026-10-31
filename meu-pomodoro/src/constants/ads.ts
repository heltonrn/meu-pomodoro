import { Platform } from "react-native";

/**
 * IDs de teste oficiais do Google: https://developers.google.com/admob/android/test-ads
 * Usados em desenvolvimento (__DEV__). Nunca clique nos próprios anúncios de
 * produção durante testes.
 */
const TEST_BANNER_AD_UNIT_ID = Platform.select({
  android: "ca-app-pub-3940256099942544/6300978111",
  ios: "ca-app-pub-3940256099942544/2934735716",
  default: "",
});

/** Bloco de banner "Meu Pomodoro" criado no AdMob (https://apps.admob.com). */
const PRODUCTION_BANNER_AD_UNIT_ID = Platform.select({
  android: "ca-app-pub-7069995647129253/8160494335",
  // iOS ainda não tem bloco de anúncio criado no AdMob.
  ios: "",
  default: "",
});

/**
 * Quem decide entre anúncio de teste e real é EXPO_PUBLIC_ADS_ENV (mesmo padrão
 * do Minha Bíblia): só "production" usa os IDs reais. `__DEV__` sozinho não
 * basta, porque é false em qualquer AAB/APK de release, inclusive no do teste
 * fechado. Sem a variável, o padrão é seguro (teste). É lida em tempo de
 * bundle: o scripts/build-aab-local.ps1 define o valor antes do Gradle.
 */
const USE_TEST_ADS = __DEV__ || process.env.EXPO_PUBLIC_ADS_ENV !== "production";

export function getBannerAdUnitId(): string {
  if (USE_TEST_ADS || !PRODUCTION_BANNER_AD_UNIT_ID) {
    return TEST_BANNER_AD_UNIT_ID ?? "";
  }

  return PRODUCTION_BANNER_AD_UNIT_ID;
}
