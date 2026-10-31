import type { ReactNode } from "react";
import { useState } from "react";
import { ScrollView, Switch, Text, View } from "react-native";

import { AppHeader } from "@/components/AppHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FeedbackSheet } from "@/components/ReviewSheets";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenContainer } from "@/components/screen-container";
import { Stepper } from "@/components/Stepper";
import { useColors } from "@/hooks/use-colors";
import { SETTINGS_RANGES } from "@/src/constants/defaults";
import type { FeedbackCategory } from "@/src/services/ReviewPolicy";
import { openStorePage, sendFeedbackEmail } from "@/src/services/ReviewService";
import { usePomodoroStore } from "@/src/store/pomodoroStore";
import { useSettingsStore } from "@/src/store/settingsStore";
import type { SettingsValues } from "@/src/types/Settings";

type ToggleKey = "autoStart" | "soundEnabled" | "vibrationEnabled" | "keepScreenAwake";
type PendingAction = "clear-history" | "reset-defaults" | null;

/**
 * Configurações (requisitos 5, 6 e 20) nos grupos Tempos, Comportamento e
 * Dados. Persistidas no SQLite (Regra 8).
 *
 * Regra 9: alterar valores aqui não afeta a sessão em andamento, porque a
 * duração de cada sessão é capturada no momento do start.
 */
