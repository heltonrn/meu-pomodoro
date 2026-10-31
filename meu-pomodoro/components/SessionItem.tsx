import { Text, View } from "react-native";

import { cn } from "@/lib/utils";
import { SessionType } from "@/src/types";
import type { SessionRecord } from "@/src/types/Session";
import { formatClockTime, formatDurationMinutes } from "@/src/utils/time";

interface SessionItemProps {
  session: SessionRecord;
}

const TYPE_EMOJI: Record<SessionType, string> = {
  [SessionType.Focus]: "🍅",
  [SessionType.ShortBreak]: "☕",
  [SessionType.LongBreak]: "🌿",
};

const TYPE_LABEL: Record<SessionType, string> = {
  [SessionType.Focus]: "Foco",
  [SessionType.ShortBreak]: "Pausa curta",
  [SessionType.LongBreak]: "Pausa longa",
};

export function SessionItem({ session }: SessionItemProps) {
  const isFocus = session.type === SessionType.Focus;
  const title = isFocus && session.task.length > 0 ? session.task : TYPE_LABEL[session.type];

  return (
    <View className="mb-2.5 flex-row items-center gap-3 rounded-[14px] border border-border bg-surface px-3.5 py-3">
      <View
        className={cn(
          "h-[38px] w-[38px] items-center justify-center rounded-xl",
          isFocus ? "bg-tomato-soft" : "bg-primary-soft",
        )}
      >
        <Text className="text-[17px]">{TYPE_EMOJI[session.type]}</Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[13.5px] font-semibold text-foreground" numberOfLines={1}>
          {title}
        </Text>
        <Text className="mt-0.5 text-[11.5px] text-muted">
          {formatClockTime(session.startedAt)} · {formatDurationMinutes(session.duration)}
        </Text>
      </View>
      <View
        className={cn("rounded-full px-[9px] py-1", session.completed ? "bg-primary-soft" : "bg-error-soft")}
      >
        <Text
          className={cn(
            "text-[10.5px] font-semibold",
            session.completed ? "text-primary-strong" : "text-error",
          )}
        >
          {session.completed ? "Concluído" : "Pulado"}
        </Text>
      </View>
    </View>
  );
}
