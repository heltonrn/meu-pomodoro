import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { colors } from '../constants/theme';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TimerScreen } from '../screens/TimerScreen';

export type RootTabParamList = {
  Pomodoro: undefined;
  Historico: undefined;
  Configuracoes: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_ICONS: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Pomodoro: 'timer-outline',
  Historico: 'stats-chart-outline',
  Configuracoes: 'settings-outline',
};

export function AppNavigator(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.forestDark,
          tabBarInactiveTintColor: colors.inkSoft,
          tabBarStyle: {
            backgroundColor: colors.paper,
            borderTopColor: colors.line,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
          ),
        })}
      >
        <Tab.Screen name="Pomodoro" component={TimerScreen} />
        <Tab.Screen
          name="Historico"
          component={HistoryScreen}
          options={{ title: 'Histórico' }}
        />
        <Tab.Screen
          name="Configuracoes"
          component={SettingsScreen}
          options={{ title: 'Configurações' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
