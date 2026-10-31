import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AdBanner } from "@/components/AdBanner";
import { ErrorNotice } from "@/components/ErrorNotice";
import { useColors } from "@/hooks/use-colors";
import { usePomodoroTimer } from "@/hooks/use-pomodoro-timer";
import { haptic } from "@/lib/haptics";
import { usePomodoroStore } from "@/src/store/pomodoroStore";
import { useSettingsStore } from "@/src/store/settingsStore";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  // O banner reserva a área de segurança do sistema; a barra de abas usa um respiro fixo.
  const bottomPadding = 8;
  const tabBarHeight = 56 + bottomPadding;

  // O cronômetro vive aqui para continuar sincronizado em qualquer aba.
  usePomodoroTimer();

  const timerError = usePomodoroStore((state) => state.error);
  const clearTimerError = usePomodoroStore((state) => state.clearError);
  const settingsError = useSettingsStore((state) => state.error);
  const clearSettingsError = useSettingsStore((state) => state.clearError);

  const errorMessage = timerError ?? settingsError;
  const dismissError = (): void => {
    clearTimerError();
    clearSettingsError();
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Tabs
          screenListeners={{ tabPress: () => haptic.selection() }}
          screenOptions={{
            tabBarActiveTintColor: colors.tint,
            tabBarInactiveTintColor: colors.muted,
            headerShown: false,
            tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
            tabBarStyle: {
              paddingTop: 8,
              paddingBottom: bottomPadding,
              height: tabBarHeight,
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              borderTopWidth: 0.5,
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Pomodoro",
              tabBarIcon: ({ color }) => <Ionicons color={color} name="timer-outline" size={26} />,
            }}
          />
          <Tabs.Screen
            name="history"
            options={{
              title: "Histórico",
              tabBarIcon: ({ color }) => <Ionicons color={color} name="stats-chart-outline" size={26} />,
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: "Configurações",
              tabBarIcon: ({ color }) => <Ionicons color={color} name="settings-outline" size={26} />,
            }}
          />
        </Tabs>
        {errorMessage !== null ? (
          <View style={{ position: "absolute", left: 0, right: 0, top: insets.top + 4 }}>
            <ErrorNotice message={errorMessage} onDismiss={dismissError} />
          </View>
        ) : null}
      </View>
      <AdBanner bottomInset={insets.bottom} />
    </View>
  );
}
