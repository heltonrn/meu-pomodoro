# 🍅 Meu Pomodoro — Backlog

Atualizado em: 01/09/2026

## 🔴 Prioridade 1 — Acabamento do MVP

| # | Item | Descrição | Status |
|---|------|-----------|--------|
| 1 | Som em primeiro plano | Tocar som próprio via `expo-av` quando a sessão termina com o app aberto; hoje o som depende da notificação e pode ficar mudo (principalmente iOS) | A fazer |
| 2 | autoStart em segundo plano | Sessão que termina com o app fechado não inicia a próxima (JS suspenso). Decidir tratamento: agendar notificações em cadeia como mitigação + avançar estado ao reabrir | A fazer |
| 3 | Texto da notificação | Fim de foco sempre diz "pausa de X minutos" usando a pausa curta — errado quando a próxima é a pausa longa | A fazer |
| 4 | Tratamento de erros (req. 26) | try/catch e fallbacks nas chamadas de SQLite e notificações; hoje um erro de banco quebra a tela | A fazer |

## 🟡 Prioridade 2 — Validação

| # | Item | Descrição | Status |
|---|------|-----------|--------|
| 5 | Testes unitários | Jest para a lógica de ciclo (`computeNext`), utilitários de tempo e regras de negócio (Regras 1–10) | A fazer |
| 6 | Primeira execução real | `npm install` + `npx tsc --noEmit` + Expo Go; ajustar versões de dependências e erros de tipo que aparecerem | A fazer |

## 🟢 Prioridade 3 — Polimento

| # | Item | Descrição | Status |
|---|------|-----------|--------|
| 7 | Filtros do histórico (Fase 5) | Filtro por tipo/tarefa; agrupar a visão Semana por dia | A fazer |
| 8 | Assets do app | Ícone e splash screen (app.json só define cor de fundo) | A fazer |
| 9 | Tempo de foco na conclusão | Tela de Sessão concluída mostrar o total de foco do dia ("1h15 de foco hoje", como no mockup da Proposta B) | A fazer |
| 10 | AdMob real | Trocar placeholder `AdSlot` pelo `<BannerAd />` de `react-native-google-mobile-ads`; exige development build + conta AdMob | Bloqueado (conta) |

## 🔵 V2 — Fora do MVP (requisito 24)

Metas diárias · sequência de dias produtivos · calendário · categorias de tarefas · relatórios mensais · gráficos avançados · temas personalizados · dark mode · exportação do histórico · backup · sons personalizados · modo estudo.
