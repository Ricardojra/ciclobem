# CicloBem — Runbook de migração do WhatsApp Messenger para Cloud API

**Referência:** `CB-WA-CLOUD-CUTOVER-01`  
**Número designado:** +55 21 99550-0927 (`5521995500927`)  
**Origem confirmada pelo CTO (09/11/2026):** WhatsApp Messenger (aplicativo comum)  
**Destino:** WhatsApp Business Platform — Cloud API oficial da Meta  
**Estado:** **GO apenas para preparação e testes**; **NO-GO para excluir conta, registrar número definitivo ou fazer cutover** até autorização adicional, independente da aprovação do projeto.
**Decisão do CTO 09/11/2026:** informou que **não precisa preservar o histórico anterior**. A rota B (conta Messenger → Cloud API) será seguida, mas a exclusão continua bloqueada até autorização específica.  
**Responsável técnico:** CTO; atendimento comercial: Alexandre Lemos (ou equipe autorizada).

> Nunca confundir **desinstalar aplicativo** com **excluir conta**. A exclusão da conta é irreversível e pode destruir histórico, grupos e backup associado. Não executar durante a preparação.

## 0. Estratégia de dados definida pelo CTO: histórico dispensado

### Rota A (alternativa não selecionada, manter como contingência)
- Disponibilizar **outro número** para continuar usando o WhatsApp Messenger pessoal.
- Fazer backup atualizado e exportar **individualmente** os diálogos/documentos que precisam ser arquivados fora do aplicativo, com proteção de dados e base legal adequada.
- No WhatsApp Messenger atual, usar **Configurações → Conta → Mudar número** para transferir a identidade e o histórico do aplicativo para a nova linha pessoal, seguindo a confirmação do WhatsApp.
- Conferir que o novo número pessoal mantém conversas, grupos, dados necessários e acesso ao aparelho.
- Confirmar que **+55 21 99550-0927** deixou de ser usado pelo WhatsApp Messenger antes de tentar registrá-lo na Cloud API.
- **Importante:** a migração por "Mudar número" atualiza a identidade dos contatos/grupos e pode notificar interlocutores. Não é um método de restaurar histórico no CRM ou na API.

### Rota B (SELECIONADA — sem autorização para apagar a conta)
- O CTO declarou que não necessita preservar o histórico anterior. Backup/exportação ficam opcionais, mas a decisão deve ser reconfirmada imediatamente antes do ponto de não retorno; nenhum histórico anterior será importado à Cloud API.
- A conta do WhatsApp Messenger existente precisará ser **excluída pelo próprio aplicativo** para liberar o número para a Cloud API.
- **Ponto de não retorno:** "Configurações → Conta → Apagar/Excluir minha conta" só após autorização explícita do CTO para esse passo e confirmação de prontidão técnica, comunicação e janela de migração.
- **Não considerar o backup do WhatsApp como rollback:** excluir a conta pode remover o backup e impedir a recuperação das conversas; o histórico não é importado para a API.

### Alternativa a avaliar, não presumida
Transferir Messenger → WhatsApp Business App e avaliar coexistência via provedor oficial elegível. Isso pode preservar uso do app em alguns fluxos de integração, mas a elegibilidade depende do provedor e das regras vigentes. Não é requisito da **Cloud API direta** e não deve ser ativado sem avaliação específica.

## 1. Pré-requisitos verificáveis — nenhum requer apagar conta

- [ ] Identificar titular e controle operacional do chip/eSIM +55 21 99550-0927.
- [ ] Testar recebimento de SMS **e/ou** ligação no número, sem divulgar código OTP.
- [x] Definir estratégia para o histórico: **Rota B**, sem necessidade de preservar histórico, conforme decisão do CTO.
- [ ] Reconfirmar a decisão imediatamente antes da exclusão, inclusive efeitos sobre grupos, backups e mensagens ainda pendentes.
- [ ] Identificar conversas comerciais pendentes e responsável por respostas durante o corte.
- [ ] Confirmar controle do Business Portfolio/Business Manager na Meta sob titularidade da pessoa jurídica apropriada à CicloBem e permissões de administrador.
- [ ] Criar app Meta com caso de uso WhatsApp; vincular WhatsApp Business Account (WABA).
- [ ] Verificar perfil de exibição "CicloBem", e-mail comercial, URL do site, política de privacidade, status/verificação empresarial quando exigidos.
- [ ] Criar token de produção de usuário do sistema com escopo mínimo; guardar em cofre, nunca no GitHub/WhatsApp.
- [ ] Usar número **de teste da Meta** para validar integração sem tocar no número (21) 99550-0927.
- [ ] Preparar banco comercial independente do Pix/Conta Digital e seus backups.
- [ ] Executar `npm ci` após lockfile revisado, testes unitários, testes de segurança e ensaios de webhook com assinatura correta/incorreta.
- [ ] Expor só a porta de webhook via TLS/Cloudflare Tunnel próprio; painel administrativo 3018 permanece interno/Tailscale + token.
- [ ] Testar registro de leads, comando humano, PARAR, recuperação de falhas e retomada.
- [ ] Definir cobertura de atendimento humano e canal alternativo de contingência (ex.: contato@ciclobem.com.br).
- [ ] Validar política LGPD, prazo de retenção dos leads e atendimento de solicitações dos titulares.

## 2. Preparação Meta e servidor — homologação com número de teste

