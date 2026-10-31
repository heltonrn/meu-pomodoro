import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from "react-native";

import { PrimaryButton } from "@/components/PrimaryButton";
import { useColors } from "@/hooks/use-colors";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { FEEDBACK_CATEGORIES, REVIEW_FEEDBACK_EMAIL } from "@/src/services/ReviewPolicy";
import type { FeedbackCategory } from "@/src/services/ReviewPolicy";

interface SheetShellProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function SheetShell({ visible, onClose, children }: SheetShellProps) {
  return (
    <Modal accessibilityViewIsModal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end bg-black/45"
      >
        <View className="gap-3 rounded-t-3xl bg-background p-6 pb-8">{children}</View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function TextAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <View className="min-h-11 items-center justify-center">
        <Text className="text-sm font-medium text-muted">{label}</Text>
      </View>
    </Pressable>
  );
}

interface StoreReviewSheetProps {
  visible: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

/** Convite exibido a quem respondeu "Sim, estou!" no cartão. */
export function StoreReviewSheet({ visible, onConfirm, onDismiss }: StoreReviewSheetProps) {
  const colors = useColors();

  return (
    <SheetShell onClose={onDismiss} visible={visible}>
      <View className="items-center gap-3">
        <View className="h-16 w-16 items-center justify-center rounded-[20px] bg-primary-soft">
          <Text className="text-[34px]">🍅</Text>
        </View>
        <Text className="text-center text-2xl font-bold text-primary-strong">Que bom que você curte!</Text>
        <Text className="text-center text-[15px] leading-[22px] text-foreground">
          Uma avaliação na loja leva menos de um minuto e ajuda o Meu Pomodoro a chegar a mais pessoas.
        </Text>
        <View accessibilityLabel="Cinco estrelas" accessible className="flex-row gap-1.5">
          {[0, 1, 2, 3, 4].map((index) => (
            <Ionicons key={index} color={colors.warning} name="star" size={36} />
          ))}
        </View>
      </View>
      <PrimaryButton label="Avaliar na loja" onPress={onConfirm} />
      <TextAction label="Mais tarde" onPress={onDismiss} />
    </SheetShell>
  );
}

interface FeedbackSheetProps {
  visible: boolean;
  onSend: (category: FeedbackCategory, message: string) => Promise<void>;
  onCancel: () => void;
}

/** Feedback privado enviado por e-mail (sem backend). */
export function FeedbackSheet({ visible, onSend, onCancel }: FeedbackSheetProps) {
  const colors = useColors();
  const [category, setCategory] = useState<FeedbackCategory>(FEEDBACK_CATEGORIES[0]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(): Promise<void> {
    if (message.trim().length === 0) {
      setError("Escreva uma sugestão antes de enviar.");
      return;
    }

    setSending(true);
    setError(null);
    try {
      await onSend(category, message);
      setMessage("");
    } catch {
      setError(`Não foi possível abrir seu app de e-mail. Escreva para ${REVIEW_FEEDBACK_EMAIL}.`);
    } finally {
      setSending(false);
    }
  }

  return (
    <SheetShell onClose={onCancel} visible={visible}>
      <Text className="text-center text-2xl font-bold text-primary-strong">Como podemos melhorar?</Text>
      <Text className="text-[15px] leading-[22px] text-foreground">
        Sua sugestão chega direto para nós e nos ajuda a evoluir o Meu Pomodoro.
      </Text>

      <View className="flex-row flex-wrap gap-2">
        {FEEDBACK_CATEGORIES.map((item) => {
          const selected = item === category;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => {
                haptic.selection();
                setCategory(item);
              }}
            >
              <View className={cn("min-h-10 justify-center rounded-full px-3.5", selected ? "bg-primary" : "bg-primary-soft")}>
                <Text className={cn("text-sm font-medium", selected ? "text-surface" : "text-primary-strong")}>
                  {item}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text className="text-sm font-semibold text-foreground">Conte um pouco mais</Text>
      <TextInput
        accessibilityLabel="Conte um pouco mais"
        className="min-h-[110px] rounded-xl border border-border bg-surface p-3 text-[15px] text-foreground"
        multiline
        onChangeText={setMessage}
        placeholder="O que você gostaria de ver no Meu Pomodoro?"
        placeholderTextColor={colors.muted}
        textAlignVertical="top"
        value={message}
      />
      {error ? <Text className="text-xs leading-[17px] text-error">{error}</Text> : null}

      <PrimaryButton
        disabled={sending}
        label={sending ? "Abrindo e-mail..." : "Enviar sugestão"}
        onPress={() => void handleSend()}
      />
      <TextAction label="Cancelar" onPress={onCancel} />
    </SheetShell>
  );
}
