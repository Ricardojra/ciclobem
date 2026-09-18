(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};

  const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const isTailscale = window.location.hostname.endsWith('.ts.net');

  function getApiBaseUrl() {
    if (isLocalhost) return 'http://localhost:3007/api/v1';
    if (isTailscale) return '/api/v1';
    return 'https://api.ciclobem.com.br/api/v1';
  }

  // DATA_CONTRACT_GAP flags: capacidades cujo contrato ainda não existe no
  // backend homologado ficam OFF — a UI mostra "Em breve", nunca dado fake.
  // Quando o backend canônico for promovido, basta ligar a flag.
  const FEATURES = {
    passkeys: true,       // /auth/passkeys/* no backend pilot (JWT lineage)
    sessions: false,      // /auth/sessions ausente em produção
    impacto: true,        // /conta-digital/resumo.impacto existe e é autoritativo
    locais: false,        // sem endpoint público de locais
    notificacoes: false   // sem backend de notificações
  };

  window.CicloBem.env = {
    API_BASE_URL: getApiBaseUrl(),
    APP_NAME: 'Conta CicloBem',
    VERSION: '1.0.0',
    PWA_CACHE_VERSION: 'ciclobem-conta-static-v7',
    BUILD: 'canonical/conta-digital-01',
    FEATURES,
    debug: isLocalhost
  };
})();
