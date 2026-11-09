# CicloBem — Checklist de prontidão da WhatsApp Cloud API

**ID:** `CB-WA-READINESS-20261109-01`  
**Atualizado em:** 09/11/2026  
**Número comercial confirmado:** `+55 21 99550-0927` (`5521995500927`)  
**Origem:** WhatsApp Messenger (aplicativo comum), confirmado pelo CTO  
**Estratégia selecionada:** sem preservação do histórico anterior. **Não executar exclusão até autorização específica.**  
**Status:** `PREPARATION_ONLY` — **NO-GO para liberação do número e produção**

## A. Decisões já confirmadas

- [x] Utilizar o número +55 21 99550-0927, que já consta nos links do site.
- [x] Destinar o número exclusivamente ao atendimento comercial automatizado.
- [x] Usar **Meta WhatsApp Business Platform / Cloud API oficial**.
- [x] Histórico anterior **não precisa ser preservado** (decisão do CTO).
- [x] Manter a exclusão da conta do WhatsApp comum bloqueada.
- [x] Manter o PR `#2` em rascunho, sem alterar o site público.
- [x] Preparar bot determinístico, webhook HMAC, fila de mensagens, esquema comercial, painel interno, testes unitários e documentação na branch.

## B. Preparação do portfólio empresarial da Meta — pendente de evidências

