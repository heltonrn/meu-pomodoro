import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';
import { TimerStatus } from '../../types';

interface TimerControlsProps {
  status: TimerStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onSkip: () => void;
}

export function TimerControls({
  status,
  onStart,
  onPause,
  onResume,
  onRestart,
  onSkip,
}: TimerControlsProps): React.JSX.Element {
  const mainLabel =
    status === TimerStatus.Running
      ? 'Pausar'
      : status === TimerStatus.Paused
        ? 'Continuar'
        : 'Iniciar';

  const mainIcon: keyof typeof Ionicons.glyphMap =
    status === TimerStatus.Running ? 'pause' : 'play';

  const handleMainPress = (): void => {
    if (status === TimerStatus.Running) {
      onPause();
    } else if (status === TimerStatus.Paused) {
      onResume();
    } else {
      onStart();
    }
  };

  return (
    <View style={styles.row}>
      <Pressable
        style={styles.sideButton}
        onPress={onRestart}
        accessibilityLabel="Reiniciar sessão"
      >
        <Ionicons name="refresh" size={20} color={colors.forestDark} />
      </Pressable>

      <Pressable style={styles.mainButton} onPress={handleMainPress}>
        <Ionicons name={mainIcon} size={18} color={colors.paper} />
        <Text style={styles.mainLabel}>{mainLabel}</Text>
      </Pressable>

      <Pressable
        style={styles.sideButton}
        onPress={onSkip}
        accessibilityLabel="Pular sessão"
      >
        <Ionicons name="play-skip-forward" size={20} color={colors.forestDark} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  mainButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.forest,
    paddingVertical: 15,
    borderRadius: 12,
  },
  mainLabel: {
    color: colors.paper,
    fontSize: 15,
    fontWeight: '600',
  },
  sideButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.forestLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
