(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};

  const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

  window.CicloBem.env = {
    API_BASE_URL: isLocalhost
      ? 'http://localhost:3000/api/v1'
      : 'https://api.ciclobem.com.br/api/v1',
    APP_NAME: 'Conta CicloBem',
    VERSION: '1.0.0',
    debug: isLocalhost
  };
})();
