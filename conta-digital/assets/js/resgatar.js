(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  window.CicloBem.contaDigital = window.CicloBem.contaDigital || {};
  const CicloBem = window.CicloBem;

  const ContaDigitalResgatar = {
    async init() {
      this.render();
      this.bindEvents();
      await this.loadData();
      if (window.CicloBem.menu) window.CicloBem.menu.render('resgatar');
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
            <h2 style="font-size:14px;color:var(--text-muted);margin:0 0 8px;">Saldo disponível</h2>
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
                <label class="cb-label" for="resgatar-chave">Chave Pix</label>
                <input type="text" id="resgatar-chave" class="cb-input" placeholder="CPF, e-mail, celular ou chave aleatória" required>
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
      } catch (error) {
        CicloBem.logger.error('Erro ao carregar saldo', error);
      }
    },

    async handleSubmit() {
      const submitBtn = document.getElementById('resgatar-submit');
      const errorDiv = document.getElementById('resgatar-error');
      const successDiv = document.getElementById('resgatar-success');
      const valor = document.getElementById('resgatar-valor').value;
      const chavePix = document.getElementById('resgatar-chave').value.trim();

      errorDiv.style.display = 'none';
      successDiv.style.display = 'none';

      if (!valor || parseFloat(valor) <= 0) {
        errorDiv.textContent = 'Informe um valor maior que zero.';
        errorDiv.style.display = 'block';
        return;
      }

      if (!chavePix) {
        errorDiv.textContent = 'Informe uma chave Pix.';
        errorDiv.style.display = 'block';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Solicitando...';

      try {
        const response = await CicloBem.api.post('/conta-digital/resgatar-pix', {
          valor: parseFloat(valor),
          chave_pix: chavePix
        });

        if (response.ok) {
          successDiv.textContent = `Resgate solicitado com sucesso. Código: ${response.data.payment_request.idempotency_key}`;
          successDiv.style.display = 'block';
          document.getElementById('resgatar-form').reset();
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
        submitBtn.disabled = false;
        submitBtn.textContent = 'Solicitar resgate';
      }
    }
  };

  CicloBem.contaDigital.resgatar = ContaDigitalResgatar;
})();