- [ ] Confirmar administrador do portfólio empresarial em [business.facebook.com](https://business.facebook.com).
- [ ] Confirmar qual pessoa jurídica será a titular do WABA e os dados cadastrais corretos, sem presumir CNPJ.
- [ ] Confirmar acesso à conta [Meta for Developers](https://developers.facebook.com/apps/).
- [ ] Criar app do tipo/caso de uso WhatsApp, WABA e número **de teste fornecido pela Meta**.
- [ ] Identificar e registrar no cofre (não no Git) os IDs **APP_ID, WABA_ID, TEST_PHONE_NUMBER_ID**.
- [ ] Validar nome público, marca CicloBem, URL do site, e-mail e política de privacidade.
- [ ] Verificar requisitos de comprovação empresarial, status de conta e de faturamento no painel.
- [ ] Gerar credenciais de homologação e configurar token durável de produção via usuário de sistema, com permissões mínimas, somente quando necessário.
- [ ] Verificar a versão Graph API atualmente suportada em vez de assumir uma versão fixa.

**Evidência de aprovação B:** captura sem segredos do Meta App/WhatsApp API Setup, IDs parcialmente mascarados, nome do negócio e número de teste disponível.

## C. Infraestrutura comercial — preparação segura

- [ ] Escolher host de homologação e confirmar Node.js 20+, PostgreSQL 16 e acesso de administração.
- [ ] Separar banco e usuário `ciclobem_commercial`, sem acesso a ledger/Pix/Conta Digital; configurar backups, retenção e controle de privilégios.
- [ ] Criar variáveis de ambiente localmente conforme `commercial-bot/.env.example`, nunca em arquivos públicos/commits.
- [ ] Gerar e revisar `package-lock.json`; usar `npm ci` em rotina reproduzível.
- [ ] Executar migração `schema.sql` **apenas no banco comercial isolado**.
- [ ] Instalar o serviço comercial **sem alterar** Control Center, Cloudflare financeiro, PostgreSQL da Conta Digital ou produção.
- [ ] Configurar HTTPS para **apenas** `/webhook` via domínio/túnel comercial separado; listener usa `127.0.0.1:3017`.
- [ ] Restringir painel `127.0.0.1:3018` via acesso privado/Tailscale, autenticação e auditoria.
- [ ] Confirmar que nenhum token, conversa, número de cliente ou payload é registrado em texto em logs públicos.

**Evidência de aprovação C:** `/healthz`, conexão SQL com banco comercial isolado, ACL/RBAC, TLS, teste de tráfego externo ao webhook e ausência de exposição pública do painel.

## D. Testes de homologação usando o número de teste da Meta

- [ ] GET `/webhook`: validação de challenge com `hub.verify_token`.
- [ ] POST `/webhook`: assinatura `X-Hub-Signature-256` correta aceita; assinatura inválida é rejeitada.
- [ ] Eventos `messages` corretamente inscritos no WABA/app Meta.
- [ ] Um contato de teste envia mensagem e recebe o menu de perfis.
- [ ] Realizar fluxo completo: perfil, nome, organização, cidade/UF, ponto de instalação, volume estimado e modalidade.
- [ ] Formulário do site preenche informações sem duplicar dados.
- [ ] O mesmo `wamid` reenviado não gera novo lead/resposta.
- [ ] `0` entrega para atendimento humano; bot deixa de responder automaticamente.
- [ ] `PARAR` encerra respostas automáticas; `INICIAR` retoma.
- [ ] Timeouts, rate limits da Meta e indisponibilidade temporária entram em monitoramento, sem perder mensagens nem gerar envio descontrolado.
- [ ] Testar operador visualizando lead e respondendo dentro da janela de 24 horas; fora dela, orientar modelo aprovado.
- [ ] Revisar LGPD: informação adequada, finalidade, retenção, direito de exclusão, separação do opt-in de marketing e acesso limitado.

**Evidência de aprovação D:** relatório de testes com timestamp, resultado esperado/observado e registros anonimizados.

## E. Aprovação do cutover do número definitivo — PORTÃO FECHADO

- [ ] Validar que o chip/eSIM do (21) 99550-0927 recebe SMS ou chamada, sob controle do responsável. **Não enviar OTP no ChatGPT, GitHub ou WhatsApp.**
- [ ] Confirmar que nenhum grupo, conversa, conta pessoal ou demanda comercial pendente requer preservação.
- [ ] Confirmar que todos os gates **B–D** foram aprovados.
- [ ] Definir janela de mudança, telefone de contingência/e-mail comercial, responsável pela operação e monitoramento.
- [ ] Validar o plano de fallback, sabendo que a exclusão do WhatsApp Messenger é potencialmente irreversível para o histórico.
- [ ] Obter **autorização textual específica do CTO para excluir a conta**.
- [ ] Somente então executar `Configurações → Conta → Apagar minha conta` no WhatsApp comum.
- [ ] Após liberação, registrar o número na Cloud API, verificar por SMS/chamada e configurar o PIN 2FA dentro da interface oficial.
- [ ] Trocar `META_PHONE_NUMBER_ID` de teste pelo de produção em ambiente seguro, sem commitar credenciais.
- [ ] Testar mensagem recebida/enviada, bot, painel, entrega e fluxo comercial real.
- [ ] Obter **GO final do CTO** para merge/publicação do site e divulgação do atendimento.

**Sem evidência para qualquer item obrigatório: NO-GO.**

## F. Entrega operacional comercial

- [ ] Designar Alexandre Lemos e atendentes substitutos com acesso segregado.
- [ ] Definir SLA de atendimento humano, horários, fluxo de pendências e critérios de classificação do lead.
- [ ] Testar aviso a um atendente para leads `HUMANO_PENDENTE` e `QUALIFICADO` — funcionalidade ainda não implementada como notificação ativa.
- [ ] Validar medidas reais: leads recebidos, qualificados, atendidos, tempo até resposta, conversão e falhas.
- [ ] Revisar retenção e exclusão de leads.
- [ ] Documentar implantação, rollback de código, limitações de rollback do número e acessos.

## Evidências disponíveis em 09/11/2026

| Verificação | Situação |
|---|---|
| Número destino e origem Messenger | **CONFIRMADO pelo CTO** |
| Histórico anterior dispensado | **CONFIRMADO pelo CTO** |
| Código preparatório e migração documentada | **IMPLEMENTADO em branch de desenvolvimento** |
| Testes de unidade do fluxo | **APROVADOS pelo GitHub Actions** |
| Conta Meta/WABA e identificação da empresa | **SEM EVIDÊNCIA — pendente** |
| Token, webhook real, PostgreSQL comercial instalado | **SEM EVIDÊNCIA — pendente** |
| Homologação com número de teste | **SEM EVIDÊNCIA — pendente** |
| Exclusão de conta WhatsApp Messenger | **PROIBIDA até autorização específica** |
| Migração e produção | **NO-GO** |

## Endereços de referência

- [Meta for Developers](https://developers.facebook.com/apps/)
- [Meta Business](https://business.facebook.com/)
- [Coleção oficial WhatsApp Business Platform — Postman Meta](https://www.postman.com/meta/whatsapp-business-platform/overview)
- [Runbook interno da migração](MIGRACAO-WHATSAPP-MESSENGER.md)
- [PR de homologação #2](https://github.com/Ricardojra/ciclobem/pull/2)
