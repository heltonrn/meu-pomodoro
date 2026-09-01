import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';
import { SessionType } from '../../types';

interface SessionCompleteProps {
  finishedType: SessionType;
  nextType: SessionType;
  completedInCycle: number;
  completedToday: number;
  onStartNext: () => void;
  onDismiss: () => void;
}

const NEXT_LABELS: Record<SessionType, string> = {
  [SessionType.Focus]: 'Voltar ao foco',
  [SessionType.ShortBreak]: '☕ Iniciar pausa curta',
  [SessionType.LongBreak]: '🌿 Iniciar pausa longa',
};

export function SessionComplete({
  finishedType,
  nextType,
  completedInCycle,
  completedToday,
  onStartNext,
  onDismiss,
}: SessionCompleteProps): React.JSX.Element {
  const wasFocus = finishedType === SessionType.Focus;

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{wasFocus ? '🎉' : '🍅'}</Text>
      <Text style={styles.title}>
        {wasFocus ? 'Pomodoro concluído!' : 'Pausa concluída!'}
      </Text>
      <Text style={styles.subtitle}>
        {wasFocus
          ? 'Você merece um descanso. Levante e alongue um pouco.'
          : 'Hora de voltar ao foco.'}
      </Text>

      <View style={styles.statsCard}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{completedInCycle}</Text>
          <Text style={styles.statLabel}>neste ciclo</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{completedToday}</Text>
          <Text style={styles.statLabel}>hoje</Text>
        </View>
      </View>

      <Pressable style={styles.nextButton} onPress={onStartNext}>
        <Text style={styles.nextLabel}>{NEXT_LABELS[nextType]}</Text>
      </Pressable>
      <Pressable style={styles.laterButton} onPress={onDismiss}>
        <Text style={styles.laterLabel}>agora não</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emoji: {
    fontSize: 52,
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.forestDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 22,
  },
  statsCard: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'space-around',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 22,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.forestDark,
  },
  statLabel: {
    fontSize: 11,
    color: colors.inkSoft,
    marginTop: 2,
  },
  nextButton: {
    alignSelf: 'stretch',
    backgroundColor: colors.forest,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  nextLabel: {
    color: colors.paper,
    fontSize: 15,
    fontWeight: '600',
  },
  laterButton: {
    padding: 8,
  },
  laterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkSoft,
  },
});
