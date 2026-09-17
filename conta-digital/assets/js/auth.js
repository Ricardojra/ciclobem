(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  const CicloBem = window.CicloBem;

  async function login(email, password) {
    // TRANSPORT-COMPAT-01: o backend canônico emite cookie HttpOnly; o
    // backend homologado em produção retorna { token, user }. Quando um
    // token Bearer é emitido ele é guardado em sessionStorage (nunca
    // localStorage) e anexado pelo apiClient.
    const response = await CicloBem.api.post('/auth/login', { email, password });

    if (response.ok) {
      if (response.data && typeof response.data.token === 'string' && response.data.token) {
        CicloBem.storage.setSessionToken(response.data.token);
      }
      CicloBem.storage.setUser(response.data.user);
      CicloBem.logger.info('Login successful');
      return response.data;
    } else {
      CicloBem.logger.warn('Login failed', { code: response.error?.code });
      throw new Error(response.error?.message || 'Login failed');
    }
  }

  async function logout() {
    try {
      await CicloBem.api.post('/auth/logout');
    } catch (error) {
      CicloBem.logger.warn('Logout API call failed', error);
    } finally {
      CicloBem.storage.clearAuth();
      CicloBem.logger.info('Logout completed');
    }
  }

  // Hint otimista para o router; o servidor continua sendo a autoridade
  // (/auth/me valida a sessão real a cada carregamento protegido).
  function isAuthenticated() {
    return !!CicloBem.storage.getUser();
  }

  function getUser() {
    return CicloBem.storage.getUser();
  }

  function clearAuth() {
    CicloBem.storage.clearAuth();
  }

  async function loadCurrentUser() {
    const response = await CicloBem.api.get('/auth/me');
    if (response.ok) {
      CicloBem.storage.setUser(response.data.user);
      return response.data.user;
    } else {
      if (response.error?.code === 'TOKEN_INVALID' ||
          response.error?.code === 'TOKEN_REQUIRED' ||
          response.error?.code === 'UNAUTHENTICATED' ||
          response.error?.code === 'SESSION_EXPIRED' ||
          response.error?.code === 'SESSION_REVOKED') {
        clearAuth();
      }
      throw new Error(response.error?.message || 'Falha ao carregar usuário.');
    }
  }

  // Autoridade do servidor: resolve a sessão real via /auth/me.
  // Retorna o usuário canônico ou null — nunca lança. O router usa isto
  // para proteger rotas (o hint em sessionStorage não decide acesso).
  async function checkSession() {
    try {
      return await loadCurrentUser();
    } catch (e) {
      return null;
    }
  }

  CicloBem.auth = {
    login,
    logout,
    isAuthenticated,
    getUser,
    clearAuth,
    loadCurrentUser,
    checkSession
  };
})();
