(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};

  const DEFAULT_TIMEOUT = 20000;

  async function request(method, path, body) {
    const url = `${window.CicloBem.env.API_BASE_URL}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      // Cookie de sessão HttpOnly é a credencial canônica; incluir também
      // em origens cruzadas confiadas (API e app podem diferir de origem).
      credentials: 'include'
    };

    // TRANSPORT-COMPAT-01: quando o backend emite Bearer JWT (modelo
    // homologado em produção), anexa o token da sessão. Com o backend
    // canônico (cookie HttpOnly) este header simplesmente não existe.
    const sessionToken = window.CicloBem.storage && window.CicloBem.storage.getSessionToken
      ? window.CicloBem.storage.getSessionToken()
      : null;
    if (sessionToken) {
      options.headers['Authorization'] = `Bearer ${sessionToken}`;
    }

    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
      options.signal = controller.signal;

      const response = await fetch(url, options);
      clearTimeout(id);

      let payload = null;
      const text = await response.text();
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch (e) {
          payload = { ok: false, data: null, error: { code: 'PARSE_ERROR', message: text } };
        }
      }

      // Se token expirou ou é inválido, limpa a sessão e volta para login
      if (response.status === 401) {
        if (window.CicloBem.auth && typeof window.CicloBem.auth.clearAuth === 'function') {
          window.CicloBem.auth.clearAuth();
        }
        if (!window.location.hash.includes('login') && window.CicloBem.router) {
          window.CicloBem.router.navigate('login');
        }
      }

      if (!response.ok) {
        const error = (payload && payload.error) || { code: 'REQUEST_FAILED', message: `HTTP ${response.status}` };
        return { ok: false, data: null, error };
      }

      // Sinaliza quando a API pública está identificada como ambiente de desenvolvimento.
      if (payload && payload.data && payload.data.environment === 'development') {
        CicloBem.logger.warn('API pública em ambiente de desenvolvimento — bloqueio de produção');
      }

      // Normaliza envelope { success, data, error, meta } do backend
      if (payload && typeof payload.success === 'boolean') {
        return { ok: payload.success, data: payload.data, error: payload.error };
      }

      return payload && typeof payload.ok === 'boolean'
        ? payload
        : { ok: true, data: payload, error: null };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { ok: false, data: null, error: { code: 'TIMEOUT', message: 'A requisição demorou demais.' } };
      }
      return { ok: false, data: null, error: { code: 'NETWORK_ERROR', message: err.message || 'Erro de conexão.' } };
    }
  }

  window.CicloBem.api = {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
    patch: (path, body) => request('PATCH', path, body),
    put: (path, body) => request('PUT', path, body),
    del: (path) => request('DELETE', path)
  };
})();
