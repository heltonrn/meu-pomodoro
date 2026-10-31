import { Text, View } from "react-native";

import { cn } from "@/lib/utils";
import { SessionType } from "@/src/types";

interface SessionChipProps {
  sessionType: SessionType;
}

const LABELS: Record<SessionType, string> = {
  [SessionType.Focus]: "FOCO",
  [SessionType.ShortBreak]: "☕ PAUSA CURTA",
  [SessionType.LongBreak]: "🌿 PAUSA LONGA",
};

export function SessionChip({ sessionType }: SessionChipProps) {
  const isFocus = sessionType === SessionType.Focus;

  return (
    <View
      className={cn(
        "mb-4 self-center rounded-full px-4 py-1.5",
        isFocus ? "bg-tomato-soft" : "bg-primary-soft",
      )}
    >
      <Text
        className={cn(
          "text-xs font-bold tracking-widest",
          isFocus ? "text-tomato" : "text-primary-strong",
        )}
      >
        {LABELS[sessionType]}
      </Text>
    </View>
  );
}
