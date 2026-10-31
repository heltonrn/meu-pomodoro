# 🍅 Meu Pomodoro — Backlog

Atualizado em: 29/10/2026

## Concluído na migração para a stack do Hidrata

- Expo SDK 57, React Native 0.86, React 19, TypeScript 6 (strict + `noUncheckedIndexedAccess`), pnpm.
- expo-router (abas em `app/(tabs)`), NativeWind 4 com tokens de tema (claro/escuro prontos nos tokens), Zustand 5.
- SQLite assíncrono com migrations versionadas (`schema_migrations`) e repositories tipados.
- Gravações em fila serial; falhas de banco/notificação viram aviso na tela e o cronômetro segue em memória.
- Notificações no padrão do Hidrata (`require` tardio, não quebra no Expo Go/Android) com um canal Android por combinação de som/vibração.
- `AdBanner` real (`react-native-google-mobile-ads`) com IDs de teste em desenvolvimento e IDs de produção (Android) nos builds de release; sempre visível (decisão de 22/10/2026).
- Vitest (33 testes, incluindo SQL real via `node:sqlite`), ESLint (`expo lint`), `tsc --noEmit`.
- Itens do backlog anterior resolvidos: texto da notificação (pausa longa), tratamento de erros, foco do dia na tela de conclusão.
- Bugs corrigidos: duração desatualizada em IDLE após mudar configurações; vibração ao reabrir app com sessão antiga.

## 🔴 Prioridade 1 — Acabamento do MVP

| # | Item | Descrição | Status |
|---|------|-----------|--------|
| 1 | Som em primeiro plano | Som próprio (`chime.wav`) com `expo-audio` ao terminar com o app aberto; mesmo som no canal de notificação (canal v3) | Feito (22/10/2026), validar no aparelho |
| 2 | autoStart em segundo plano | Cadeia de até 8 notificações agendadas + recuperação (catch-up) ao reabrir; limite evita histórico fantasma | Feito (22/10/2026), validar no aparelho |

## 🟡 Prioridade 2 — Validação

| # | Item | Descrição | Status |
|---|------|-----------|--------|
| 3 | Primeira execução em dispositivo | `pnpm install`, dev build (`pnpm android`), conferir notificações, AdMob de teste e recuperação do estado | A fazer |
| 4 | Release Android | Build local (sem EAS): `scripts/create-upload-keystore.ps1` cria a keystore de upload; `scripts/build-aab.ps1` gera o AAB (anúncios de teste por padrão; `-Ads prod` para produção) | Scripts prontos (29/10/2026); gerar keystore e 1º AAB |

## 🟢 Prioridade 3 — Polimento

| # | Item | Descrição | Status |
|---|------|-----------|--------|
| 5 | Filtros do histórico | Filtro por tipo/tarefa; agrupar a visão Semana por dia | A fazer |
| 6 | Assets do app | Ícone definitivo (tomate com anel de progresso), adaptive + monocromático, splash, favicon e gráficos da Play em `assets/store/` | Feito (29/10/2026) |
| 8 | Pedido de avaliação | Cartão pós-foco, convite à loja, feedback por e-mail e itens em Configurações (padrão do Hidrata). Feito em 22/10/2026; validar no aparelho e conferir o e-mail de contato | Feito |
| 7 | AdMob real | Android: app e bloco de banner de produção configurados (22/10/2026). Falta o iOS (app e bloco no AdMob) | Android feito; iOS pendente |
| 8 | Fontes da marca | Quicksand/Inter (Hidrata usa `fontFamily` mas não carrega as fontes) | A fazer |

## 🔵 V2 — Fora do MVP (requisito 24)

Metas diárias · sequência de dias produtivos · calendário · categorias de tarefas · relatórios mensais · gráficos avançados · temas personalizados · modo escuro (decisão: fora do MVP) · exportação do histórico · backup · sons personalizados · modo estudo.
