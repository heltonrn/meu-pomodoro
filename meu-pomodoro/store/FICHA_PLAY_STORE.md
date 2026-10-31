# Ficha da Play Store — Meu Pomodoro

Pacote: `br.com.volvet.meupomodoro` · Idioma padrão: Português (Brasil) · Contato: contato@volvet.com.br

## Nome do app (máx. 30 caracteres)
```
Meu Pomodoro
```

## Descrição curta (máx. 80 caracteres)
```
Timer Pomodoro simples: ciclos de foco e pausa, avisos e histórico do seu dia.
```

## Descrição completa (máx. 4000 caracteres)
```
Meu Pomodoro é um cronômetro Pomodoro simples e bonito para você estudar e
trabalhar com mais foco — sem cadastro, sem login e sem complicação.

COMO FUNCIONA
• 25 minutos de foco, 5 de pausa curta e, a cada 4 Pomodoros, uma pausa
  longa de 15 minutos.
• Os tempos e a quantidade de Pomodoros por ciclo são ajustáveis.
• Antes de começar, anote a tarefa em que vai focar.

UM CRONÔMETRO EM QUE VOCÊ PODE CONFIAR
• O tempo é calculado pelo relógio do aparelho: o cronômetro continua certo
  mesmo se você sair do app, bloquear a tela ou fechar o Meu Pomodoro.
• Ao fim de cada sessão, você recebe uma notificação com som e vibração.
• Início automático (opcional): a próxima sessão começa sozinha.
• Opção de manter a tela ligada enquanto o cronômetro estiver ativo.

ACOMPANHE SEU PROGRESSO
• Comemore cada Pomodoro concluído e veja seu progresso no ciclo.
• Histórico de hoje e da semana, com o total de Pomodoros e o tempo de foco.
• Sessões puladas aparecem separadas — só conta o foco que aconteceu.

PRIVACIDADE EM PRIMEIRO LUGAR
Suas tarefas, sessões e configurações ficam guardadas apenas no seu
aparelho. O app não pede cadastro nem coleta dados pessoais.

Meu Pomodoro é gratuito e exibe um pequeno banner de anúncio.
```
*(≈1.230 caracteres — folga para ajustes.)*

## Gráficos (pasta `store/play-store/`)
| Item | Arquivo | Especificação da Play |
|---|---|---|
| Ícone do app | `play-store-icon-512.png` | 512×512, PNG 32 bits |
| Gráfico de destaque | `feature-graphic-1024x500.png` | 1024×500, PNG/JPG sem transparência |
| Capturas de tela do telefone | `screenshot-01…06-*.png` | 1080×1920 (9:16), mín. 2, máx. 8 |

Ordem sugerida das capturas: 01 Foco → 02 Tarefa → 03 Pausas (com a
notificação) → 04 Conclusão → 05 Histórico → 06 Configurações. As capturas
são mockups fiéis às telas atuais (sem o banner de anúncio); para regerar ou
trocar textos: `python scripts/store/store.py`.

## Categoria
**Produtividade**.

## Tags sugeridas (Play Console → Presença na loja → Tags)
Produtividade · Estudos · Timer · Foco

## Detalhes de contato
- E-mail: contato@volvet.com.br
- Site (opcional): página onde a política de privacidade for hospedada.

## Classificação de conteúdo (questionário IARC)
- Categoria do app: **Todos os outros tipos de app** (utilitário/produtividade).
- Violência, sexo, linguagem, drogas, apostas: **Não** para todos.
- Interação entre usuários / compartilhamento de localização / compras: **Não**.
- Resultado esperado: **Livre** (L / PEGI 3 / Everyone).

## Público-alvo e conteúdo
- Faixa etária alvo: marcar **13–15, 16–17 e 18+** (não marcar faixas
  abaixo de 13 — evita as exigências da política "Famílias" para o AdMob).
- O app não é direcionado especificamente a crianças.
- Contém anúncios: **Sim** (banner Google AdMob).
- Compras no app: **Não**.
- Acesso ao app: todas as funções disponíveis sem login (não precisa
  fornecer credenciais de teste).

---

# Formulário de Segurança dos dados (Data Safety)

## O app coleta ou compartilha dados do usuário?
**Sim** — somente por causa do SDK de anúncios (Google AdMob). O app em si
não envia nada: tarefas, sessões e configurações ficam no SQLite local do
aparelho (dados que nunca saem do dispositivo não contam como "coletados"
para a Play). A sugestão por e-mail abre o app de e-mail do próprio usuário,
que decide se envia — não é coleta feita pelo app.

## Dados declarados (via AdMob)
| Tipo de dado | Coletado | Compartilhado | Finalidade | Opcional? |
|---|---|---|---|---|
| Identificadores do dispositivo ou outros IDs (ID de publicidade) | Sim | Sim | Publicidade ou marketing; Análise; Prevenção de fraudes | Não |
| Interações no app (com anúncios) | Sim | Sim | Publicidade ou marketing; Análise | Não |
| Diagnóstico (falhas/desempenho do SDK) | Sim | Não | Análise | Não |
| Localização aproximada (derivada do IP) | Sim | Sim | Publicidade ou marketing | Não |

## Não coletados
Nome, e-mail, telefone, endereço, localização precisa, contatos, fotos,
arquivos, mensagens, informações financeiras, saúde, histórico de navegação.

## Práticas de segurança
- Dados criptografados em trânsito: **Sim** (gerenciado pelo SDK do Google).
- Solicitação de exclusão: o desenvolvedor não guarda dados em servidor;
  o usuário apaga tudo desinstalando o app (ou em Configurações → Limpar
  histórico) e controla o ID de publicidade nas configurações do Android.

## Política de privacidade
URL pública de `POLITICA_DE_PRIVACIDADE.md` — **[PREENCHER após hospedar]**.

## Declarações adicionais
- **ID de publicidade**: Sim, o app usa (AdMob) → finalidade "Publicidade ou marketing".
- **Permissões**: `POST_NOTIFICATIONS` (aviso de fim de sessão), `VIBRATE`
  (vibração no fim da sessão), `INTERNET` e `ACCESS_NETWORK_STATE`
  (anúncios). `SCHEDULE_EXACT_ALARM` foi removida de propósito — não há
  declaração de alarme exato a fazer.
- **Apps de notícias / saúde / financeiros / governo**: Não se aplica.

---

# Teste fechado — roteiro na Play Console

1. **Testar e lançar → Testes → Teste fechado** → criar faixa (ex.: "Alpha").
2. **Testadores**: lista de e-mails ou Grupo do Google (12+ pessoas se a
   conta for pessoal criada após nov/2023; precisam ficar 14 dias seguidos).
3. **Criar nova versão** → enviar `dist/meu-pomodoro-1.0.0-vc1-ads-test.aab`
   → nome da versão "1.0.0 (1)" → notas da versão (abaixo).
4. **Países**: Brasil.
5. Revisar e enviar para análise. Depois de aprovado, compartilhar o link
   de participação com os testadores.

Notas da versão (pt-BR, máx. 500 caracteres):
```
Primeira versão de teste do Meu Pomodoro! Ciclos de foco e pausa, aviso no
fim de cada sessão (mesmo com o app fechado), tarefa por Pomodoro e
histórico de hoje e da semana. Conte para a gente o que achou em
Configurações → Enviar sugestão.
```
