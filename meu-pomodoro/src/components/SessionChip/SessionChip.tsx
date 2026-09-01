import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';
import { SessionType } from '../../types';

interface SessionChipProps {
  sessionType: SessionType;
}

const LABELS: Record<SessionType, string> = {
  [SessionType.Focus]: 'FOCO',
  [SessionType.ShortBreak]: '☕ PAUSA CURTA',
  [SessionType.LongBreak]: '🌿 PAUSA LONGA',
};

export function SessionChip({ sessionType }: SessionChipProps): React.JSX.Element {
  const isFocus = sessionType === SessionType.Focus;
  return (
    <View style={[styles.chip, isFocus ? styles.focusChip : styles.breakChip]}>
      <Text style={[styles.label, isFocus ? styles.focusLabel : styles.breakLabel]}>
        {LABELS[sessionType]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  focusChip: { backgroundColor: colors.tomatoLight },
  breakChip: { backgroundColor: colors.forestLight },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  focusLabel: { color: colors.tomato },
  breakLabel: { color: colors.forestDark },
});
