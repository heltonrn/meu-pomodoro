import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';

/**
 * Fase 7 — placeholder do banner de monetização.
 *
 * O AdMob real (react-native-google-mobile-ads) exige um development build
 * (não funciona no Expo Go) e uma conta configurada. Este componente marca
 * a posição e o tamanho reservados; trocar o conteúdo interno pelo
 * <BannerAd /> quando a conta existir mantém o layout intacto.
 */
export function AdSlot(): React.JSX.Element {
  return (
    <View style={styles.slot}>
      <Text style={styles.text}>Espaço reservado para anúncio</Text>
      <View style={styles.tag}>
        <Text style={styles.tagText}>AD</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    marginHorizontal: 16,
    marginVertical: 8,
    minHeight: 50,
    backgroundColor: '#F1ECE0',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.inkSoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: { fontSize: 11, color: colors.inkSoft },
  tag: {
    backgroundColor: colors.inkSoft,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: { fontSize: 9, fontWeight: '700', color: colors.paper, letterSpacing: 1 },
});
