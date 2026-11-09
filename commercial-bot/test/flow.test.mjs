import test from "node:test";
import assert from "node:assert/strict";
import { processLead } from "../flow.mjs";

test("inicia com menu, sem presumir perfil", () => {
  const result = processLead({}, "Olá, vim pelo site CicloBem!");
  assert.equal(result.lead.stage, "profile");
  assert.match(result.reply, /Qual é o seu perfil/);
});
test("qualificação textual percorre todas as etapas", () => {
  let lead = {};
  const inputs = ["1", "Ana", "Indústria Exemplo", "Vitória/ES", "Fábrica", "200 pessoas", "3"];
  for (const input of inputs) lead = processLead(lead, input).lead;
  assert.equal(lead.status, "QUALIFICADO");
  assert.equal(lead.profile, "Empresa ou indústria");
  assert.equal(lead.commercial_model, "Parceria ou operação conjunta");
  assert.equal(lead.city_state, "Vitória/ES");
});
test("perfil inválido não avança", () => {
  const result = processLead({ stage: "profile" }, "Oi");
  assert.equal(result.lead.stage, "profile");
});
test("formulário existente preenche dados sem duplicar perguntas", () => {
  const body = "[CICLOBEM_SITE:formulario-contato]\n[Contato Site CicloBem]\n" +
    "Perfil: prefeitura\nNome: Marina\nOrganização: Prefeitura Exemplo\n" +
    "E-mail: marina@example.com\nTelefone: 27999999999\nMensagem: Solicito informações";
  const result = processLead({}, body);
  assert.equal(result.lead.stage, "city");
  assert.equal(result.lead.profile, "Prefeitura ou órgão público");
  assert.equal(result.lead.organization, "Prefeitura Exemplo");
  assert.equal(result.lead.email, "marina@example.com");
});
test("solicitação humana interrompe bot", () => {
  const result = processLead({stage:"city"}, "0");
  assert.equal(result.lead.status, "HUMANO_PENDENTE");
  assert.equal(result.lead.stage, "human");
});
test("opt-out interrompe automação", () => {
  const result = processLead({stage:"city"}, "PARAR");
  assert.equal(result.lead.stage, "opt_out");
  assert.equal(result.lead.status, "OPT_OUT");
});

test("após handoff, nova mensagem não provoca resposta automática", () => {
  const result = processLead({ stage: "human", status: "EM_ATENDIMENTO" }, "Tenho outra pergunta");
  assert.equal(result.reply, null);
  assert.equal(result.lead.status, "EM_ATENDIMENTO");
});
test("após opt-out, não envia automaticamente, salvo comando INICIAR", () => {
  assert.equal(processLead({ stage: "opt_out" }, "Obrigado").reply, null);
  assert.equal(processLead({ stage: "opt_out" }, "INICIAR").lead.stage, "profile");
});
