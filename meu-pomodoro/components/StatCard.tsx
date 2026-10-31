import { Text, View } from "react-native";

interface StatCardProps {
  value: string;
  label: string;
}

export function StatCard({ value, label }: StatCardProps) {
  return (
    <View className="flex-1 items-center rounded-2xl border border-border bg-surface py-3.5">
      <Text className="text-2xl font-bold text-primary-strong">{value}</Text>
      <Text className="mt-[3px] text-[11.5px] text-muted">{label}</Text>
    </View>
  );
}
