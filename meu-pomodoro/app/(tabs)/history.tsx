import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import { AppHeader } from "@/components/AppHeader";
import { ScreenContainer } from "@/components/screen-container";
import { SessionItem } from "@/components/SessionItem";
import { StatCard } from "@/components/StatCard";
import { cn } from "@/lib/utils";
import { useHistory } from "@/hooks/use-history";
import { usePomodoroStore } from "@/src/store/pomodoroStore";
import { formatDurationMinutes, startOfToday, startOfWeek } from "@/src/utils/time";

type Period = "today" | "week";

/**
 * Histórico e estatísticas (requisitos 13 e 14), lidos do SQLite.
 */
export default function HistoryScreen() {
  const [period, setPeriod] = useState<Period>("today");
  // Recarrega quando novas sessões são registradas ou o histórico é limpo.
  const historyVersion = usePomodoroStore((state) => state.historyVersion);

  const from = period === "today" ? startOfToday() : startOfWeek();
  const { status, error, sessions, stats } = useHistory(from, historyVersion);

  return (
    <ScreenContainer>
      <AppHeader title="📊 Histórico" />

      <View className="flex-1 px-4">
        <View className="mb-3.5 flex-row rounded-xl border border-border bg-surface p-1">
          <PeriodTab active={period === "today"} label="Hoje" onPress={() => setPeriod("today")} />
          <PeriodTab active={period === "week"} label="Semana" onPress={() => setPeriod("week")} />
        </View>

        <View className="mb-3.5 flex-row gap-3">
          <StatCard label="Pomodoros" value={String(stats.completedPomodoros)} />
          <StatCard label="Tempo de foco" value={formatDurationMinutes(stats.focusTimeMs)} />
        </View>

        <FlatList
          contentContainerStyle={{ paddingBottom: 8 }}
          data={sessions}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <Text className="mt-8 text-center text-[13px] leading-5 text-muted">
              {status === "loading"
                ? "Carregando…"
                : status === "error"
                  ? (error ?? "Não foi possível carregar o histórico.")
                  : `Nenhuma sessão registrada ${period === "today" ? "hoje" : "nesta semana"}.\nInicie um Pomodoro para começar!`}
            </Text>
          }
          renderItem={({ item }) => <SessionItem session={item} />}
        />
      </View>
    </ScreenContainer>
  );
}

interface PeriodTabProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function PeriodTab({ label, active, onPress }: PeriodTabProps) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{ flex: 1 }}
    >
      <View className={cn("items-center rounded-[9px] py-2", active && "bg-primary")}>
        <Text className={cn("text-[13px] font-semibold", active ? "text-surface" : "text-muted")}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
