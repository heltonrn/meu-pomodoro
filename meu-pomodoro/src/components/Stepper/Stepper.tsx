import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';

interface StepperProps {
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onChange: (value: number) => void;
}

export function Stepper({ value, min, max, suffix, onChange }: StepperProps): React.JSX.Element {
  const decrease = (): void => {
    if (value > min) {
      onChange(value - 1);
    }
  };
  const increase = (): void => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <View style={styles.row}>
      <Pressable
        style={[styles.button, value <= min && styles.disabled]}
        onPress={decrease}
        accessibilityLabel="Diminuir"
      >
        <Text style={styles.buttonLabel}>−</Text>
      </Pressable>
      <Text style={styles.value}>
        {value}
        {suffix !== undefined ? ` ${suffix}` : ''}
      </Text>
      <Pressable
        style={[styles.button, value >= max && styles.disabled]}
        onPress={increase}
        accessibilityLabel="Aumentar"
      >
        <Text style={styles.buttonLabel}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  button: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.forestLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: { opacity: 0.35 },
  buttonLabel: { fontSize: 17, fontWeight: '700', color: colors.forestDark },
  value: {
    minWidth: 62,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: colors.forestDark,
    fontVariant: ['tabular-nums'],
  },
});
