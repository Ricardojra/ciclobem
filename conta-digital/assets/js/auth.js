(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  const CicloBem = window.CicloBem;

  async function login(email, password) {
    const response = await CicloBem.api.post('/auth/login', { email, password });

    if (response.ok) {
      CicloBem.storage.setToken(response.data.token);
      CicloBem.storage.setUser(response.data.user);
      // Dados de autenticação não são registrados no console.
      CicloBem.logger.info('Login successful');
      return response.data;
    } else {
      CicloBem.logger.warn('Login failed', { code: response.error?.code });
      throw new Error(response.error?.message || 'Login failed');
    }
  }

  async function logout() {
    try {
      if (CicloBem.storage.getToken()) {
        await CicloBem.api.post('/auth/logout');
      }
    } catch (error) {
      CicloBem.logger.warn('Logout API call failed', error);
    } finally {
      CicloBem.storage.clearAuth();
      CicloBem.logger.info('Logout completed');
    }
  }

  function isAuthenticated() {
    const token = CicloBem.storage.getToken();
    const user = CicloBem.storage.getUser();
    if (token && !token.includes('.')) {
      clearAuth();
      return false;
    }
    return !!(token && user);
  }

  function getToken() {
    return CicloBem.storage.getToken();
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
      if (response.error?.code === 'TOKEN_INVALID' || response.error?.code === 'TOKEN_REQUIRED') {
        clearAuth();
      }
      throw new Error(response.error?.message || 'Falha ao carregar usuário.');
    }
  }

  CicloBem.auth = {
    login,
    logout,
    isAuthenticated,
    getToken,
    getUser,
    clearAuth,
    loadCurrentUser
  };
})();
