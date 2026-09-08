(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  const PREFIX = 'cb_conta_digital_';

  function getToken() {
    try {
      return window.sessionStorage.getItem(PREFIX + 'token') || null;
    } catch (e) {
      return null;
    }
  }

  function setToken(token) {
    try {
      window.sessionStorage.setItem(PREFIX + 'token', token);
    } catch (e) {
      console.error('[STORAGE] failed to save token');
    }
  }

  function getUser() {
    try {
      const raw = window.sessionStorage.getItem(PREFIX + 'user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setUser(user) {
    try {
      const sessionUser = user ? { id: user.id, nome: user.nome, tipo: user.tipo, status: user.status } : null;
      window.sessionStorage.setItem(PREFIX + 'user', JSON.stringify(sessionUser));
    } catch (e) {
      console.error('[STORAGE] failed to save user');
    }
  }

  function clearAuth() {
    window.sessionStorage.removeItem(PREFIX + 'token');
    window.sessionStorage.removeItem(PREFIX + 'user');
    window.localStorage.removeItem(PREFIX + 'token');
    window.localStorage.removeItem(PREFIX + 'user');
  }

  window.CicloBem.storage = {
    getToken,
    setToken,
    getUser,
    setUser,
    clearAuth
  };
})();