export default function SettingsScreen() {
  const colors = useColors();
  const settings: SettingsValues = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const resetToDefaults = useSettingsStore((state) => state.resetToDefaults);
  const clearHistory = usePomodoroStore((state) => state.clearHistory);
  const [pending, setPending] = useState<PendingAction>(null);
  const [showFeedbackSheet, setShowFeedbackSheet] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleOpenStore(): Promise<void> {
    try {
      await openStorePage();
    } catch {
      setNotice("Não foi possível abrir a loja agora.");
    }
  }

  async function handleSendFeedback(category: FeedbackCategory, message: string): Promise<void> {
    await sendFeedbackEmail(category, message);
    setShowFeedbackSheet(false);
    setNotice("Obrigado pela sugestão!");
  }

  const toggle = (key: ToggleKey) => (value: boolean) => updateSettings({ [key]: value });

  function confirmPending(): void {
    if (pending === "clear-history") {
      void clearHistory();
    } else if (pending === "reset-defaults") {
      resetToDefaults();
    }
    setPending(null);
  }

  const switchColors = { true: colors.primary, false: colors.border };

  return (
    <ScreenContainer>
      <AppHeader title="⚙️ Configurações" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <Card title="Tempos">
          <SettingRow label="Foco">
            <Stepper
              label="foco"
              max={SETTINGS_RANGES.focusDurationMin.max}
              min={SETTINGS_RANGES.focusDurationMin.min}
              onChange={(value) => updateSettings({ focusDurationMin: value })}
              suffix="min"
              value={settings.focusDurationMin}
            />
          </SettingRow>
          <SettingRow label="Pausa curta">
            <Stepper
              label="pausa curta"
              max={SETTINGS_RANGES.shortBreakDurationMin.max}
              min={SETTINGS_RANGES.shortBreakDurationMin.min}
              onChange={(value) => updateSettings({ shortBreakDurationMin: value })}
              suffix="min"
              value={settings.shortBreakDurationMin}
            />
          </SettingRow>
          <SettingRow label="Pausa longa">
            <Stepper
              label="pausa longa"
              max={SETTINGS_RANGES.longBreakDurationMin.max}
              min={SETTINGS_RANGES.longBreakDurationMin.min}
              onChange={(value) => updateSettings({ longBreakDurationMin: value })}
              suffix="min"
              value={settings.longBreakDurationMin}
            />
          </SettingRow>
          <SettingRow label="Pomodoros por ciclo">
            <Stepper
              label="Pomodoros por ciclo"
              max={SETTINGS_RANGES.pomodorosPerCycle.max}
              min={SETTINGS_RANGES.pomodorosPerCycle.min}
              onChange={(value) => updateSettings({ pomodorosPerCycle: value })}
              value={settings.pomodorosPerCycle}
            />
          </SettingRow>
          <Text className="mt-2 text-[11.5px] text-muted">Alterações valem a partir da próxima sessão.</Text>
        </Card>

        <Card title="Comportamento">
          <SettingRow label="Início automático" sublabel="Começa a próxima sessão sozinho">
            <Switch
              accessibilityLabel="Início automático"
              onValueChange={toggle("autoStart")}
              trackColor={switchColors}
              value={settings.autoStart}
            />
          </SettingRow>
          <SettingRow label="Som" sublabel="Toca ao finalizar uma sessão">
            <Switch
              accessibilityLabel="Som"
              onValueChange={toggle("soundEnabled")}
              trackColor={switchColors}
              value={settings.soundEnabled}
            />
          </SettingRow>
          <SettingRow label="Vibração" sublabel="Vibra ao finalizar uma sessão">
            <Switch
              accessibilityLabel="Vibração"
              onValueChange={toggle("vibrationEnabled")}
              trackColor={switchColors}
              value={settings.vibrationEnabled}
            />
          </SettingRow>
          <SettingRow label="Manter tela ligada" sublabel="Enquanto o cronômetro estiver ativo">
            <Switch
              accessibilityLabel="Manter tela ligada"
              onValueChange={toggle("keepScreenAwake")}
              trackColor={switchColors}
              value={settings.keepScreenAwake}
            />
          </SettingRow>
        </Card>

        <Card title="Sobre o app">
          <View className="gap-2.5 pt-1.5">
            <PrimaryButton icon="star-outline" label="Avaliar o Meu Pomodoro" onPress={() => void handleOpenStore()} variant="soft" />
            <PrimaryButton icon="mail-outline" label="Enviar sugestão" onPress={() => setShowFeedbackSheet(true)} variant="soft" />
          </View>
          {notice !== null ? <Text className="mt-2 text-[11.5px] text-muted">{notice}</Text> : null}
        </Card>

        <Card title="Dados">
          <View className="gap-2.5 pt-1.5">
            <PrimaryButton label="Limpar histórico" onPress={() => setPending("clear-history")} variant="danger" />
            <PrimaryButton label="Restaurar padrões" onPress={() => setPending("reset-defaults")} variant="soft" />
          </View>
        </Card>
      </ScrollView>

      <FeedbackSheet
        onCancel={() => setShowFeedbackSheet(false)}
        onSend={handleSendFeedback}
        visible={showFeedbackSheet}
      />
      <ConfirmDialog
        confirmLabel={pending === "clear-history" ? "Excluir" : "Restaurar"}
        destructive={pending === "clear-history"}
        message={
          pending === "clear-history"
            ? "Todas as sessões registradas serão excluídas. Essa ação não pode ser desfeita."
            : "As configurações voltarão aos valores padrão (25/5/15 minutos, 4 Pomodoros)."
        }
        onCancel={() => setPending(null)}
        onConfirm={confirmPending}
        title={pending === "clear-history" ? "Limpar histórico" : "Restaurar padrões"}
        visible={pending !== null}
      />
    </ScreenContainer>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mb-3.5 rounded-2xl border border-border bg-surface p-4">
      <Text className="mb-1.5 text-sm font-bold text-primary-strong">{title}</Text>
      {children}
    </View>
  );
}

interface SettingRowProps {
  label: string;
  sublabel?: string;
  children: ReactNode;
}

function SettingRow({ label, sublabel, children }: SettingRowProps) {
  return (
    <View className="flex-row items-center justify-between gap-3 border-t border-border py-[9px]">
      <View className="min-w-0 flex-1">
        <Text className="text-sm font-medium text-foreground">{label}</Text>
        {sublabel !== undefined ? <Text className="mt-0.5 text-[11.5px] text-muted">{sublabel}</Text> : null}
      </View>
      {children}
    </View>
  );
}
