# 🍅 Meu Pomodoro

App de cronômetro Pomodoro — React Native + Expo + TypeScript (strict) + Zustand + SQLite.

## Status: Fases 0 a 7 implementadas

| Fase | Entrega |
|------|---------|
| 0 · Fundação | Expo + TS strict, 3 abas, tema da Proposta B, estrutura de pastas |
| 1 · Cronômetro | Iniciar/pausar/continuar/reiniciar, contagem por **timestamps** (req. 10) |
| 2 · Ciclo | Máquina de estados, pausas curta/longa, pular, tela de Sessão concluída, autoStart |
| 3 · Configurações | Tempos (steppers com faixas), comportamento (switches), keep awake, vibração |
| 4 · Persistência | SQLite: settings, sessions e estado ativo; recuperação ao reabrir (Regra 6) |
| 5 · Histórico | Lista de sessões, badges Concluído/Pulado, abas Hoje/Semana, estatísticas |
| 6 · Background | Notificação local **agendada para o fim da sessão** (dispara com app fechado), ressincronização via AppState, conclusão em segundo plano registrada |
| 7 · Monetização | Componente `AdSlot` posicionado (placeholder — ver abaixo) |

## Rodando

```bash
npm install
npx expo start
```

Abra no Expo Go (Android/iOS) ou emulador.

## Monetização (Fase 7)

Os pontos de anúncio estão marcados com o componente `AdSlot`:
- Tela Pomodoro: **oculto enquanto o timer roda** (não atrapalha o foco);
- Tela de Sessão concluída (melhor momento);
- Histórico e Configurações: fixo acima da tab bar.

O AdMob real usa `react-native-google-mobile-ads`, que **não roda no Expo Go** — exige um development build (`npx expo prebuild` + `expo run:android`) e uma conta AdMob. Quando tiver a conta, basta trocar o conteúdo do `AdSlot` pelo `<BannerAd />`; o layout já reserva o espaço.

## Decisões técnicas

- **Timestamps (req. 10/11)**: `remainingMs` é sempre derivado de `targetEndsAt - Date.now()`. O intervalo só dispara releituras do relógio.
- **Recuperação (Regra 6)**: o estado ativo é salvo no SQLite a cada transição. Ao abrir, se a sessão terminou com o app fechado, ela é registrada como concluída e a tela de conclusão aparece.
- **Notificações (req. 16)**: agendadas para o horário real de término no start/resume, canceladas em pause/skip/restart — funcionam com o app em segundo plano ou fechado.
- **Regra 9**: a duração é capturada no start; mudar configurações não altera a sessão em andamento.
- **Regras 3/4**: só o término natural grava `completed = 1`; pular grava a sessão com o tempo decorrido e `completed = 0`.

## Estrutura

```
src/
├── components/     # Ticket, SessionChip, CycleDots, TimerControls, TaskInput,
│                   # SessionComplete, SessionItem, StatCard, Stepper, AdSlot
├── screens/        # TimerScreen, HistoryScreen, SettingsScreen
├── hooks/          # usePomodoroTimer (tick, AppState, vibração, keep-awake, autoStart)
├── store/          # pomodoroStore (máquina de estados + persistência), settingsStore
├── services/       # database (SQLite), notifications (locais agendadas)
├── types/ constants/ utils/ navigation/
```

## V2 (fora do MVP)

Metas diárias, sequência de dias, calendário, categorias, gráficos, dark mode, exportação, backup, sons personalizados.
