/* Integração comercial CicloBem — ativar apenas após homologação do novo número.
 * Nunca inserir tokens ou credenciais neste arquivo público.
 */
(function () {
  "use strict";
  // Número designado pelo CTO: +55 21 99550-0927; já é o número público atual.
  // A ativação comercial depende de registro Meta e homologação end-to-end.
  const TARGET_COMMERCIAL_NUMBER = "5521995500927";
  const CURRENT_WHATSAPP_NUMBER = "5521995500927";
  const ACTIVATION_APPROVED = false; // SOMENTE alterar após GO explícito do CTO.
  const enabled = ACTIVATION_APPROVED && /^55\d{10,11}$/.test(TARGET_COMMERCIAL_NUMBER);
  const phone = enabled ? TARGET_COMMERCIAL_NUMBER : CURRENT_WHATSAPP_NUMBER;

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
