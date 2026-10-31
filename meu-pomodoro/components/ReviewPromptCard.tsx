import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { haptic } from "@/lib/haptics";

interface ReviewPromptCardProps {
  onYes: () => void;
  onImprove: () => void;
  onLater: () => void;
}

/**
 * Pedido de avaliação em duas etapas: primeiro pergunta se o usuário está
 * gostando; só quem responde "sim" é convidado a avaliar na loja.
 */
export function ReviewPromptCard({ onYes, onImprove, onLater }: ReviewPromptCardProps) {
  const colors = useColors();

  function press(action: () => void): () => void {
    return () => {
      haptic.light();
      action();
    };
  }

  return (
    <View className="gap-3 rounded-2xl bg-primary-soft p-4">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Ionicons color={colors.surface} name="star" size={22} />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-[17px] font-bold leading-[22px] text-primary-strong">
            Mais um Pomodoro no bolso!
          </Text>
          <Text className="text-sm leading-5 text-foreground">Está gostando do Meu Pomodoro?</Text>
        </View>
      </View>

      <View className="flex-row gap-2">
        <Pressable
          accessibilityRole="button"
          onPress={press(onYes)}
          style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.7 : 1 })}
        >
          <View className="min-h-11 items-center justify-center rounded-xl bg-primary">
            <Text className="text-sm font-semibold text-surface">Sim, estou!</Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={press(onImprove)}
          style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.7 : 1 })}
        >
          <View className="min-h-11 items-center justify-center rounded-xl border border-primary bg-surface">
            <Text className="text-sm font-semibold text-primary-strong">Pode melhorar</Text>
          </View>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={press(onLater)}
        style={({ pressed }) => ({ alignSelf: "center", opacity: pressed ? 0.7 : 1 })}
      >
        <View className="min-h-11 justify-center px-4">
          <Text className="text-[13px] font-medium text-muted underline">Agora não</Text>
        </View>
      </Pressable>
    </View>
  );
}
