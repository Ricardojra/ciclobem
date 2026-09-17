(function () {
  'use strict';

  /**
   * Canonical money presentation for Conta Digital.
   *
   * Financial authority is integer cents, always produced by the backend.
   * These helpers only format/parse user-facing strings; they never
   * recompute balances.
   */
  window.CicloBem = window.CicloBem || {};

  const formatCentsBRL = (cents) => {
    if (!Number.isSafeInteger(cents)) return 'Indisponível';
    const absolute = Math.abs(cents);
    return `R$ ${cents < 0 ? '-' : ''}${Math.floor(absolute / 100)},${String(absolute % 100).padStart(2, '0')}`;
  };

  const parseMoneyToCents = (value) => {
    const match = String(value || '').trim().replace(',', '.').match(/^(\d+)(?:\.(\d{1,2}))?$/);
    if (!match) return null;
    const cents = Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0'));
    return Number.isSafeInteger(cents) ? cents : null;
  };

  window.CicloBem.money = { formatCentsBRL, parseMoneyToCents };
})();
