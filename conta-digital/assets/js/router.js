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

  // Rotas públicas: não exigem sessão.
  const PUBLIC_ROUTES = {
    'ativar': ['ativar', 'Módulo de ativação não carregado.'],
    'cadastro': ['cadastro', 'Módulo de cadastro não carregado.'],
    'esqueci-senha': ['esqueciSenha', 'Módulo de recuperação não carregado.'],
    'redefinir-senha': ['redefinirSenha', 'Módulo de redefinição não carregado.'],
    'ajuda': ['ajuda', 'Módulo de ajuda não carregado.']
  };

  // Rotas protegidas: exigem sessão canônica validada pelo servidor.
  const PROTECTED_MODULES = {
    'perfil': ['perfil', 'Módulo de perfil não carregado.'],
    'qrcode': ['qrcode', 'Módulo de QR Code não carregado.'],
    'resgatar': ['resgatar', 'Módulo de resgate não carregado.'],
    'atividades': ['atividades', 'Módulo de atividades não carregado.'],
    'impacto': ['impacto', 'Módulo de impacto não carregado.'],
    'seguranca': ['seguranca', 'Módulo de segurança não carregado.']
  };

  function renderChecking(root) {
    // AUTH_CHECKING: não piscar login/home antes da resposta do servidor.
    root.innerHTML = `
      <div class="conta-digital-auth">
        <div class="conta-digital-auth__logo">
          <p>Verificando sessão...</p>
        </div>
      </div>`;
  }

  function renderModule(root, moduleName, errorMsg, params) {
    const module = window.CicloBem.contaDigital && window.CicloBem.contaDigital[moduleName];
    if (module) {
      module.init(params);
    } else {
      root.innerHTML = `<p class="cb-error">${errorMsg}</p>`;
    }
  }

  async function dispatch() {
    const { route, params } = parseHash();
    const root = document.getElementById('conta-digital-root');
    if (!root) return;

    root.innerHTML = '';

    // Públicas: renderizam direto, sem consultar a sessão.
    if (PUBLIC_ROUTES[route]) {
      const [moduleName, errorMsg] = PUBLIC_ROUTES[route];
      renderModule(root, moduleName, errorMsg, params);
      return;
    }

    // AUTH_CHECKING: resolve a sessão no servidor antes de decidir
    // qualquer tela autenticada — sessionStorage não é autoridade.
    renderChecking(root);

    let user = null;
    try {
      user = await CicloBem.auth.checkSession();
    } catch (e) {
      user = null;
    }

    // hash pode ter mudado enquanto /auth/me estava em voo — re-dispatch
    if (route !== parseHash().route) {
      dispatch();
      return;
    }

    if (route === 'login') {
      if (user) {
        navigate('dashboard');
        return;
      }
      root.innerHTML = '';
      renderModule(root, 'login', 'Módulo de login não carregado.');
      return;
    }

    if (!user) {
      // UNAUTHENTICATED: qualquer rota protegida cai no login.
      root.innerHTML = '';
      renderModule(root, 'login', 'Módulo de login não carregado.');
      return;
    }

    if (PROTECTED_MODULES[route]) {
      const [moduleName, errorMsg] = PROTECTED_MODULES[route];
      root.innerHTML = '';
      renderModule(root, moduleName, errorMsg);
      return;
    }

    // home/dashboard/desconhecida → dashboard (default autenticado)
    root.innerHTML = '';
    renderModule(root, 'dashboard', 'Módulo do dashboard não carregado.');
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
