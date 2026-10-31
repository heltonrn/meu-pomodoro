import { Pressable, Text, View } from "react-native";

interface ErrorNoticeProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorNotice({ message, onDismiss }: ErrorNoticeProps) {
  return (
    <Pressable
      accessibilityHint="Toque para dispensar"
      accessibilityRole="alert"
      onPress={onDismiss}
    >
      <View className="mx-4 mb-2 rounded-xl bg-error-soft px-3.5 py-2.5">
        <Text className="text-xs leading-[18px] text-error">{message}</Text>
      </View>
    </Pressable>
  );
}
