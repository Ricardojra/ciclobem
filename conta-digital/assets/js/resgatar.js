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
  const parseMoneyToCents = (value) => {
    const match = String(value || '').trim().replace(',', '.').match(/^(\d+)(?:\.(\d{1,2}))?$/);
    if (!match) return null;
    const cents = Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0'));
    return Number.isSafeInteger(cents) ? cents : null;
  };

  const ContaDigitalResgatar = {
    availableBalanceCents: null,
    balanceStatus: 'UNAVAILABLE',
    pendingRequestKey: null,
    async init() {
      this.render();
      this.bindEvents();
      await this.loadData();
      await this.carregarChavePix();
      if (window.CicloBem.menu) window.CicloBem.menu.render('resgatar');
    },

    async carregarChavePix() {
      try {
        const response = await CicloBem.api.get('/conta-digital/me');
        if (response.ok && response.data) {
          const user = response.data.cliente || response.data;
          const chaveInput = document.getElementById('resgatar-chave');
          if (chaveInput) {
            chaveInput.value = user.chave_pix_mascarada || 'Nenhuma chave cadastrada';
            chaveInput.dataset.configured = user.chave_pix_configurada ? 'true' : 'false';
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
        <div class="conta-digital-dashboard">
          <div class="dashboard-header" style="position:sticky;top:0;z-index:101;background:var(--bg-elevated,#111e33);border-bottom:1px solid var(--border,#1e3a5f);padding:20px 24px;margin:-24px -24px 24px;display:flex;justify-content:space-between;align-items:center;">
            <h1 style="font-size:22px;margin:0;">Resgatar</h1>
            <button id="resgatar-logout" class="cb-button cb-button--secondary" style="padding:8px 14px;font-size:13px;">Sair</button>
          </div>

          <div class="dashboard-card" style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;margin-bottom:16px;">
            <h2 style="font-size:14px;color:var(--text-muted);margin:0 0 8px;">Disponível para resgate</h2>
            <p id="resgatar-saldo" style="font-size:28px;font-weight:700;color:var(--lime);margin:0;">R$ --</p>
          </div>

          <div class="dashboard-card" style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;">
            <p style="color:var(--text-muted);margin:0 0 16px;">Informe o valor e a chave Pix para resgatar seu saldo.</p>

            <form id="resgatar-form" class="cb-form">
              <div class="cb-form-group">
                <label class="cb-label" for="resgatar-valor">Valor (R$)</label>
                <input type="number" id="resgatar-valor" class="cb-input" placeholder="0,00" step="0.01" min="1" required>
              </div>

              <div class="cb-form-group">
                <label class="cb-label" for="resgatar-chave">Chave Pix cadastrada</label>
                <input type="text" id="resgatar-chave" class="cb-input" value="Carregando..." readonly>
              </div>

              <div class="cb-form-error" id="resgatar-error" style="color:var(--danger);margin:12px 0;font-size:14px;display:none;"></div>
              <div class="cb-form-success" id="resgatar-success" style="color:var(--success);margin:12px 0;font-size:14px;display:none;"></div>

              <button type="submit" class="cb-button cb-button--full" id="resgatar-submit">Solicitar resgate</button>
            </form>
          </div>

          <div class="dashboard-card" style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;margin-top:16px;">
            <h2 style="font-size:14px;color:var(--text-muted);margin:0 0 12px;">Como funciona</h2>
            <p style="color:var(--text);font-size:14px;line-height:1.5;margin:0;">
              1. Informe o valor e sua chave Pix.<br>
              2. A CicloBem processa o pagamento.<br>
              3. Você recebe na sua conta em até 48h.
            </p>
          </div>
        </div>
      `;

      const logoutBtn = document.getElementById('resgatar-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          await CicloBem.auth.logout();
          CicloBem.router.navigate('login');
        });
      }
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
          saldoEl.textContent = formatMoney(this.availableBalanceCents);
          const submitBtn = document.getElementById('resgatar-submit');
          if (submitBtn) submitBtn.disabled = this.balanceStatus !== 'AVAILABLE' || this.availableBalanceCents <= 0;
        }
      } catch (error) {
        CicloBem.logger.error('Erro ao carregar saldo', error);
      }
    },

    async handleSubmit() {
      const submitBtn = document.getElementById('resgatar-submit');
      const errorDiv = document.getElementById('resgatar-error');
      const successDiv = document.getElementById('resgatar-success');
      const valorCentavos = parseMoneyToCents(document.getElementById('resgatar-valor').value);
      const chavePixMascarada = document.getElementById('resgatar-chave');

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

      if (!chavePixMascarada || chavePixMascarada.dataset.configured !== 'true') {
        errorDiv.textContent = 'Cadastre uma chave Pix no perfil antes de solicitar o resgate.';
        errorDiv.style.display = 'block';
        return;
      }

      const projectedBalance = this.availableBalanceCents - valorCentavos;
      const confirmar = confirm(`Valor: ${formatMoney(valorCentavos)}\nChave Pix: ${chavePixMascarada.value}\nDisponível antes: ${formatMoney(this.availableBalanceCents)}\nValor solicitado: ${formatMoney(valorCentavos)}\nDisponível projetado após reserva: ${formatMoney(projectedBalance)}\n\nConfirmar solicitação de resgate?`);
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
          successDiv.textContent = 'Resgate solicitado. Acompanhe o status nesta tela.';
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
