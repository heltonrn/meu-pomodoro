import { Modal, Pressable, Text, View } from "react-native";

import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  function handleConfirm(): void {
    haptic.medium();
    onConfirm();
  }

  return (
    <Modal accessibilityViewIsModal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <View className="flex-1 items-center justify-center bg-black/40 p-6">
        <View className="w-full max-w-[380px] rounded-[18px] bg-surface p-[22px]">
          <Text className="text-[19px] font-bold text-foreground">{title}</Text>
          <Text className="mt-2 text-sm leading-[21px] text-muted">{message}</Text>
          <View className="mt-[22px] flex-row justify-end gap-2.5">
            <Pressable accessibilityRole="button" onPress={onCancel} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <View className="min-h-11 items-center justify-center rounded-[11px] border border-border px-3.5">
                <Text className="text-[13px] font-semibold text-foreground">{cancelLabel}</Text>
              </View>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={handleConfirm} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <View className={cn("min-h-11 items-center justify-center rounded-[11px] px-4", destructive ? "bg-error" : "bg-primary")}>
                <Text className="text-[13px] font-semibold text-surface">{confirmLabel}</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
