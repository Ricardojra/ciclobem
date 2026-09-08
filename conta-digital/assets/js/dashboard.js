(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  window.CicloBem.contaDigital = window.CicloBem.contaDigital || {};
  const CicloBem = window.CicloBem;
  const formatMoney = (cents) => {
    if (!Number.isSafeInteger(cents)) return 'Indisponível';
    const absolute = Math.abs(cents);
    return `R$ ${cents < 0 ? '-' : ''}${Math.floor(absolute / 100)},${String(absolute % 100).padStart(2, '0')}`;
  };
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));

  const ContaDigitalDashboard = {
    init() {
      this.render();
      this.loadData();
      if (window.CicloBem.menu) window.CicloBem.menu.render('dashboard');
    },

    render() {
      const root = document.getElementById('conta-digital-root');
      if (!root) return;

      root.innerHTML = `
        <div class="conta-digital-dashboard">
          <div class="dashboard-header" style="position:sticky;top:0;z-index:101;background:var(--bg-elevated,#111e33);border-bottom:1px solid var(--border,#1e3a5f);padding:20px 24px;margin:-24px -24px 24px;display:flex;justify-content:space-between;align-items:center;">
            <h1 style="font-size:22px;margin:0;">Conta CicloBem</h1>
            <button id="dashboard-logout" class="cb-button cb-button--secondary" style="padding:8px 14px;font-size:13px;">Sair</button>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:16px;">
            <div class="dashboard-card" style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;">
              <h2 style="font-size:14px;color:var(--text-muted);margin:0 0 8px;">Ganhos com reciclagem</h2>
              <p id="dashboard-ganhos" style="font-size:24px;font-weight:700;margin:0;">R$ --</p>
            </div>
            <div class="dashboard-card" style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;">
              <h2 style="font-size:14px;color:var(--text-muted);margin:0 0 8px;">Disponível para resgate</h2>
              <p id="dashboard-saldo" style="font-size:24px;font-weight:700;color:var(--lime);margin:0;">R$ --</p>
            </div>
            <div class="dashboard-card" style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;">
              <h2 style="font-size:14px;color:var(--text-muted);margin:0 0 8px;">Em processamento</h2>
              <p id="dashboard-pendente" style="font-size:24px;font-weight:700;margin:0;">R$ --</p>
            </div>
            <div class="dashboard-card" style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;">
              <h2 style="font-size:14px;color:var(--text-muted);margin:0 0 8px;">Já resgatado / pago</h2>
              <p id="dashboard-pago" style="font-size:24px;font-weight:700;margin:0;">R$ --</p>
            </div>
          </div>

          <div class="dashboard-card" style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;margin-bottom:16px;">
            <h2 style="font-size:14px;color:var(--text-muted);margin:0 0 8px;">Total de coletas</h2>
            <p id="dashboard-coletas" style="font-size:24px;font-weight:600;margin:0;">--</p>
          </div>

          <div class="dashboard-card" style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;">
            <h2 style="font-size:14px;color:var(--text-muted);margin:0 0 12px;">Últimas coletas</h2>
            <div id="dashboard-historico" style="color:var(--text-muted);">Carregando...</div>
          </div>
        </div>
      `;

      const logoutBtn = document.getElementById('dashboard-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          await CicloBem.auth.logout();
          CicloBem.router.navigate('login');
        });
      }
    },

    async loadData() {
      const ganhosEl = document.getElementById('dashboard-ganhos');
      const saldoEl = document.getElementById('dashboard-saldo');
      const pendenteEl = document.getElementById('dashboard-pendente');
      const pagoEl = document.getElementById('dashboard-pago');
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
          ganhosEl.textContent = formatMoney(saldo.total_recycling_earnings_cents);
          saldoEl.textContent = formatMoney(saldo.withdrawable_balance_cents);
          pendenteEl.textContent = formatMoney(saldo.pending_redemptions_cents);
          pagoEl.textContent = formatMoney(saldo.paid_redemptions_cents);
        }

        if (resumoRes.ok && resumoRes.data) {
          const totalColetas =
            resumoRes.data.saldo?.total_coletas ||
            resumoRes.data.total_coletas ||
            resumoRes.data.coletas ||
            0;
          coletasEl.textContent = totalColetas;
        }

        if (historicoRes.ok && historicoRes.data && historicoRes.data.coletas) {
          const coletas = historicoRes.data.coletas.slice(0, 5);
          if (coletas.length === 0) {
            historicoEl.textContent = 'Nenhuma coleta registrada ainda.';
          } else {
            historicoEl.innerHTML = coletas.map(c => {
              const dateObj = c.date_time ? new Date(c.date_time) : null;
              const data = dateObj && !isNaN(dateObj.getTime())
                ? dateObj.toLocaleString('pt-BR')
                : 'Registro histórico sem data identificada';
              const materiais = (c.itens || []).map(item => item.material).filter(Boolean);
              const material = materiais.length
                ? materiais.join(', ')
                : 'Registro histórico sem material identificado';
              const quantidade = c.quantity == null ? 'Quantidade não informada' : `${c.quantity} ${c.unit || ''}`.trim();
              const origem = c.source_name || c.source_type || 'Origem histórica não identificada';
              const status = c.status_pagamento || c.status_operacional || 'Status não informado';
              return `<div style="padding:10px 0;border-bottom:1px solid var(--border);"><strong>${escapeHtml(material)}</strong><br><span>${escapeHtml(data)} · ${escapeHtml(quantidade)} · ${escapeHtml(origem)} · ${escapeHtml(status)}</span><br><span>${formatMoney(c.credited_value_cents)}</span></div>`;
            }).join('');
          }
        }
      } catch (error) {
        if (saldoEl) saldoEl.textContent = 'R$ --';
        if (historicoEl) historicoEl.textContent = 'Erro ao carregar dados.';
        CicloBem.logger.error('Dashboard load error', error);
      }
    }
  };

  CicloBem.contaDigital.dashboard = ContaDigitalDashboard;
})();
