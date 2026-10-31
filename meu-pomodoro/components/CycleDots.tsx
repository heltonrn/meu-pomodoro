import { View } from "react-native";

import { cn } from "@/lib/utils";

interface CycleDotsProps {
  total: number;
  completed: number;
  /** Índice 1-based do Pomodoro atual; null quando nenhum está ativo. */
  current: number | null;
}

export function CycleDots({ total, completed, current }: CycleDotsProps) {
  return (
    <View accessible accessibilityLabel={`${completed} de ${total} Pomodoros concluídos`} className="mb-1.5 flex-row justify-center gap-2.5">
      {Array.from({ length: total }, (_, index) => {
        const position = index + 1;
        const isDone = position <= completed;
        const isCurrent = current !== null && position === current && !isDone;

        return (
          <View
            className={cn(
              "h-3 w-3 rounded-full",
              isDone && "bg-tomato",
              isCurrent && "border-[3px] border-tomato bg-surface",
              !isDone && !isCurrent && "bg-border",
            )}
            key={position}
          />
        );
      })}
    </View>
  );
}
