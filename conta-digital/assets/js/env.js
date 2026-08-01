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
  window.CicloBem.env = {
    API_BASE_URL: getApiBaseUrl(),
    APP_NAME: 'Conta CicloBem',
    VERSION: '1.0.0',
    debug: isLocalhost
  };
})();
