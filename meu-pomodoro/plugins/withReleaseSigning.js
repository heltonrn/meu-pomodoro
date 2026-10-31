/**
 * Config plugin: assinatura de release no build local do Android.
 *
 * O EAS Build injeta a keystore sozinho; no build local (Gradle direto) o
 * template do Expo assina o release com a keystore de DEBUG, o que a Play
 * Store rejeita. Este plugin lê `keystore.properties` (raiz do projeto,
 * gitignored) e configura `signingConfigs.release` no `android/app/build.gradle`
 * gerado pelo `expo prebuild`. Sem o arquivo, cai no comportamento padrão.
 *
 * Formato de keystore.properties — ver keystore.properties.example.
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// [meu-pomodoro] release signing (plugins/withReleaseSigning.js)';

const RELEASE_SIGNING_CONFIG = `
        ${MARKER}
        release {
            def ksPropsFile = rootProject.file('../keystore.properties')
            if (ksPropsFile.exists()) {
                def ksProps = new Properties()
                ksPropsFile.withInputStream { ksProps.load(it) }
                storeFile rootProject.file('../' + ksProps['storeFile'])
                storePassword ksProps['storePassword']
                keyAlias ksProps['keyAlias']
                keyPassword ksProps['keyPassword']
            }
        }`;

const RELEASE_SIGNING_SELECTOR =
  "signingConfig rootProject.file('../keystore.properties').exists() ? signingConfigs.release : signingConfigs.debug";

function applyReleaseSigning(contents) {
  if (contents.includes(MARKER)) return contents;

  // 1. Adiciona o bloco `release` dentro de `signingConfigs { ... }`.
  const signingConfigsOpen = /signingConfigs\s*\{/;
  if (!signingConfigsOpen.test(contents)) {
    throw new Error('[withReleaseSigning] bloco signingConfigs não encontrado em app/build.gradle');
  }
  contents = contents.replace(signingConfigsOpen, (m) => `${m}${RELEASE_SIGNING_CONFIG}`);

  // 2. Troca o signingConfig do buildType release (última ocorrência no template,
  //    a primeira é do buildType debug).
  const needle = 'signingConfig signingConfigs.debug';
  const idx = contents.lastIndexOf(needle);
  if (idx === -1) {
    throw new Error('[withReleaseSigning] signingConfig do buildType release não encontrado');
  }
  contents = contents.slice(0, idx) + RELEASE_SIGNING_SELECTOR + contents.slice(idx + needle.length);

  return contents;
}

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      throw new Error('[withReleaseSigning] só suporta app/build.gradle em Groovy');
    }
    config.modResults.contents = applyReleaseSigning(config.modResults.contents);
    return config;
  });
};
