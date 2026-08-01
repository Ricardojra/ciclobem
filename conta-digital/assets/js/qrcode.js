(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  window.CicloBem.contaDigital = window.CicloBem.contaDigital || {};
  const CicloBem = window.CicloBem;

  const ContaDigitalQrCode = {
    async init() {
      this.render();
      await this.load();
      if (window.CicloBem.menu) window.CicloBem.menu.render('qrcode');
    },

    render() {
      const root = document.getElementById('conta-digital-root');
      if (!root) return;

      root.innerHTML = `
        <div class="conta-digital-dashboard">
          <div class="dashboard-header" style="position:sticky;top:0;z-index:101;background:var(--bg-elevated,#111e33);border-bottom:1px solid var(--border,#1e3a5f);padding:20px 24px;margin:-24px -24px 24px;display:flex;justify-content:space-between;align-items:center;">
            <h1 style="font-size:22px;margin:0;">Meu QR Code</h1>
            <button id="qrcode-logout" class="cb-button cb-button--secondary" style="padding:8px 14px;font-size:13px;">Sair</button>
          </div>

          <div class="dashboard-card" style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;margin-bottom:16px;text-align:center;">
            <p style="color:var(--text-muted);margin:0 0 16px;">Apresente este QR Code na máquina CicloBem para identificação rápida.</p>
            <div id="qrcode-container" style="display:flex;justify-content:center;align-items:center;min-height:240px;">
              <p style="color:var(--text-muted);">Carregando...</p>
            </div>
            <p id="qrcode-token" style="word-break:break-all;font-size:12px;color:var(--text-muted);margin-top:16px;"></p>
          </div>

          <div class="dashboard-card" style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;">
            <h2 style="font-size:14px;color:var(--text-muted);margin:0 0 8px;">Como usar</h2>
            <p style="color:var(--text);font-size:14px;line-height:1.5;margin:0;">
              1. Aproxime o celular do leitor da CicloBem.<br>
              2. A máquina reconhece automaticamente o seu cadastro.<br>
              3. Faça a coleta e acompanhe o saldo.
            </p>
          </div>
        </div>
      `;

      const logoutBtn = document.getElementById('qrcode-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          await CicloBem.auth.logout();
          CicloBem.router.navigate('login');
        });
      }
    },

    async load() {
      const container = document.getElementById('qrcode-container');
      const tokenEl = document.getElementById('qrcode-token');

      try {
        const response = await CicloBem.api.get('/conta-digital/me/qr-code');

        if (!response.ok || !response.data) {
          container.innerHTML = '<p class="cb-error">Erro ao carregar QR Code.</p>';
          return;
        }

        const { qr, cliente } = response.data;
        const qrValue = qr.payload || qr.token;

        container.innerHTML = `
          <div style="background:#fff;border-radius:12px;padding:16px;display:inline-block;">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrValue)}"
              alt="QR Code"
              style="width:220px;height:220px;display:block;"
              onerror="this.style.display='none'; this.parentElement.innerHTML += '<p style=\\'color:#000;\\'>Código: ${qrValue}</p>'"
            />
          </div>
        `;

        tokenEl.textContent = `Código: ${qr.token}`;
      } catch (error) {
        container.innerHTML = '<p class="cb-error">Erro ao carregar QR Code.</p>';
        CicloBem.logger.error('QR Code load error', error);
      }
    }
  };

  CicloBem.contaDigital.qrcode = ContaDigitalQrCode;
})();
