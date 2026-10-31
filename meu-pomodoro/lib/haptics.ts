import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

export const haptic = {
  light: (): void => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },
  medium: (): void => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },
  selection: (): void => {
    if (Platform.OS !== "web") {
      void Haptics.selectionAsync();
    }
  },
  success: (): void => {
    if (Platform.OS !== "web") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },
  error: (): void => {
    if (Platform.OS !== "web") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },
};
