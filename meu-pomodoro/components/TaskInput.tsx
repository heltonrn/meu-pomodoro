import { Text, TextInput, View } from "react-native";

import { useColors } from "@/hooks/use-colors";

interface TaskInputProps {
  value: string;
  editable: boolean;
  onChange: (value: string) => void;
}

/**
 * Requisito 12: tarefa opcional informada antes de iniciar o Pomodoro.
 * Enquanto a sessão roda, vira uma etiqueta somente leitura.
 */
export function TaskInput({ value, editable, onChange }: TaskInputProps) {
  const colors = useColors();

  if (!editable) {
    return (
      <View className="mt-3.5 border-t border-dashed border-border pt-3.5">
        <Text className="text-center text-[13px] text-muted" numberOfLines={1}>
          {value.length > 0 ? `Tarefa: ${value}` : "Sem tarefa definida"}
        </Text>
      </View>
    );
  }

  return (
    <View className="mt-3.5 border-t border-dashed border-border pt-3.5">
      <Text className="mb-1.5 text-center text-xs text-muted">O que você vai fazer?</Text>
      <TextInput
        accessibilityLabel="Tarefa do Pomodoro"
        className="rounded-xl bg-warning-soft px-3.5 py-2.5 text-center text-sm text-foreground"
        maxLength={80}
        onChangeText={onChange}
        placeholder="Ex.: Estudar Banco de Dados"
        placeholderTextColor={colors.muted}
        returnKeyType="done"
        value={value}
      />
    </View>
  );
}
