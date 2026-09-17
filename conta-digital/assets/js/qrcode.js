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
        <div class="cb-page">
          <header class="cb-header">
            <div>
              <h1 class="cb-header__title">Meu QR</h1>
              <p class="cb-header__sub">Sua identificação na hora de reciclar.</p>
            </div>
          </header>

          <div class="cb-card cb-qr-card">
            <div class="cb-qr-card__frame" id="qrcode-container">
              <div class="cb-skeleton" style="width:220px;height:220px;"></div>
            </div>
            <p class="cb-qr-card__hint" style="margin-top:var(--space-4);">
              Apresente este código no leitor da CicloMachine ou do CicloPonto antes de depositar o material.
            </p>
          </div>

          <div class="cb-card">
            <h2 class="cb-card__title">Como usar</h2>
            <div class="cb-list">
              <div class="cb-list-row"><span class="cb-list-row__label">1. Abra esta tela ao chegar no ponto de coleta.</span></div>
              <div class="cb-list-row"><span class="cb-list-row__label">2. Aproxime o celular do leitor para ser identificado.</span></div>
              <div class="cb-list-row"><span class="cb-list-row__label">3. Deposite o material — a reciclagem entra na sua conta.</span></div>
            </div>
          </div>
        </div>
      `;
    },

    async load() {
      const container = document.getElementById('qrcode-container');

      try {
        const response = await CicloBem.api.get('/conta-digital/me/qr-code');

        if (!response.ok || !response.data) {
          container.innerHTML = '<p class="cb-error">Erro ao carregar seu código.</p>';
          return;
        }

        const { qr } = response.data;
        const qrValue = qr && (qr.payload || qr.token);

        if (!qrValue) {
          container.innerHTML = '<p class="cb-error">Identificador indisponível no momento.</p>';
          return;
        }

        if (typeof QRCode === 'undefined') {
          container.innerHTML = '<p class="cb-error">Gerador de QR Code não carregado.</p>';
          return;
        }

        container.innerHTML = '<div id="qrcode-canvas"></div>';
        new QRCode(document.getElementById('qrcode-canvas'), {
          text: qrValue,
          width: 220,
          height: 220,
          colorDark: '#0E1B2C',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.H
        });

        // O valor bruto do identificador nunca é exibido.
      } catch (error) {
        container.innerHTML = '<p class="cb-error">Erro ao carregar seu código.</p>';
        CicloBem.logger.error('QR Code load error', error);
      }
    }
  };

  CicloBem.contaDigital.qrcode = ContaDigitalQrCode;
})();
