(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  const PREFIX = 'cb_conta_digital_';

  function getToken() {
    try {
      return window.localStorage.getItem(PREFIX + 'token') || null;
    } catch (e) {
      return null;
    }
  }

  function setToken(token) {
    window.localStorage.setItem(PREFIX + 'token', token);
  }

  function getUser() {
    try {
      const raw = window.localStorage.getItem(PREFIX + 'user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setUser(user) {
    window.localStorage.setItem(PREFIX + 'user', JSON.stringify(user));
  }

  function clearAuth() {
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
