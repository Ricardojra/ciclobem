(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  const CicloBem = window.CicloBem;

  function parseHash() {
    const hash = window.location.hash.replace(/^#\/?/, '') || '';
    const [route, queryString] = hash.split('?');
    const params = {};
    if (queryString) {
      const search = new URLSearchParams(queryString);
      search.forEach((value, key) => { params[key] = value; });
    }
    return { route: route || 'home', params };
  }

  function navigate(route) {
    window.location.hash = `/${route}`;
  }

  function dispatch() {
    const { route, params } = parseHash();
    const root = document.getElementById('conta-digital-root');
    if (!root) return;

    root.innerHTML = '';

    if (route === 'ativar') {
      if (window.CicloBem.contaDigital && window.CicloBem.contaDigital.ativar) {
        window.CicloBem.contaDigital.ativar.init(params);
      } else {
        root.innerHTML = '<p class="cb-error">Módulo de ativação não carregado.</p>';
      }
      return;
    }

    if (route === 'cadastro') {
      if (window.CicloBem.contaDigital && window.CicloBem.contaDigital.cadastro) {
        window.CicloBem.contaDigital.cadastro.init(params);
      } else {
        root.innerHTML = '<p class="cb-error">Módulo de cadastro não carregado.</p>';
      }
      return;
    }

    if (route === 'login' || (!CicloBem.auth.isAuthenticated() && route !== 'dashboard')) {
      if (window.CicloBem.contaDigital && window.CicloBem.contaDigital.login) {
        window.CicloBem.contaDigital.login.init();
      } else {
        root.innerHTML = '<p class="cb-error">Módulo de login não carregado.</p>';
      }
      return;
    }

    if (window.CicloBem.contaDigital && window.CicloBem.contaDigital.dashboard) {
      window.CicloBem.contaDigital.dashboard.init();
    } else {
      root.innerHTML = '<p class="cb-error">Módulo do dashboard não carregado.</p>';
    }
  }

  function init() {
    window.addEventListener('hashchange', dispatch);
    dispatch();
  }

  CicloBem.router = {
    navigate,
    dispatch,
    parseHash,
    init
  };
})();
