import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { haptic } from "@/lib/haptics";
import { TimerStatus } from "@/src/types";

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
}: TimerControlsProps) {
  const colors = useColors();

  const mainLabel =
    status === TimerStatus.Running ? "Pausar" : status === TimerStatus.Paused ? "Continuar" : "Iniciar";
  const mainIcon: keyof typeof Ionicons.glyphMap = status === TimerStatus.Running ? "pause" : "play";

  function handleMainPress(): void {
    haptic.light();
    if (status === TimerStatus.Running) {
      onPause();
    } else if (status === TimerStatus.Paused) {
      onResume();
    } else {
      onStart();
    }
  }

  return (
    <View className="mt-[18px] flex-row items-center gap-2.5 px-1">
      <Pressable
        accessibilityLabel="Reiniciar sessão"
        accessibilityRole="button"
        onPress={() => {
          haptic.light();
          onRestart();
        }}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <View className="h-[50px] w-[50px] items-center justify-center rounded-xl bg-primary-soft">
          <Ionicons color={colors["primary-strong"]} name="refresh" size={20} />
        </View>
      </Pressable>

      <Pressable
        accessibilityLabel={mainLabel}
        accessibilityRole="button"
        onPress={handleMainPress}
        style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.8 : 1 })}
      >
        <View className="flex-row items-center justify-center gap-2 rounded-xl bg-primary py-[15px]">
          <Ionicons color={colors.surface} name={mainIcon} size={18} />
          <Text className="text-[15px] font-semibold text-surface">{mainLabel}</Text>
        </View>
      </Pressable>

      <Pressable
        accessibilityLabel="Pular sessão"
        accessibilityRole="button"
        onPress={() => {
          haptic.light();
          onSkip();
        }}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <View className="h-[50px] w-[50px] items-center justify-center rounded-xl bg-primary-soft">
          <Ionicons color={colors["primary-strong"]} name="play-skip-forward" size={20} />
        </View>
      </Pressable>
    </View>
  );
}
