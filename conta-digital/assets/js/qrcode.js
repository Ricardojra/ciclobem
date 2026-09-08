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
            <p style="color:var(--text-muted);margin:0 0 16px;">Apresente este QR Code no ponto de coleta CicloBem para identificação rápida.</p>
            <div id="qrcode-container" style="display:flex;justify-content:center;align-items:center;min-height:240px;">
              <p style="color:var(--text-muted);">Carregando...</p>
            </div>
            <p id="qrcode-token" style="word-break:break-all;font-size:12px;color:var(--text-muted);margin-top:16px;"></p>
          </div>

          <div class="dashboard-card" style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;">
            <h2 style="font-size:14px;color:var(--text-muted);margin:0 0 8px;">Como usar</h2>
            <p style="color:var(--text);font-size:14px;line-height:1.5;margin:0;">
              1. Aproxime o celular do leitor do ponto de coleta.<br>
              2. O QR Code é lido e sua coleta é vinculada à conta.<br>
              3. Créditos e resgates são administrados pela Plataforma CicloBem.
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

        const { qr } = response.data;
        const qrValue = qr && (qr.payload || qr.token);

        if (!qrValue) {
          container.innerHTML = '<p class="cb-error">Identificador não disponível.</p>';
          return;
        }

        container.innerHTML = '<div style="background:#fff;border-radius:12px;padding:16px;display:inline-block;" id="qrcode-canvas"></div>';

        if (typeof QRCode === 'undefined') {
          container.innerHTML = '<p class="cb-error">Gerador de QR Code não carregado.</p>';
          return;
        }

        new QRCode(document.getElementById('qrcode-canvas'), {
          text: qrValue,
          width: 220,
          height: 220,
          colorDark: '#0a1628',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.H
        });

        // O valor bruto do identificador não é exibido abaixo do QR Code.
        tokenEl.textContent = '';
      } catch (error) {
        container.innerHTML = '<p class="cb-error">Erro ao carregar QR Code.</p>';
        CicloBem.logger.error('QR Code load error', error);
      }
    }
  };

  CicloBem.contaDigital.qrcode = ContaDigitalQrCode;
})();
