import { Pressable, Text, View } from "react-native";

import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";

interface StepperProps {
  value: number;
  min: number;
  max: number;
  suffix?: string;
  label: string;
  onChange: (value: number) => void;
}

export function Stepper({ value, min, max, suffix, label, onChange }: StepperProps) {
  function change(next: number): void {
    haptic.selection();
    onChange(next);
  }

  return (
    <View className="flex-row items-center gap-1.5">
      <Pressable
        accessibilityLabel={`Diminuir ${label}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: value <= min }}
        disabled={value <= min}
        onPress={() => change(value - 1)}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <View className={cn("h-[34px] w-[34px] items-center justify-center rounded-lg bg-primary-soft", value <= min && "opacity-35")}>
          <Text className="text-[17px] font-bold text-primary-strong">−</Text>
        </View>
      </Pressable>
      <Text className="min-w-[62px] text-center text-sm font-bold text-primary-strong">
        {value}
        {suffix !== undefined ? ` ${suffix}` : ""}
      </Text>
      <Pressable
        accessibilityLabel={`Aumentar ${label}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: value >= max }}
        disabled={value >= max}
        onPress={() => change(value + 1)}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <View className={cn("h-[34px] w-[34px] items-center justify-center rounded-lg bg-primary-soft", value >= max && "opacity-35")}>
          <Text className="text-[17px] font-bold text-primary-strong">+</Text>
        </View>
      </Pressable>
    </View>
  );
}
