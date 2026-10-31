import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "soft" | "danger";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: ButtonVariant;
  disabled?: boolean;
}

const CONTAINER: Record<ButtonVariant, string> = {
  primary: "bg-primary",
  soft: "bg-primary-soft",
  danger: "bg-error-soft",
};

const LABEL: Record<ButtonVariant, string> = {
  primary: "text-surface",
  soft: "text-primary-strong",
  danger: "text-error",
};

export function PrimaryButton({
  label,
  onPress,
  icon,
  variant = "primary",
  disabled = false,
}: PrimaryButtonProps) {
  const colors = useColors();
  const iconColor =
    variant === "primary" ? colors.surface : variant === "danger" ? colors.error : colors["primary-strong"];

  function handlePress(): void {
    if (disabled) {
      return;
    }
    haptic.light();
    onPress();
  }

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        { opacity: disabled ? 0.45 : pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <View
        className={cn(
          "min-h-12 flex-row items-center justify-center gap-2 rounded-xl px-5",
          CONTAINER[variant],
        )}
      >
        {icon ? <Ionicons color={iconColor} name={icon} size={18} /> : null}
        <Text className={cn("text-[15px] font-semibold", LABEL[variant])}>{label}</Text>
      </View>
    </Pressable>
  );
}
