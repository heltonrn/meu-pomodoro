# 🍅 Meu Pomodoro

App de cronômetro Pomodoro, na mesma stack do Hidrata: Expo SDK 57 · React Native 0.86 · TypeScript (strict) · expo-router · NativeWind · Zustand 5 · expo-sqlite · Vitest · pnpm.

## Rodando

O app usa `react-native-google-mobile-ads` e `expo-dev-client`, então **não roda no Expo Go**: use um development build.

```bash
pnpm install
pnpm android        # expo run:android (precisa do Android SDK)
pnpm start          # Metro, para abrir o dev build já instalado
```

Qualidade (os testes de banco usam `node:sqlite`, então exigem Node 22.13 ou superior):

```bash
pnpm check          # tsc --noEmit
pnpm lint           # expo lint
pnpm test           # vitest
```

## Estrutura

```
app/                     # rotas (expo-router): _layout, (tabs)/index|history|settings
components/              # Ticket, SessionChip, CycleDots, TimerControls, TaskInput,
                         # SessionComplete, SessionItem, StatCard, Stepper, AdBanner, ...
hooks/                   # use-pomodoro-timer, use-app-bootstrap, use-history, use-colors
lib/                     # theme-provider, haptics, utils
src/
├── database/            # database.ts, migrations.ts, validation.ts, repositories/
├── services/            # CycleService (puro), NotificationService, PersistenceQueue
├── store/               # pomodoroStore (máquina de estados), settingsStore
├── types/ constants/ utils/
tests/                   # Vitest (SQL real via node:sqlite)
```

## Decisões técnicas

- **Timestamps (req. 10/11):** `remainingMs` é sempre derivado de `targetEndsAt - Date.now()`; o intervalo só dispara releituras do relógio.
- **Recuperação (Regra 6):** o estado do cronômetro é gravado a cada transição; ao abrir, uma sessão que terminou com o app fechado é registrada como concluída.
- **Persistência:** as ações atualizam a memória de imediato e gravam numa fila serial (`PersistenceQueue`), preservando a ordem. Falhas viram aviso na tela.
- **Notificações (req. 16):** agendadas para o horário real de término; texto distingue pausa curta e longa; um canal Android por combinação de som e vibração, com o som próprio do app (`assets/sounds/chime.wav`).
- **Som em primeiro plano:** `expo-audio` toca o mesmo `chime.wav` quando a sessão termina com o app aberto (a notificação não toca de novo).
- **Início automático com o app fechado:** com `autoStart` ligado, são agendadas as notificações do fim de até 8 sessões (um ciclo). Ao reabrir, o app registra as sessões que passaram e continua da que está rodando. Depois da 8ª, o cronômetro espera o usuário, para não gravar foco que não houve. Focos recuperados dessa forma ficam sem tarefa.
- **Pedido de avaliação:** após concluir um foco, se o usuário tem ≥ 3 dias de uso e (≥ 4 dias com foco ou ≥ 15 focos), aparece um cartão "Está gostando?" (`ReviewPolicy`, puro e testado). "Sim" abre o convite para avaliar na loja (`expo-store-review`); "Pode melhorar" abre o feedback por e-mail (60 dias de espera); "Agora não" adia 30 dias (máx. 3 vezes). Em Configurações há "Avaliar o Meu Pomodoro" e "Enviar sugestão" sempre disponíveis. Estado na tabela `review_state` (migration v3).
- **Anúncios:** o banner fica sempre visível no rodapé (decisão de 22/10/2026; ocultá-lo durante o foco exigirá uma nova regra).
- **Regra 9:** a duração é capturada no start; com o cronômetro parado, a duração exibida acompanha as configurações.

## Release Android (Play Console)

Build local com Gradle, sem EAS (mesmo fluxo do Minha Bíblia):

1. Keystore de upload em `credentials/meu-pomodoro-release.jks` (pasta ignorada pelo git; faça backup fora do projeto).
2. Copie `keystore.properties.example` para `keystore.properties` e preencha (também ignorado pelo git).
3. Gere o AAB:

```powershell
pnpm build:aab                              # teste fechado: anúncios de TESTE
powershell -ExecutionPolicy Bypass -File scripts\build-aab-local.ps1 -AdsEnv production   # produção
```

O AAB vai para `dist/`. A cada novo envio, aumente `android.versionCode` no `app.config.ts`.
