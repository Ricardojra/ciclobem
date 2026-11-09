# CicloBem — WhatsApp comercial exclusivo (MVP técnico)

**Situação:** código preparatório em branch de revisão. **NÃO está ativado em produção.**
O WhatsApp antigo continua nas páginas enquanto \`NEW_COMMERCIAL_NUMBER\` estiver vazio.

## Escopo

- Site estático: \`/commercial-whatsapp.js\` centraliza a troca do número nos botões das páginas \`index.html\`, \`empresas.html\` e \`prefeituras.html\`.
- Webhook oficial da Meta: \`commercial-bot/server.mjs\`.
- Qualificação determinística: perfil → nome → organização → cidade/UF → instalação → fluxo → modalidade.
- Importação de dados do formulário já existente; não duplica as primeiras perguntas quando o formulário foi preenchido.
- CRM isolado: banco PostgreSQL comercial, separado do ledger, Conta Digital, Pix e dos demais serviços financeiros.
- Interface administrativa local para consulta e resposta humana: \`http://127.0.0.1:3018/\`.
- Processamento idempotente por \`message_id\` e fila persistente de respostas.

## Pré-requisitos externos (ainda NÃO executados)

1. Adquirir um número exclusivamente corporativo que receba SMS/ligação, sob titularidade e gestão definidas.
2. Dispor de portfólio empresarial Meta, WhatsApp Business Account (WABA) e aplicativo Meta com WhatsApp Cloud API. Registrar o número e configurar PIN/2FA.
3. Criar usuário de sistema com permissões mínimas e token adequado à produção, guardado fora do repositório.
4. Obter \`META_PHONE_NUMBER_ID\`, \`META_APP_SECRET\`, versão Graph API suportada e configurar \`META_VERIFY_TOKEN\`.
5. Preparar um banco/usuário PostgreSQL EXCLUSIVAMENTE comerciais e backups.
6. Publicar APENAS o webhook por HTTPS, preferencialmente em um subdomínio reservado (por exemplo \`wa.ciclobem.com.br\`) via Cloudflare Tunnel → \`http://127.0.0.1:3017\`.
7. **NÃO publicar a porta 3018 na Internet aberta.** Acesso ao painel exclusivamente pelo Tailscale Serve / rede privada e token administrativo forte.

## Preparar ambiente de homologação

Requer Node.js 20+ e PostgreSQL 16.

\`\`\`sh
cd commercial-bot
cp .env.example .env
# Editar .env LOCALMENTE, sem publicar; conferir permissões de arquivo.
# Provisionar usuário/banco commercial_user no PostgreSQL e aplicar:
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f schema.sql
npm install --omit=dev
npm test
node --env-file=.env server.mjs
\`\`\`

Para implantação reprodutível, gerar e revisar \`package-lock.json\` e mudar para \`npm ci --omit=dev\` antes do GO. Não reutilizar credenciais ou banco de produção do CicloBem Sistema.

Webhook Meta:
- GET \`/webhook\`: confirma \`hub.verify_token\` e devolve o challenge.
- POST \`/webhook\`: verifica \`X-Hub-Signature-256\` com HMAC-SHA256 do corpo bruto; armazena evento antes de responder \`200\`.
- \`/healthz\`: disponibilidade do processo e do banco.

Painel local \`http://127.0.0.1:3018/\`:
- Digitar token administrativo forte (fica somente na memória da página).
- Carregar até 100 leads recentes, consultar última mensagem e responder.
- Resposta manual livre somente durante janela de 24 horas a partir da última mensagem recebida do interessado; fora dela, o endpoint recusa e exige template aprovado conforme política da Meta.
- \`202 queued\` representa entrada na fila, **não confirmação de entrega** ao cliente.

## Ativar número no site — SOMENTE após homologação

Preencher \`NEW_COMMERCIAL_NUMBER\` em \`/commercial-whatsapp.js\` no formato \`55DDDNÚMERO\` sem sinais ou espaços. Atualizar **também** número público em dados estruturados (\`ContactPoint\`), textos e páginas externas/termos quando aplicável. Fazer testes de envio real antes de publicar, e preservar rollback para o número antigo.

Não alterar a configuração do domínio Pix nem usar o tunnel, a porta ou os tokens financeiros para o serviço comercial.

## Testes de aceite obrigatórios

- Número corporativo registrado, identidade CicloBem confirmada, token de produção e faturamento configurados.
- Fluxo do site (ícone flutuante, contato direto, formulário, empresas e prefeituras) abre o número correto e mensagem de origem; envio pelo visitante confirmado.
- Webhook GET de validação e POST com assinatura válida; assinatura ausente/incorreta rejeitada; outros números descartados.
- Mensagem inicial, múltiplos perfis, texto inválido, dados do formulário, \`0\` humano, \`PARAR\` e retomada \`INICIAR\`.
- Repetição de webhook não produz mensagens duplicadas; indisponibilidade de banco causa erro recuperável; indisponibilidade da Meta entra em fila de retry.
- Operador consegue ver lead e responder na janela válida, inclusive pelo celular na rede privada; sem acesso público ao painel.
- Revisão LGPD da política do site e mensagens: categorias de dados, finalidade, operadores, retenção, direitos, tratamento de desistência; consentimento de marketing SEPARADO.
- Definir rotina para monitorar \`HUMANO_PENDENTE\` e \`QUALIFICADO\` (responsável, horários, SLA, contato de continuidade).
- Atestar em ambiente de homologação com conta Meta de testes antes de liberar tráfego público.

## Limitações desta primeira versão

O painel mostra a **última mensagem recebida**, não um histórico completo. Sem suporte ainda a anexos, agendamento, notificações por e-mail, templates aprovados fora de 24h, métricas consolidadas, tratamento automatizado de pedidos LGPD ou confirmação de status \`delivered/read\`. A fila registra aceite pela Graph API, não entrega final.

São melhorias posteriores, não devendo ser anunciadas como funcionais.

## Segurança operacional

O código é público; jamais commitar \`.env\`, tokens Meta, códigos de SMS, PINs, dumps de leads ou dados pessoais. Criar senhas fortes e rotacionar se houver suspeita de exposição. Fazer revisão de dependências, SQL, fluxo de exclusão e acesso RBAC antes de produção.

**GO/NO-GO:** somente após confirmação do CTO sobre titularidade do número, evidências de testes ponta a ponta e plano de atendimento humano.
