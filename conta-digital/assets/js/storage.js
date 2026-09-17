(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  const PREFIX = 'cb_conta_digital_';

  // AUTH-SESSION-HARDENING-01 + TRANSPORT-COMPAT-01:
  // O backend canônico emite sessão em cookie HttpOnly (nada é persistido).
  // O backend atualmente homologado em produção responde /auth/login com
  // Bearer JWT — nesse caso o token vive SOMENTE em sessionStorage (mesmo
  // modelo da versão publicada; morre com a aba, nunca em localStorage).
  // Aqui ficam também dados não sensíveis de UI (perfil mínimo).

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

  function setSessionToken(token) {
    try {
      if (typeof token === 'string' && token.length > 0) {
        window.sessionStorage.setItem(PREFIX + 'token', token);
      }
    } catch (e) {
      console.error('[STORAGE] failed to save session token');
    }
  }

  function getSessionToken() {
    try {
      return window.sessionStorage.getItem(PREFIX + 'token');
    } catch (e) {
      return null;
    }
  }

  function clearAuth() {
    window.sessionStorage.removeItem(PREFIX + 'user');
    window.localStorage.removeItem(PREFIX + 'user');
    // Remove qualquer token legado que possa ter restado de versões antigas.
    window.sessionStorage.removeItem(PREFIX + 'token');
    window.localStorage.removeItem(PREFIX + 'token');
  }

  window.CicloBem.storage = {
    getUser,
    setUser,
    setSessionToken,
    getSessionToken,
    clearAuth
  };
})();
