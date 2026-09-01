import React, { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../constants/theme';

const TOOTH_SIZE = 12;
const TOOTH_COUNT = 22;

function ZigzagEdge({ position }: { position: 'top' | 'bottom' }): React.JSX.Element {
  return (
    <View
      style={[styles.zigzagRow, position === 'top' ? styles.zigzagTop : styles.zigzagBottom]}
      pointerEvents="none"
    >
      {Array.from({ length: TOOTH_COUNT }, (_, index) => (
        <View key={index} style={styles.tooth} />
      ))}
    </View>
  );
}

/**
 * Cartão "ticket" com recorte serrilhado nas bordas superior e inferior,
 * herdado da linguagem visual do Meu Mercado / Frase do Dia.
 */
export function Ticket({ children }: PropsWithChildren): React.JSX.Element {
  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>{children}</View>
      <ZigzagEdge position="top" />
      <ZigzagEdge position="bottom" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 4,
  },
  card: {
    backgroundColor: colors.paper,
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 22,
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    overflow: 'hidden',
  },
  zigzagRow: {
    position: 'absolute',
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    overflow: 'hidden',
    height: TOOTH_SIZE,
  },
  zigzagTop: { top: -TOOTH_SIZE / 2 },
  zigzagBottom: { bottom: -TOOTH_SIZE / 2 },
  tooth: {
    width: TOOTH_SIZE,
    height: TOOTH_SIZE,
    backgroundColor: colors.cream,
    transform: [{ rotate: '45deg' }],
  },
});
