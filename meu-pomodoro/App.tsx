import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initDatabase } from './src/services/database/db';
import { setupNotifications } from './src/services/notifications/notifications';
import { usePomodoroStore } from './src/store/pomodoroStore';
import { useSettingsStore } from './src/store/settingsStore';

export default function App(): React.JSX.Element | null {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Ordem importa: banco → configurações → estado do cronômetro.
    initDatabase();
    useSettingsStore.getState().hydrate();
    usePomodoroStore.getState().hydrate();
    setReady(true);
    void setupNotifications();
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
