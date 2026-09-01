import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../../constants/theme';

interface TaskInputProps {
  value: string;
  editable: boolean;
  onChange: (value: string) => void;
}

/**
 * Requisito 12: tarefa opcional informada antes de iniciar o Pomodoro.
 * Enquanto a sessão roda, vira uma etiqueta somente leitura.
 */
export function TaskInput({ value, editable, onChange }: TaskInputProps): React.JSX.Element {
  if (!editable) {
    return (
      <View style={styles.pill}>
        <Text style={styles.pillText} numberOfLines={1}>
          {value.length > 0 ? `Tarefa: ${value}` : 'Sem tarefa definida'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>O que você vai fazer?</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder="Ex.: Estudar Banco de Dados"
        placeholderTextColor={colors.inkSoft}
        maxLength={80}
        returnKeyType="done"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    borderStyle: 'dashed',
  },
  label: {
    fontSize: 12,
    color: colors.inkSoft,
    marginBottom: 6,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.mustardLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'center',
  },
  pill: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    borderStyle: 'dashed',
  },
  pillText: {
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'center',
  },
});
