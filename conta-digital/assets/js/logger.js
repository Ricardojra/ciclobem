(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};

  function log(level, message, data) {
    if (window.CicloBem.env && window.CicloBem.env.debug) {
      const ts = new Date().toISOString();
      console.log(`[${ts}] [${level}] ${message}`, data || '');
    }
  }

  window.CicloBem.logger = {
    info: (message, data) => log('INFO', message, data),
    warn: (message, data) => log('WARN', message, data),
    error: (message, data) => log('ERROR', message, data)
  };
})();
