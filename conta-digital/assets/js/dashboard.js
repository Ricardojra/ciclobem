(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  window.CicloBem.contaDigital = window.CicloBem.contaDigital || {};
  const CicloBem = window.CicloBem;
  const formatMoney = CicloBem.money.formatCentsBRL;
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));

  const ICON_PIX = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 3-3 3-3-3 3-3z"/><path d="M2 12l3-3 3 3-3 3-3-3z"/><path d="M22 12l-3-3-3 3 3 3 3-3z"/><path d="M12 22l-3-3 3-3 3 3-3 3z"/></svg>';
  const ICON_QR = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>';
  const ICON_CREDIT = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/><polyline points="1 20 1 14 7 14"/></svg>';
  const ICON_DEBIT = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>';

  function firstName(user) {
    const nome = user && user.nome ? String(user.nome).trim() : '';
    return nome ? nome.split(/\s+/)[0] : '';
  }

  function txIsDebit(c) {
    const type = c.type || '';
    return type.indexOf('DEBIT') === 0 || type === 'CREDIT_REFUND' || type === 'ADJUSTMENT';
  }

  function txTitle(c) {
    const type = c.type || '';
    if (type === 'DEBIT_REDEMPTION') return 'Resgate';
    if (type === 'CREDIT_REFUND') return 'Estorno';
    if (type === 'ADJUSTMENT') return 'Ajuste';
    const materiais = (c.itens || []).map((item) => item.material).filter(Boolean);
    return materiais.length ? materiais.join(', ') : 'Crédito por reciclagem';
  }

  function txMeta(c) {
    const d = c.date_time ? new Date(c.date_time) : null;
    const data = d && !isNaN(d.getTime()) ? d.toLocaleString('pt-BR') : 'Sem data identificada';
    return `${data} · ${c.source_name || 'CicloBem'}`;
  }

  function txDisplayAmount(c, isDebit) {
    const raw = c.amount_cents ?? c.credited_value_cents;
    const cents = Number(raw);
    const formatted = formatMoney(Number.isSafeInteger(cents) ? cents : null);
    if (!Number.isSafeInteger(cents)) return formatted;
    if (isDebit) return cents > 0 ? `-${formatted}` : formatted;
    return cents > 0 ? `+${formatted}` : formatted;
  }

  const ContaDigitalDashboard = {
    init() {
      this.render();
      this.loadData();
      if (window.CicloBem.menu) window.CicloBem.menu.render('dashboard');
    },

    render() {
      const root = document.getElementById('conta-digital-root');
      if (!root) return;
      const user = CicloBem.auth.getUser();
      const nome = firstName(user);

      root.innerHTML = `
        <div class="cb-page">
          <div class="cb-home__greeting">
            <h1>${nome ? `Olá, ${escapeHtml(nome)}` : 'Olá'}</h1>
            <p>Mais que uma conta. Um futuro mais circular.</p>
          </div>

          <section class="cb-card cb-card--financial cb-balance-hero" aria-label="Saldo">
            <p class="cb-card__label">Disponível para resgate</p>
            <p class="cb-amount cb-amount--on-dark" id="dashboard-saldo"><span class="cb-skeleton cb-skeleton--amount"></span></p>
            <div class="cb-balance-hero__stats">
              <div class="cb-stat">
                <p class="cb-stat__label">Ganhos reciclando</p>
                <p class="cb-stat__value" id="dashboard-ganhos">—</p>
              </div>
              <div class="cb-stat">
                <p class="cb-stat__label">Coletas</p>
                <p class="cb-stat__value" id="dashboard-coletas">—</p>
              </div>
              <div class="cb-stat">
                <p class="cb-stat__label">Em processamento</p>
                <p class="cb-stat__value cb-stat__value--pending" id="dashboard-pendente">—</p>
              </div>
            </div>
          </section>

          <div class="cb-actions">
            <a href="#/resgatar" class="cb-action cb-action--primary">
              <span class="cb-action__icon">${ICON_PIX}</span>
              Resgatar
            </a>
            <a href="#/qrcode" class="cb-action">
              <span class="cb-action__icon">${ICON_QR}</span>
              Meu QR
            </a>
          </div>

          <section class="cb-card cb-card--impact" id="dashboard-impacto-card" style="display:none;">
            <p class="cb-card__label">Seu impacto</p>
            <p class="cb-stat__value cb-stat__value--credit" id="dashboard-impacto" style="margin:0;">—</p>
            <p class="cb-hint" style="margin:var(--space-1) 0 0;" id="dashboard-impacto-sub"></p>
          </section>

          <section class="cb-section">
            <h2 class="cb-section__title">Atividades recentes</h2>
            <div class="cb-card cb-card--flat" id="dashboard-historico" aria-live="polite">
              <div class="cb-skeleton cb-skeleton--row"></div>
              <div class="cb-skeleton cb-skeleton--row"></div>
            </div>
            <a href="#/atividades" class="cb-button cb-button--ghost cb-button--full" style="margin-top:var(--space-2);">Ver todas as atividades</a>
          </section>
        </div>
      `;
    },

    async loadData() {
      const ganhosEl = document.getElementById('dashboard-ganhos');
      const saldoEl = document.getElementById('dashboard-saldo');
      const pendenteEl = document.getElementById('dashboard-pendente');
      const coletasEl = document.getElementById('dashboard-coletas');
      const historicoEl = document.getElementById('dashboard-historico');

      try {
        const [saldoRes, resumoRes, historicoRes] = await Promise.all([
          CicloBem.api.get('/conta-digital/saldo'),
          CicloBem.api.get('/conta-digital/resumo'),
          CicloBem.api.get('/conta-digital/historico')
        ]);

        if (saldoRes.ok && saldoRes.data && saldoRes.data.saldo) {
          const saldo = saldoRes.data.saldo;
          const trustworthy = saldo.balance_status === 'AVAILABLE' && saldo.financial_reconciliation_check === true;
          saldoEl.textContent = trustworthy ? formatMoney(saldo.withdrawable_balance_cents) : 'Indisponível';
          ganhosEl.textContent = formatMoney(saldo.total_recycling_earnings_cents);
          pendenteEl.textContent = formatMoney(saldo.pending_redemptions_cents);
        } else {
          saldoEl.textContent = 'Indisponível';
          ganhosEl.textContent = 'Indisponível';
          pendenteEl.textContent = 'Indisponível';
        }

        if (resumoRes.ok && resumoRes.data) {
          const totalColetas =
            resumoRes.data.saldo?.total_coletas ||
            resumoRes.data.impacto?.total_coletas ||
            resumoRes.data.total_coletas ||
            null;
          coletasEl.textContent = totalColetas == null ? 'Indisponível' : totalColetas;

          const impacto = resumoRes.data.impacto;
          if (impacto && (Number(impacto.kg_reciclados) > 0 || Number(impacto.total_coletas) > 0)) {
            const card = document.getElementById('dashboard-impacto-card');
            const val = document.getElementById('dashboard-impacto');
            const sub = document.getElementById('dashboard-impacto-sub');
            if (card && val) {
              const kg = Number(impacto.kg_reciclados);
              val.textContent = Number.isFinite(kg)
                ? `${kg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg reciclados`
                : 'Impacto disponível';
              if (sub) {
                const co2 = Number(impacto.co2_estimado_kg);
                sub.textContent = Number.isFinite(co2) && co2 > 0
                  ? `≈ ${co2.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg de CO₂ evitados (estimativa)`
                  : '';
              }
              card.style.display = 'block';
            }
          }
        } else {
          coletasEl.textContent = 'Indisponível';
        }

        if (historicoRes.ok && historicoRes.data && Array.isArray(historicoRes.data.coletas)) {
          const coletas = historicoRes.data.coletas.slice(0, 5);
          if (coletas.length === 0) {
            historicoEl.innerHTML = `
              <div class="cb-state">
                <div class="cb-state__icon">${ICON_CREDIT}</div>
                <p class="cb-state__title">Nenhuma atividade ainda</p>
                <p class="cb-state__text">Recicle e seus créditos aparecem aqui.</p>
              </div>`;
          } else {
            historicoEl.innerHTML = coletas.map((c) => {
              const isDebit = txIsDebit(c);
              return `
                <a href="#/atividades" class="cb-tx-row" style="text-decoration:none;color:inherit;">
                  <span class="cb-tx-row__icon cb-tx-row__icon--${isDebit ? 'debit' : 'credit'}">${isDebit ? ICON_DEBIT : ICON_CREDIT}</span>
                  <span class="cb-tx-row__body">
                    <span class="cb-tx-row__title">${escapeHtml(txTitle(c))}</span>
                    <span class="cb-tx-row__meta">${escapeHtml(txMeta(c))}</span>
                  </span>
                  <span class="cb-tx-row__amount cb-tx-row__amount--${isDebit ? 'debit' : 'credit'}">${escapeHtml(txDisplayAmount(c, isDebit))}</span>
                </a>
              `;
            }).join('');
          }
        } else {
          historicoEl.innerHTML = '<p class="cb-hint" style="text-align:center;padding:var(--space-4);">Histórico indisponível no momento.</p>';
        }
      } catch (error) {
        if (saldoEl) saldoEl.textContent = 'Indisponível';
        if (historicoEl) historicoEl.innerHTML = '<p class="cb-hint" style="text-align:center;padding:var(--space-4);">Erro ao carregar dados.</p>';
        CicloBem.logger.error('Dashboard load error', error);
      }
    }
  };

  CicloBem.contaDigital.dashboard = ContaDigitalDashboard;
})();
