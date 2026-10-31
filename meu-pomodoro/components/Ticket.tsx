import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/use-colors";

const TOOTH_SIZE = 12;
const TOOTH_COUNT = 22;

function ZigzagEdge({ position }: { position: "top" | "bottom" }) {
  return (
    <View
      pointerEvents="none"
      style={[styles.zigzagRow, position === "top" ? styles.zigzagTop : styles.zigzagBottom]}
    >
      {Array.from({ length: TOOTH_COUNT }, (_, index) => (
        <View className="bg-background" key={index} style={styles.tooth} />
      ))}
    </View>
  );
}

/**
 * Cartão "ticket" com recorte serrilhado nas bordas superior e inferior,
 * herdado da linguagem visual do Meu Mercado / Frase do Dia.
 */
export function Ticket({ children }: PropsWithChildren) {
  const colors = useColors();

  return (
    <View className="mx-1">
      <View
        className="overflow-hidden rounded-2xl bg-surface px-[22px] pb-[22px] pt-[26px]"
        style={{
          shadowColor: colors.foreground,
          shadowOpacity: 0.08,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 6 },
          elevation: 4,
        }}
      >
        {children}
      </View>
      <ZigzagEdge position="top" />
      <ZigzagEdge position="bottom" />
    </View>
  );
}

const styles = StyleSheet.create({
  zigzagRow: {
    position: "absolute",
    left: 8,
    right: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    overflow: "hidden",
    height: TOOTH_SIZE,
  },
  zigzagTop: { top: -TOOTH_SIZE / 2 },
  zigzagBottom: { bottom: -TOOTH_SIZE / 2 },
  tooth: {
    width: TOOTH_SIZE,
    height: TOOTH_SIZE,
    transform: [{ rotate: "45deg" }],
  },
});
