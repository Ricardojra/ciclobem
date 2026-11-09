/* Integração comercial CicloBem — ativar apenas após homologação do novo número.
 * Nunca inserir tokens ou credenciais neste arquivo público.
 */
(function () {
  "use strict";
  // Número reservado para implantação: preencher após registro e teste na Meta.
  // Apenas dígitos com DDI: 55 + DDD + telefone.
  const NEW_COMMERCIAL_NUMBER = "";
  const CURRENT_WHATSAPP_NUMBER = "5521995500927";
  const enabled = /^55\d{10,11}$/.test(NEW_COMMERCIAL_NUMBER);
  const phone = enabled ? NEW_COMMERCIAL_NUMBER : CURRENT_WHATSAPP_NUMBER;

  function origin() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes("empresas")) return "pagina-empresas";
    if (path.includes("prefeituras")) return "pagina-prefeituras";
    return "site-institucional";
  }

  function url(message, source) {
    const text = String(message || "Olá, vim pelo site CicloBem e gostaria de saber mais.");
    // O identificador de origem é enviado somente quando o número novo for ativado.
    const prefix = enabled ? "[CICLOBEM_SITE:" + (source || origin()) + "]\n" : "";
    return "https://wa.me/" + phone + "?text=" + encodeURIComponent(prefix + text);
  }

  window.CicloBemWhatsApp = Object.freeze({ url, enabled });

  document.addEventListener("DOMContentLoaded", function () {
    if (!enabled) return; // não alterar os links atuais durante a preparação
    document.querySelectorAll('a[href*="wa.me/"]').forEach(function (link) {
      try {
        const old = new URL(link.href);
        const message = old.searchParams.get("text") || undefined;
        link.href = url(message, link.dataset.waSource || origin());
        link.rel = "noopener noreferrer";
      } catch (e) {
        // Um link inválido não deve interromper a página.
      }
    });
  });
}());
