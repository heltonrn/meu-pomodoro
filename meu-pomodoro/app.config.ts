import type { ExpoConfig } from "expo/config";

const BUNDLE_ID = "br.com.volvet.meupomodoro";

const config: ExpoConfig = {
  name: "Meu Pomodoro",
  slug: "meu-pomodoro",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "meupomodoro",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: false,
    bundleIdentifier: BUNDLE_ID,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#FAF6EE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      // Ícone temático do Android 13+ (silhueta tingida pelo sistema).
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    // ATENÇÃO: depois do primeiro envio à Play Store o pacote nunca mais pode mudar.
    package: BUNDLE_ID,
    // Precisa ser MAIOR que o último versionCode já enviado à Play Console.
    versionCode: 1,
    permissions: ["POST_NOTIFICATIONS", "VIBRATE"],
    // Permissões não usadas pelo app (evitam declaração/reprovação na Play).
    blockedPermissions: [
      "android.permission.SCHEDULE_EXACT_ALARM",
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "./plugins/withReleaseSigning",
    "expo-router",
    "expo-font",
    "expo-sqlite",
    "expo-status-bar",
    [
      "expo-notifications",
      {
        color: "#2B6E52",
        defaultChannel: "pomodoro-sessions-v3-sound-vibrate",
        sounds: ["./assets/sounds/chime.wav"],
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#FAF6EE",
        dark: {
          backgroundColor: "#1D2521",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
          minSdkVersion: 24,
        },
      },
    ],
    [
      "react-native-google-mobile-ads",
      {
        // ID do app "Meu Pomodoro" no AdMob (https://apps.admob.com).
        androidAppId: "ca-app-pub-7069995647129253~4190756903",
        // iOS ainda não tem app criado no AdMob: mantém o ID de teste do
        // Google até criar o app de verdade para iOS.
        iosAppId: "ca-app-pub-3940256099942544~1458002511",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
