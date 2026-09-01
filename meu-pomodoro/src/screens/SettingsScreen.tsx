import React from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdSlot } from '../components/AdSlot/AdSlot';
import { Stepper } from '../components/Stepper/Stepper';
import { SETTINGS_RANGES } from '../constants/defaults';
import { colors } from '../constants/theme';
import { clearSessions } from '../services/database/db';
import { usePomodoroStore } from '../store/pomodoroStore';
import { useSettingsStore } from '../store/settingsStore';
import { Settings } from '../types';

/**
 * Fase 3 — configurações editáveis (requisitos 5, 6 e 20), organizadas nos
 * grupos Tempos, Comportamento e Dados. Persistidas via SQLite (Regra 8).
 *
 * Regra 9: alterar valores aqui não afeta a sessão em andamento, porque a
 * duração de cada sessão é capturada no momento do start.
 */
export function SettingsScreen(): React.JSX.Element {
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const resetToDefaults = useSettingsStore((state) => state.resetToDefaults);
  const notifyHistoryCleared = usePomodoroStore((state) => state.notifyHistoryCleared);

  const confirmClearHistory = (): void => {
    Alert.alert(
      'Limpar histórico',
      'Todas as sessões registradas serão excluídas. Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            clearSessions();
            notifyHistoryCleared();
          },
        },
      ],
    );
  };

  const confirmResetDefaults = (): void => {
    Alert.alert(
      'Restaurar padrões',
      'As configurações voltarão aos valores padrão (25/5/15, 4 Pomodoros).',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Restaurar', onPress: resetToDefaults },
      ],
    );
  };

  const toggle = (key: keyof Pick<
    Settings,
    'autoStart' | 'soundEnabled' | 'vibrationEnabled' | 'keepScreenAwake'
  >) => (value: boolean) => updateSettings({ [key]: value });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Text style={styles.appTitle}>⚙️ Configurações</Text>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tempos</Text>
          <SettingRow label="Foco">
            <Stepper
              value={settings.focusDurationMin}
              min={SETTINGS_RANGES.focusDurationMin.min}
              max={SETTINGS_RANGES.focusDurationMin.max}
              suffix="min"
              onChange={(value) => updateSettings({ focusDurationMin: value })}
            />
          </SettingRow>
          <SettingRow label="Pausa curta">
            <Stepper
              value={settings.shortBreakDurationMin}
              min={SETTINGS_RANGES.shortBreakDurationMin.min}
              max={SETTINGS_RANGES.shortBreakDurationMin.max}
              suffix="min"
              onChange={(value) => updateSettings({ shortBreakDurationMin: value })}
            />
          </SettingRow>
          <SettingRow label="Pausa longa">
            <Stepper
              value={settings.longBreakDurationMin}
              min={SETTINGS_RANGES.longBreakDurationMin.min}
              max={SETTINGS_RANGES.longBreakDurationMin.max}
              suffix="min"
              onChange={(value) => updateSettings({ longBreakDurationMin: value })}
            />
          </SettingRow>
          <SettingRow label="Pomodoros por ciclo">
            <Stepper
              value={settings.pomodorosPerCycle}
              min={SETTINGS_RANGES.pomodorosPerCycle.min}
              max={SETTINGS_RANGES.pomodorosPerCycle.max}
              onChange={(value) => updateSettings({ pomodorosPerCycle: value })}
            />
          </SettingRow>
          <Text style={styles.cardHint}>
            Alterações valem a partir da próxima sessão.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Comportamento</Text>
          <SettingRow
            label="Início automático"
            sublabel="Começa a próxima sessão sozinho"
          >
            <Switch
              value={settings.autoStart}
              onValueChange={toggle('autoStart')}
              trackColor={{ true: colors.forest, false: colors.line }}
            />
          </SettingRow>
          <SettingRow label="Som" sublabel="Toca ao finalizar uma sessão">
            <Switch
              value={settings.soundEnabled}
              onValueChange={toggle('soundEnabled')}
              trackColor={{ true: colors.forest, false: colors.line }}
            />
          </SettingRow>
          <SettingRow label="Vibração" sublabel="Vibra ao finalizar uma sessão">
            <Switch
              value={settings.vibrationEnabled}
              onValueChange={toggle('vibrationEnabled')}
              trackColor={{ true: colors.forest, false: colors.line }}
            />
          </SettingRow>
          <SettingRow
            label="Manter tela ligada"
            sublabel="Enquanto o cronômetro estiver ativo"
          >
            <Switch
              value={settings.keepScreenAwake}
              onValueChange={toggle('keepScreenAwake')}
              trackColor={{ true: colors.forest, false: colors.line }}
            />
          </SettingRow>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dados</Text>
          <Text style={styles.dangerButton} onPress={confirmClearHistory}>
            Limpar histórico
          </Text>
          <Text style={styles.ghostButton} onPress={confirmResetDefaults}>
            Restaurar padrões
          </Text>
        </View>
      </ScrollView>

      <AdSlot />
    </SafeAreaView>
  );
}

interface SettingRowProps {
  label: string;
  sublabel?: string;
  children: React.ReactNode;
}

function SettingRow({ label, sublabel, children }: SettingRowProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sublabel !== undefined && <Text style={styles.rowSublabel}>{sublabel}</Text>}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  appTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.forestDark,
    textAlign: 'center',
    paddingVertical: 10,
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 16 },
  card: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.forestDark,
    marginBottom: 6,
  },
  cardHint: { fontSize: 11.5, color: colors.inkSoft, marginTop: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    gap: 12,
  },
  rowText: { flex: 1, minWidth: 0 },
  rowLabel: { fontSize: 14, fontWeight: '500', color: colors.ink },
  rowSublabel: { fontSize: 11.5, color: colors.inkSoft, marginTop: 2 },
  dangerButton: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: colors.plum,
    backgroundColor: colors.plumLight,
    borderRadius: 12,
    paddingVertical: 13,
    marginBottom: 10,
    overflow: 'hidden',
  },
  ghostButton: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: colors.forestDark,
    backgroundColor: colors.forestLight,
    borderRadius: 12,
    paddingVertical: 13,
    overflow: 'hidden',
  },
});
