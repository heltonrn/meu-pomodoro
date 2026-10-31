import type { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";

import { PrimaryButton } from "@/components/PrimaryButton";
import { SessionType } from "@/src/types";
import { formatDurationMinutes } from "@/src/utils/time";

interface SessionCompleteProps {
  finishedType: SessionType;
  nextType: SessionType;
  completedInCycle: number;
  completedToday: number;
  focusTimeTodayMs: number;
  onStartNext: () => void;
  onDismiss: () => void;
  /** Espaço opcional abaixo dos botões (ex.: pedido de avaliação). */
  footer?: ReactNode;
}

const NEXT_LABELS: Record<SessionType, string> = {
  [SessionType.Focus]: "Voltar ao foco",
  [SessionType.ShortBreak]: "Iniciar pausa curta",
  [SessionType.LongBreak]: "Iniciar pausa longa",
};

export function SessionComplete({
  finishedType,
  nextType,
  completedInCycle,
  completedToday,
  focusTimeTodayMs,
  onStartNext,
  onDismiss,
  footer,
}: SessionCompleteProps) {
  const wasFocus = finishedType === SessionType.Focus;

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingVertical: 16,
      }}
    >
      <Text className="mb-3.5 text-[52px]">{wasFocus ? "🎉" : "🍅"}</Text>
      <Text className="mb-2 text-center text-2xl font-bold text-primary-strong">
        {wasFocus ? "Pomodoro concluído!" : "Pausa concluída!"}
      </Text>
      <Text className="mb-[22px] text-center text-sm leading-[21px] text-muted">
        {wasFocus
          ? "Você merece um descanso. Levante e alongue um pouco."
          : "Hora de voltar ao foco."}
      </Text>

      <View className="mb-[22px] flex-row justify-around self-stretch rounded-2xl border border-border bg-surface py-4">
        <Stat label="neste ciclo" value={String(completedInCycle)} />
        <Stat label="hoje" value={String(completedToday)} />
        <Stat label="de foco hoje" value={formatDurationMinutes(focusTimeTodayMs)} />
      </View>

      <View className="mb-2.5 self-stretch">
        <PrimaryButton label={NEXT_LABELS[nextType]} onPress={onStartNext} />
      </View>
      <View className="self-stretch">
        <PrimaryButton label="Agora não" onPress={onDismiss} variant="soft" />
      </View>
      {footer !== undefined && footer !== null ? <View className="mt-[18px] self-stretch">{footer}</View> : null}
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="items-center">
      <Text className="text-xl font-bold text-primary-strong">{value}</Text>
      <Text className="mt-0.5 text-[11px] text-muted">{label}</Text>
    </View>
  );
}
