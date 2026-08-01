(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  window.CicloBem.contaDigital = window.CicloBem.contaDigital || {};
  const CicloBem = window.CicloBem;

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

          <div class="dashboard-card" style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;margin-bottom:16px;">
            <h2 style="font-size:14px;color:var(--text-muted);margin:0 0 8px;">Saldo disponível</h2>
            <p id="dashboard-saldo" style="font-size:32px;font-weight:700;color:var(--lime);margin:0;">R$ --</p>
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
      const saldoEl = document.getElementById('dashboard-saldo');
      const coletasEl = document.getElementById('dashboard-coletas');
      const historicoEl = document.getElementById('dashboard-historico');

      try {
        const [saldoRes, resumoRes, historicoRes] = await Promise.all([
          CicloBem.api.get('/conta-digital/saldo'),
          CicloBem.api.get('/conta-digital/resumo'),
          CicloBem.api.get('/conta-digital/historico')
        ]);

        if (saldoRes.ok && saldoRes.data) {
          const saldoRaw = saldoRes.data.saldo;
          let saldoValor = 0;
          if (typeof saldoRaw === 'number') {
            saldoValor = saldoRaw / 100;
          } else if (saldoRaw && typeof saldoRaw === 'object') {
            saldoValor = (
              parseFloat(saldoRaw.gerado || 0) +
              parseFloat(saldoRaw.em_processamento || 0) +
              parseFloat(saldoRaw.pago || 0)
            );
          } else {
            saldoValor = parseFloat(saldoRaw) || 0;
          }
          saldoEl.textContent = `R$ ${saldoValor.toFixed(2).replace('.', ',')}`;
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
              const dateObj = c.created_at ? new Date(c.created_at) : null;
              const data = (dateObj && !isNaN(dateObj.getTime()))
                ? dateObj.toLocaleDateString('pt-BR')
                : 'Data não disponível';
              const valor = (parseFloat(c.valor_total) || 0).toFixed(2).replace('.', ',');
              return `<div style="padding:10px 0;border-bottom:1px solid var(--border);">${data} — ${c.material_nome || 'Material'} — R$ ${valor}</div>`;
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
