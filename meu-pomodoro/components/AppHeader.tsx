import { Text, View } from "react-native";

interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  return (
    <View className="items-center py-2.5">
      <Text accessibilityRole="header" className="text-[19px] font-bold text-primary-strong">
        {title}
      </Text>
    </View>
  );
}
