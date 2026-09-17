(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  window.CicloBem.contaDigital = window.CicloBem.contaDigital || {};
  const CicloBem = window.CicloBem;
  const formatMoney = CicloBem.money.formatCentsBRL;
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));

  const ICON_CREDIT = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>';
  const ICON_DEBIT = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>';
  const PAGE_SIZE = 20;

  function txKind(c) {
    const type = c.type || '';
    if (type.indexOf('DEBIT') === 0) return 'debit';
    if (type.indexOf('CREDIT_REFUND') === 0 || type.indexOf('ADJUSTMENT') === 0) return 'debit';
    return 'credit';
  }

  function txTitle(c) {
    const type = c.type || '';
    if (type === 'DEBIT_REDEMPTION') return 'Resgate';
    if (type === 'CREDIT_REFUND') return 'Estorno';
    if (type === 'ADJUSTMENT') return 'Ajuste';
    const materiais = (c.itens || []).map((item) => item.material).filter(Boolean);
    return materiais.length ? materiais.join(', ') : 'Crédito por reciclagem';
  }

  function txDate(c) {
    const d = c.date_time ? new Date(c.date_time) : null;
    return d && !isNaN(d.getTime()) ? d : null;
  }

  function txMeta(c) {
    const d = txDate(c);
    const data = d ? d.toLocaleString('pt-BR') : 'Sem data identificada';
    const origem = c.source_name || 'CicloBem';
    return `${data} · ${origem}`;
  }

  function txCents(c) {
    const raw = c.amount_cents ?? c.credited_value_cents;
    const n = Number(raw);
    return Number.isSafeInteger(n) ? n : null;
  }

  function txAmount(c) {
    return formatMoney(txCents(c));
  }

  function txDisplayAmount(c, isDebit) {
    const cents = txCents(c);
    const formatted = formatMoney(cents);
    if (cents == null) return formatted;
    if (!Number.isSafeInteger(cents)) return formatted;
    if (isDebit) return cents > 0 ? `-${formatted}` : formatted;
    return cents > 0 ? `+${formatted}` : formatted;
  }

  function txStatus(c) {
    const s = c.status_pagamento || c.status_operacional || '';
    const map = {
      concluido: 'Concluído', concluida: 'Concluída', pago: 'Pago', paga: 'Paga',
      confirmado: 'Confirmado', registrada: 'Registrada', registrado: 'Registrado',
      processando: 'Processando', em_revisao: 'Em análise', aprovado: 'Aprovado',
      solicitado: 'Solicitado', pendente: 'Pendente', cancelado: 'Cancelado'
    };
    return map[s] || s || '';
  }

  function txDetail(c) {
    const rows = [];
    const d = txDate(c);
    if (d) rows.push(['Data e hora', d.toLocaleString('pt-BR')]);
    rows.push(['Origem', c.source_name || 'CicloBem']);
    const qty = Number(c.quantity);
    if (Number.isFinite(qty) && qty > 0) rows.push(['Quantidade', `${qty} ${c.unit || ''}`.trim()]);
    (c.itens || []).forEach((item) => {
      const bits = [item.material];
      const peso = Number(item.peso_kg);
      if (Number.isFinite(peso) && peso > 0) bits.push(`${peso} kg`);
      if (item.nome) bits.push(item.nome);
      if (item.ean) bits.push(`EAN ${item.ean}`);
      rows.push(['Item', bits.filter(Boolean).join(' · ')]);
    });
    const status = txStatus(c);
    if (status) rows.push(['Status', status]);
    rows.push(['Valor', txAmount(c)]);
    return rows
      .filter(([, v]) => v)
      .map(([label, v]) => `<div class="cb-list-row"><span class="cb-list-row__label">${escapeHtml(label)}</span><span class="cb-list-row__value">${escapeHtml(v)}</span></div>`)
      .join('');
  }

  const ContaDigitalAtividades = {
    _items: [],
    _shown: 0,

    init() {
      this._items = [];
      this._shown = 0;
      this.render();
      this.load();
      if (window.CicloBem.menu) window.CicloBem.menu.render('atividades');
    },

    render() {
      const root = document.getElementById('conta-digital-root');
      if (!root) return;

      root.innerHTML = `
        <div class="cb-page">
          <header class="cb-header">
            <div>
              <h1 class="cb-header__title">Atividades</h1>
              <p class="cb-header__sub">Seu histórico de reciclagens e movimentações.</p>
            </div>
          </header>
          <div class="cb-card cb-card--flat" id="atividades-list" aria-live="polite">
            <div class="cb-skeleton cb-skeleton--row"></div>
            <div class="cb-skeleton cb-skeleton--row"></div>
            <div class="cb-skeleton cb-skeleton--row"></div>
          </div>
          <button type="button" class="cb-button cb-button--secondary cb-button--full" id="atividades-more" style="display:none;">Ver mais</button>
        </div>
      `;

      const more = document.getElementById('atividades-more');
      if (more) more.addEventListener('click', () => this.renderPage());
    },

    renderPage() {
      const listEl = document.getElementById('atividades-list');
      const moreBtn = document.getElementById('atividades-more');
      if (!listEl) return;

      if (this._shown === 0) listEl.innerHTML = '';
      const next = this._items.slice(this._shown, this._shown + PAGE_SIZE);
      this._shown += next.length;

      const html = next.map((c, i) => {
        const idx = this._shown - next.length + i;
        const kind = txKind(c);
        const isDebit = kind === 'debit';
        return `
          <div class="atividades-item">
            <button type="button" class="cb-tx-row atividades-toggle" data-idx="${idx}" aria-expanded="false" style="width:100%;background:none;border:none;padding:var(--space-3) 0;text-align:left;cursor:pointer;font:inherit;color:inherit;">
              <span class="cb-tx-row__icon cb-tx-row__icon--${isDebit ? 'debit' : 'credit'}">${isDebit ? ICON_DEBIT : ICON_CREDIT}</span>
              <span class="cb-tx-row__body">
                <span class="cb-tx-row__title">${escapeHtml(txTitle(c))}</span>
                <span class="cb-tx-row__meta">${escapeHtml(txMeta(c))}</span>
              </span>
              <span class="cb-tx-row__amount cb-tx-row__amount--${isDebit ? 'debit' : 'credit'}">${escapeHtml(txDisplayAmount(c, isDebit))}</span>
            </button>
            <div class="atividades-detail" id="atividades-detail-${idx}" style="display:none;border-bottom:1px solid var(--color-border);padding:0 0 var(--space-3) var(--space-12);">
              ${txDetail(c)}
            </div>
          </div>
        `;
      }).join('');

      listEl.insertAdjacentHTML('beforeend', html);

      listEl.querySelectorAll('.atividades-toggle').forEach((btn) => {
        if (btn.dataset.bound) return;
        btn.dataset.bound = 'true';
        btn.addEventListener('click', () => {
          const detail = document.getElementById(`atividades-detail-${btn.dataset.idx}`);
          if (!detail) return;
          const open = detail.style.display !== 'none';
          detail.style.display = open ? 'none' : 'block';
          btn.setAttribute('aria-expanded', String(!open));
        });
      });

      if (moreBtn) moreBtn.style.display = this._shown < this._items.length ? 'block' : 'none';
    },

    async load() {
      const listEl = document.getElementById('atividades-list');
      const moreBtn = document.getElementById('atividades-more');
      try {
        const res = await CicloBem.api.get('/conta-digital/historico');
        if (!res.ok || !res.data) {
          listEl.innerHTML = `
            <div class="cb-state">
              <div class="cb-state__icon cb-state__icon--error">!</div>
              <p class="cb-state__title">Não foi possível carregar</p>
              <p class="cb-state__text">Tente novamente em alguns instantes.</p>
            </div>`;
          return;
        }

        this._items = Array.isArray(res.data.coletas) ? res.data.coletas : [];
        if (this._items.length === 0) {
          listEl.innerHTML = `
            <div class="cb-state">
              <div class="cb-state__icon">${ICON_CREDIT}</div>
              <p class="cb-state__title">Nenhuma atividade ainda</p>
              <p class="cb-state__text">Recicle em uma CicloMachine ou CicloPonto e seus créditos aparecem aqui.</p>
            </div>`;
          if (moreBtn) moreBtn.style.display = 'none';
          return;
        }

        this.renderPage();
      } catch (error) {
        if (listEl) {
          listEl.innerHTML = `
            <div class="cb-state">
              <div class="cb-state__icon cb-state__icon--error">!</div>
              <p class="cb-state__title">Erro de conexão</p>
              <p class="cb-state__text">Verifique sua internet e tente novamente.</p>
            </div>`;
        }
        CicloBem.logger.error('Atividades load error', error);
      }
    }
  };

  CicloBem.contaDigital.atividades = ContaDigitalAtividades;
})();
