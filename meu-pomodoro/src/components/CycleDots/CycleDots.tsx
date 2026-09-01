import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../constants/theme';

interface CycleDotsProps {
  total: number;
  completed: number;
  /** Índice 1-based do Pomodoro atual; null quando nenhum está ativo. */
  current: number | null;
}

export function CycleDots({ total, completed, current }: CycleDotsProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, index) => {
        const position = index + 1;
        const isDone = position <= completed;
        const isCurrent = current !== null && position === current && !isDone;
        return (
          <View
            key={position}
            style={[styles.dot, isDone && styles.done, isCurrent && styles.current]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 6,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.line,
  },
  done: {
    backgroundColor: colors.tomato,
  },
  current: {
    backgroundColor: colors.paper,
    borderWidth: 3,
    borderColor: colors.tomato,
  },
});
