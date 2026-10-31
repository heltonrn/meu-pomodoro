import { useEffect, useState } from "react";
import { View } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";

import { getBannerAdUnitId } from "@/src/constants/ads";

interface AdBannerProps {
  /**
   * Espaço reservado abaixo do banner para não ficar sob a área de gestos ou
   * os botões de navegação do sistema. Normalmente `useSafeAreaInsets().bottom`.
   */
  bottomInset?: number;
}

/**
 * Banner de anúncios fixo no rodapé, sempre visível (decisão de 22/10/2026).
 * Se o anúncio não carregar (sem internet, sem preenchimento do AdMob), o
 * componente não ocupa espaço e tenta de novo depois, com espera crescente.
 */
const RETRY_BASE_MS = 30_000;
const RETRY_MAX_MS = 5 * 60_000;

export function AdBanner({ bottomInset = 0 }: AdBannerProps) {
  const [failures, setFailures] = useState(0);
  const [failedToLoad, setFailedToLoad] = useState(false);

  useEffect(() => {
    if (!failedToLoad) {
      return undefined;
    }
    const delay = Math.min(RETRY_BASE_MS * 2 ** (failures - 1), RETRY_MAX_MS);
    const timer = setTimeout(() => setFailedToLoad(false), delay);
    return () => clearTimeout(timer);
  }, [failedToLoad, failures]);

  if (failedToLoad) {
    return null;
  }

  return (
    <View
      className="items-center border-t border-border bg-surface"
      style={{ paddingBottom: bottomInset }}
    >
      <BannerAd
        onAdFailedToLoad={() => {
          setFailures((count) => count + 1);
          setFailedToLoad(true);
        }}
        onAdLoaded={() => setFailures(0)}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        unitId={getBannerAdUnitId()}
      />
    </View>
  );
}