1. Abrir painel Meta for Developers e criar/vincular aplicativo com caso de uso WhatsApp ao portfólio da CicloBem.
2. Em WhatsApp → API Setup, obter WABA ID, **ID do número de teste** e token temporário de teste (não usar em produção).
3. Criar credenciais de produção com permissões apropriadas (`whatsapp_business_messaging` e, quando necessário, `whatsapp_business_management`); proteger e auditar acessos.
4. Preparar listener de webhook `https://<subdominio-comercial>/webhook` com confirmação de challenge e assinatura `X-Hub-Signature-256`.
5. Assinar eventos `messages` no aplicativo; validar chamadas de ponta a ponta com número **de teste**. O serviço de chatbot deverá persistir o lead e registrar o envio.
6. Verificar o painel interno em rede privada; testes em Android e desktop, incluindo resposta humana, sem exposição pública.
7. Definir número de contingência/atendimento por e-mail durante a janela de ativação.

## 3. Gate de corte (GO/NO-GO)

| Gate | Evidência necessária |
| --- | --- |
| G1 — Dados preservados | Rota A ou B escolhida; exportações essenciais verificadas |
| G2 — Número sob controle | Operadora/SIM, SMS/chamada e titularidade confirmados |
| G3 — Meta pronta | WABA/app/identidade/permissões validadas; plano de faturamento entendido |
| G4 — Serviço pronto | Webhook HTTPS, PostgreSQL isolado, monitoramento e controles de acesso |
| G5 — Funções homologadas | Mensagem recebida, bot, duplicatas, PARAR, humano, interrupções |
| G6 — Continuidade | Equipe avisada, canal alternativo e comunicação de corte preparados |
| G7 — Autorização explícita | CTO autoriza separadamente a **liberação do número** e a **ativação em produção** |

**Se qualquer gate estiver pendente: NO-GO.** Não pedir ao usuário para apagar/desinstalar o aplicativo.

## 4. Cutover supervisionado — somente após G1–G7

1. Abrir janela controlada e suspender temporariamente novas ações promocionais no site; manter canal alternativo de contato.
2. Conferir exports, pendências e confirmação final do responsável pela linha.
3. Executar Rota A (mudar número pessoal) **ou** Rota B (apagar conta do Messenger), conforme escolha e autorização específica.
4. Registrar/confirmar o número `+55 21 99550-0927` no WhatsApp Manager/Cloud API da Meta; informar **OTP** recebido por SMS/chamada **somente na interface oficial da Meta**. Não enviar OTP ou PIN para chat/DevIn.
5. Definir o PIN de 6 dígitos para verificação em duas etapas no fluxo de registro da API e armazenar em cofre.
6. Substituir na configuração segura o `META_PHONE_NUMBER_ID` de teste pelo de produção. Manter os segredos fora do Git.
7. Validar webhook de produção, identificador do número, mensagens inbound/outbound e eventos de entrega.
8. Testar o link do site, `index.html`, `empresas.html`, `prefeituras.html` e formulário com **mensagem realmente enviada**; validar classificação correta e abertura de lead.
9. Executar teste humano e PARAR; monitorar filas, erros e duplicatas.
10. Apenas com evidência de ponta a ponta e autorização para publicar, acionar `ACTIVATION_APPROVED=true` no JS, revisar dados estruturados e publicar a versão homologada.
11. Acompanhar primeiros contatos com Alexandre ou substituto identificado. Confirmar visualização e resposta pelo painel antes de declarar implantação concluída.

**Observação sobre o site:** o número já aparece nos links públicos. A opção de ativação no JS controla a inclusão da etiqueta de origem/roteamento, e **não controla a ativação da API na Meta**. O objetivo do gate é impedir declarações de que o bot está disponível antes de ele realmente funcionar.

## 5. Falha e contingência

- **Antes da Rota A/B:** não houve perda de conta. Interromper e manter WhatsApp Messenger operando.
- **Depois da liberação do número:** o rollback **não** é restaurar a conta anterior: exclusão de conta do Messenger é irreversível. Se Cloud API falhar, comunicar canal alternativo, bloquear campanhas, tratar incidentes e avaliar deregistro da API e novo registro no aplicativo, ciente de que o histórico anterior pode não ser recuperável.
- Não reutilizar tokens/portas do Pix nem migrar dados da Conta Digital para o banco comercial.
- Não divulgar segredos, PINs, códigos OTP, mensagens de clientes ou dumps do banco em PR/issues/logs públicos.

## 6. Critérios para encerrar a migração

- [ ] Cadastro oficial do número no WhatsApp Business Platform, com status correto no WhatsApp Manager.
- [ ] Mensagem enviada por teste externo chega ao webhook, gera lead e recebe resposta do bot.
- [ ] Contato via botões do site e formulário preserva a origem do lead.
- [ ] Resposta humana enviada dentro da janela permitida; fora dela, aplicação orienta template aprovado.
- [ ] Políticas LGPD e fluxo de exclusão/retensão revisados.
- [ ] Inventário de credenciais, backups, owner técnico/comercial, alerta operacional e plano de incidentes arquivados.
- [ ] CTO assina GO final com evidências, sem presumir homologação a partir de testes unitários.

## Referências oficiais

- WhatsApp Help — [Mudar número](https://faq.whatsapp.com/1166321223998129)
- WhatsApp Help — [Apagar conta](https://faq.whatsapp.com/2138577903196467/?cms_platform=iphone&locale=pt_BR)
- WhatsApp Help — [Backup de conversas](https://faq.whatsapp.com/1144861179456352?lang=pt)
- Meta API (Postman oficial) — [Registration](https://www.postman.com/meta/whatsapp-business-platform/folder/zuoeksl/registration)
- Amazon AWS doc — [Requisito de desligar conta existente para registrar número no WhatsApp Business Platform](https://docs.aws.amazon.com/social-messaging/latest/userguide/getting-started-whatsapp.html)
