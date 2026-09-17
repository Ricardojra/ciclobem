(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  window.CicloBem.contaDigital = window.CicloBem.contaDigital || {};
  const CicloBem = window.CicloBem;
  const formatMoney = CicloBem.money.formatCentsBRL;
  const parseMoneyToCents = CicloBem.money.parseMoneyToCents;
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));

  const ContaDigitalResgatar = {
    availableBalanceCents: null,
    balanceStatus: 'UNAVAILABLE',
    pendingRequestKey: null,

    async init() {
      this.render();
      this.bindEvents();
      await this.loadData();
      await this.carregarChavePix();
      if (window.CicloBem.menu) window.CicloBem.menu.render('dashboard');
    },

    async carregarChavePix() {
      try {
        const response = await CicloBem.api.get('/conta-digital/me');
        if (response.ok && response.data) {
          const user = response.data.cliente || response.data;
          const chaveEl = document.getElementById('resgatar-chave');
          if (chaveEl) {
            chaveEl.textContent = user.chave_pix_mascarada || 'Nenhuma chave cadastrada';
            chaveEl.dataset.configured = user.chave_pix_configurada ? 'true' : 'false';
          }
          const cadastrarLink = document.getElementById('resgatar-cadastrar-chave');
          if (cadastrarLink) {
            cadastrarLink.style.display = user.chave_pix_configurada ? 'none' : 'inline';
          }
        }
      } catch (error) {
        CicloBem.logger.error('Erro ao carregar chave Pix', error);
      }
    },

    render() {
      const root = document.getElementById('conta-digital-root');
      if (!root) return;

      root.innerHTML = `
        <div class="cb-page">
          <header class="cb-header">
            <div>
              <h1 class="cb-header__title">Resgatar</h1>
              <p class="cb-header__sub">Transforme seus créditos em dinheiro na sua conta.</p>
            </div>
          </header>

          <section class="cb-card cb-card--financial cb-balance-hero">
            <p class="cb-card__label">Disponível para resgate</p>
            <p class="cb-amount cb-amount--on-dark" id="resgatar-saldo">—</p>
          </section>

          <div class="cb-card">
            <form id="resgatar-form" class="cb-form">
              <div class="cb-form-group">
                <label class="cb-label" for="resgatar-valor">Valor (R$)</label>
                <input type="number" id="resgatar-valor" class="cb-input" placeholder="0,00" step="0.01" min="1" required inputmode="decimal">
              </div>

              <div class="cb-form-group">
                <span class="cb-label">Chave Pix cadastrada</span>
                <div class="cb-list-row" style="border:none;padding:var(--space-2) 0;">
                  <span class="cb-list-row__value" id="resgatar-chave" style="text-align:left;">Carregando...</span>
                </div>
                <a href="#/perfil" id="resgatar-cadastrar-chave" class="cb-hint" style="display:none;">Cadastrar chave Pix no perfil</a>
              </div>

              <div class="cb-form-error" id="resgatar-error" style="display:none;"></div>
              <div class="cb-form-success" id="resgatar-success" style="display:none;"></div>

              <button type="submit" class="cb-button cb-button--full" id="resgatar-submit">Solicitar resgate</button>
            </form>
          </div>

          <div class="cb-card">
            <h2 class="cb-card__title">Como funciona</h2>
            <div class="cb-list">
              <div class="cb-list-row"><span class="cb-list-row__label">1. Você informa o valor e confirma a chave Pix.</span></div>
              <div class="cb-list-row"><span class="cb-list-row__label">2. A CicloBem processa seu pedido de resgate.</span></div>
              <div class="cb-list-row"><span class="cb-list-row__label">3. O status aparece nas suas Atividades.</span></div>
            </div>
          </div>
        </div>
      `;
    },

    bindEvents() {
      const form = document.getElementById('resgatar-form');
      if (!form) return;
      form.addEventListener('submit', (e) => { e.preventDefault(); this.handleSubmit(); });
    },

    async loadData() {
      const saldoEl = document.getElementById('resgatar-saldo');
      try {
        const saldoRes = await CicloBem.api.get('/conta-digital/saldo');
        if (saldoRes.ok && saldoRes.data && saldoRes.data.saldo) {
          const saldo = saldoRes.data.saldo;
          this.availableBalanceCents = saldo.withdrawable_balance_cents;
          this.balanceStatus = saldo.balance_status;
          saldoEl.textContent = this.balanceStatus === 'AVAILABLE' && saldo.financial_reconciliation_check === true
            ? formatMoney(this.availableBalanceCents)
            : 'Indisponível';
          const submitBtn = document.getElementById('resgatar-submit');
          if (submitBtn) submitBtn.disabled = this.balanceStatus !== 'AVAILABLE' || this.availableBalanceCents <= 0;
        } else {
          saldoEl.textContent = 'Indisponível';
        }
      } catch (error) {
        saldoEl.textContent = 'Indisponível';
        CicloBem.logger.error('Erro ao carregar saldo', error);
      }
    },

    async handleSubmit() {
      const submitBtn = document.getElementById('resgatar-submit');
      const errorDiv = document.getElementById('resgatar-error');
      const successDiv = document.getElementById('resgatar-success');
      const valorCentavos = parseMoneyToCents(document.getElementById('resgatar-valor').value);
      const chaveEl = document.getElementById('resgatar-chave');

      errorDiv.style.display = 'none';
      successDiv.style.display = 'none';

      if (!valorCentavos || valorCentavos <= 0) {
        errorDiv.textContent = 'Informe um valor maior que zero.';
        errorDiv.style.display = 'block';
        return;
      }

      if (this.balanceStatus !== 'AVAILABLE' || !Number.isSafeInteger(this.availableBalanceCents)) {
        errorDiv.textContent = 'Saldo temporariamente indisponível para reconciliação.';
        errorDiv.style.display = 'block';
        return;
      }

      if (valorCentavos > this.availableBalanceCents) {
        errorDiv.textContent = 'Saldo insuficiente para este resgate.';
        errorDiv.style.display = 'block';
        return;
      }

      if (!chaveEl || chaveEl.dataset.configured !== 'true') {
        errorDiv.textContent = 'Cadastre uma chave Pix no perfil antes de solicitar o resgate.';
        errorDiv.style.display = 'block';
        return;
      }

      const projectedBalance = this.availableBalanceCents - valorCentavos;
      const confirmar = confirm(`Valor: ${formatMoney(valorCentavos)}\nChave Pix: ${chaveEl.textContent}\nDisponível antes: ${formatMoney(this.availableBalanceCents)}\nDisponível após reserva: ${formatMoney(projectedBalance)}\n\nConfirmar solicitação de resgate?`);
      if (!confirmar) return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Solicitando...';
      this.pendingRequestKey = this.pendingRequestKey || crypto.randomUUID();

      try {
        const response = await CicloBem.api.post('/conta-digital/resgatar-pix', {
          valor: `${Math.floor(valorCentavos / 100)}.${String(valorCentavos % 100).padStart(2, '0')}`,
          idempotency_key: this.pendingRequestKey
        });

        if (response.ok) {
          successDiv.textContent = 'Resgate solicitado. Acompanhe o status nas Atividades.';
          successDiv.style.display = 'block';
          this.pendingRequestKey = null;
          document.getElementById('resgatar-form').reset();
          await this.carregarChavePix();
          await this.loadData();
        } else {
          errorDiv.textContent = response.error?.message || 'Erro ao solicitar resgate.';
          errorDiv.style.display = 'block';
        }
      } catch (error) {
        errorDiv.textContent = error.message || 'Erro ao conectar com o servidor.';
        errorDiv.style.display = 'block';
        CicloBem.logger.error('Resgate error', error);
      } finally {
        submitBtn.disabled = this.balanceStatus !== 'AVAILABLE' || this.availableBalanceCents <= 0;
        submitBtn.textContent = 'Solicitar resgate';
      }
    }
  };

  CicloBem.contaDigital.resgatar = ContaDigitalResgatar;
})();
