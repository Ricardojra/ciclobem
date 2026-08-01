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
      credentials: 'same-origin'
    };

    const token = window.CicloBem.storage.getToken();
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
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

      if (!response.ok) {
        const error = (payload && payload.error) || { code: 'REQUEST_FAILED', message: `HTTP ${response.status}` };
        return { ok: false, data: null, error };
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
    put: (path, body) => request('PUT', path, body),
    del: (path) => request('DELETE', path)
  };
})();
