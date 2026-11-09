// Motor de qualificação determinístico. Não utiliza IA generativa nem preços inventados.
const OPTIONS = {
  "1": "Empresa ou indústria",
  "2": "Shopping ou comércio",
  "3": "Condomínio",
  "4": "Prefeitura ou órgão público",
  "5": "Cooperativa",
  "6": "Parceiro ou investidor",
  "7": "Outro"
};
const FORM_PROFILES = {
  empresa: OPTIONS["1"], prefeitura: OPTIONS["4"], cooperativa: OPTIONS["5"],
  investidor: OPTIONS["6"], parceiro: OPTIONS["6"], imprensa: OPTIONS["7"],
  "cidadão": OPTIONS["7"], cidadao: OPTIONS["7"], outro: OPTIONS["7"]
};
const QUESTIONS = {
  profile: "Bem-vindo ao atendimento comercial da CicloBem!\n\nQual é o seu perfil?\n1. Empresa ou indústria\n2. Shopping ou comércio\n3. Condomínio\n4. Prefeitura ou órgão público\n5. Cooperativa\n6. Parceiro ou investidor\n7. Outro\n\nResponda com o número. Digite 0 para falar com uma pessoa.",
  name: "Como podemos chamar você? Informe seu nome.",
  organization: "Qual é o nome da empresa, instituição ou organização? Caso seja pessoa física, responda 'Pessoa física'.",
  city: "Em qual cidade e estado (UF) seria a instalação ou operação? Ex.: Vitória/ES.",
  installation: "Qual seria o local ou tipo de instalação? Ex.: supermercado, condomínio, empresa ou espaço público.",
  volume: "Qual é o fluxo diário estimado de pessoas ou embalagens no local? Se não souber, responda 'Não sei'.",
  model: "Qual modalidade de interesse?\n1. Aquisição\n2. Locação\n3. Parceria ou operação conjunta\n4. Ainda não definido\n\nAs modalidades estão sujeitas à avaliação comercial.",
  done: "Sua solicitação já foi registrada. Para falar com a equipe, digite 0.",
  human: "Registrei o pedido de atendimento humano. Nossa equipe comercial dará continuidade assim que possível.",
  opt_out: "Entendido. Não enviaremos novas mensagens de acompanhamento. Para reabrir uma solicitação, envie INICIAR."
};
const MODELS = {
  "1": "Aquisição", "2": "Locação",
  "3": "Parceria ou operação conjunta", "4": "Ainda não definido"
};
const trim = v => String(v || "").trim().slice(0, 240);

function readSiteForm(text) {
  if (!text.includes("[Contato Site CicloBem]")) return null;
  const fields = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^(Perfil|Nome|Organização|E-mail|Telefone|Mensagem):\s*(.*)$/i);
    if (match) fields[match[1].toLowerCase()] = trim(match[2]);
  }
  return fields;
}

export function processLead(inputLead, incoming) {
  const lead = { stage: "profile", status: "NOVO", ...inputLead };
  const raw = trim(incoming);
  const text = raw.toLowerCase();
  if (/^(parar|sair|cancelar|stop)$/i.test(text)) {
    return { lead: { ...lead, stage: "opt_out", status: "OPT_OUT" }, reply: QUESTIONS.opt_out };
  }
  if (/^(0|humano|atendente|pessoa|atendimento humano)$/i.test(text)) {
    return { lead: { ...lead, stage: "human", status: "HUMANO_PENDENTE" }, reply: QUESTIONS.human };
  }
  if (/^(iniciar|reiniciar|menu)$/i.test(text)) {
    return { lead: { ...lead, stage: "profile", status: "NOVO" }, reply: QUESTIONS.profile };
  }
  if (lead.stage === "opt_out" || lead.stage === "human" || lead.stage === "done") {
    // Não interromper atendente e não enviar respostas recorrentes após conclusão/opt-out.
    return { lead, reply: null };
  }
  if (lead.stage === "profile") {
    const fields = readSiteForm(String(incoming));
    if (fields) {
      lead.profile = FORM_PROFILES[fields["perfil"]?.toLowerCase()] || OPTIONS["7"];
      if (fields["nome"]) lead.contact_name = fields["nome"];
      if (fields["organização"]) lead.organization = fields["organização"];
      if (fields["e-mail"]) lead.email = fields["e-mail"];
      lead.stage = lead.contact_name ? (lead.organization ? "city" : "organization") : "name";
      lead.status = "EM_QUALIFICACAO";
      return { lead, reply: QUESTIONS[lead.stage] };
    }
    const selection = OPTIONS[text] ||
      FORM_PROFILES[text] ||
      (text.includes("empresa") ? OPTIONS["1"] :
      text.includes("condom") ? OPTIONS["3"] :
      text.includes("shopping") || text.includes("comércio") ? OPTIONS["2"] : null);
    if (!selection) return { lead, reply: QUESTIONS.profile };
    lead.profile = selection;
    lead.stage = "name";
  } else if (lead.stage === "name") {
    if (raw.length < 2) return { lead, reply: QUESTIONS.name };
    lead.contact_name = raw;
    lead.stage = "organization";
  } else if (lead.stage === "organization") {
    if (raw.length < 2) return { lead, reply: QUESTIONS.organization };
    lead.organization = raw;
    lead.stage = "city";
  } else if (lead.stage === "city") {
    if (raw.length < 2) return { lead, reply: QUESTIONS.city };
    lead.city_state = raw;
    lead.stage = "installation";
  } else if (lead.stage === "installation") {
    if (raw.length < 2) return { lead, reply: QUESTIONS.installation };
    lead.installation = raw;
    lead.stage = "volume";
  } else if (lead.stage === "volume") {
    if (raw.length < 1) return { lead, reply: QUESTIONS.volume };
    lead.daily_flow = raw;
    lead.stage = "model";
  } else if (lead.stage === "model") {
    const choice = MODELS[text] || (text.includes("parceria") ? MODELS["3"] : null);
    if (!choice) return { lead, reply: QUESTIONS.model };
    lead.commercial_model = choice;
    lead.stage = "done";
    lead.status = "QUALIFICADO";
    return {
      lead,
      reply: "Obrigado! Seu interesse foi registrado.\n" +
        "Perfil: " + lead.profile + "\n" +
        "Localidade: " + lead.city_state + "\n" +
        "Modalidade: " + lead.commercial_model + "\n\n" +
        "A equipe comercial da CicloBem analisará seu caso. Para atendimento humano, digite 0."
    };
  }
  lead.status = "EM_QUALIFICACAO";
  return { lead, reply: QUESTIONS[lead.stage] };
}
