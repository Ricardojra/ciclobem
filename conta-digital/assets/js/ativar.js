(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  window.CicloBem.contaDigital = window.CicloBem.contaDigital || {};
  const CicloBem = window.CicloBem;

  const ContaDigitalAtivar = {
    init(params) {
      this.token = params.token || '';
      if (CicloBem.menu) CicloBem.menu.hide();
      this.render();
      this.bindEvents();
    },

    render() {
      const root = document.getElementById('conta-digital-root');
      if (!root) return;

      root.innerHTML = `
        <div class="conta-digital-auth">
          <div class="conta-digital-auth__logo">
            <picture>
              <source srcset="../../ciclobem-logo.webp" type="image/webp">
              <img src="../../ciclobem-logo.png" alt="CicloBem" width="363" height="88" style="height:44px;width:auto">
            </picture>
            <h1>Criar senha</h1>
            <p>Complete seu cadastro e acesse sua Conta CicloBem.</p>
          </div>

          <form class="cb-form" id="ativar-form">
            <div class="cb-form-group">
              <label class="cb-label" for="ativar-cpf">CPF</label>
              <input type="text" id="ativar-cpf" class="cb-input" placeholder="000.000.000-00" required maxlength="14" autocomplete="off">
            </div>

            <div class="cb-form-group">
              <label class="cb-label" for="ativar-senha">Senha</label>
              <div class="cb-input-group">
                <input type="password" id="ativar-senha" class="cb-input" placeholder="Mínimo 8 caracteres" required minlength="8" autocomplete="new-password">
                <button type="button" id="ativar-toggle-senha" class="cb-input-toggle" aria-label="Mostrar senha" title="Mostrar senha">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
              <span class="cb-hint">Mínimo 8 caracteres, com letras e números.</span>
            </div>

            <div class="cb-form-group">
              <label class="cb-label" for="ativar-confirmacao">Confirmar senha</label>
              <div class="cb-input-group">
                <input type="password" id="ativar-confirmacao" class="cb-input" placeholder="Digite novamente" required minlength="8" autocomplete="new-password">
                <button type="button" id="ativar-toggle-confirmacao" class="cb-input-toggle" aria-label="Mostrar senha" title="Mostrar senha">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
            </div>

            <div class="cb-form-group">
              <label class="cb-label" style="display: flex; gap: 8px; align-items: center; font-size: 13px; color: var(--text-muted); cursor: pointer;">
                <input type="checkbox" id="ativar-termos" required style="width: 18px; height: 18px;">
                <span>Li e aceito os <a href="termos-de-uso.html" target="_blank" style="color: #2dd67b; margin: 0 4px;">Termos de Uso</a> e a <a href="politica-privacidade.html" target="_blank" style="color: #2dd67b; margin: 0 4px;">Política de Privacidade</a>.</span>
              </label>
            </div>

            <div class="cb-form-error" id="ativar-error"></div>
            <div class="cb-form-success" id="ativar-success"></div>

            <button type="submit" class="cb-button cb-button--full" id="ativar-submit">Criar senha e entrar</button>
          </form>

          <div class="conta-digital-auth__footer">
            <a href="#/login">Já tem conta? Fazer login</a>
          </div>
        </div>
      `;
    },

    bindEvents() {
      const cpfInput = document.getElementById('ativar-cpf');
      if (cpfInput) {
        cpfInput.addEventListener('input', (e) => {
          let v = e.target.value.replace(/\D/g, '');
          v = v.replace(/(\d{3})(\d)/, '$1.$2');
          v = v.replace(/(\d{3})(\d)/, '$1.$2');
          v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
          e.target.value = v.slice(0, 14);
        });
      }

      const eyeOpen = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
      const eyeOff = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94l9.88 9.88zM9.9 9.9A3 3 0 0 0 12 15a3 3 0 0 0 2.9-2.9l-5-5zM22 12s-4-8-11-8a18.45 18.45 0 0 0-5.06 5.94L3 3l18 18"/></svg>';

      const bindPasswordToggle = (buttonId, inputId, showLabel, hideLabel) => {
        const button = document.getElementById(buttonId);
        const input = document.getElementById(inputId);
        if (!button || !input) return;

        button.type = 'button';
        button.setAttribute('aria-pressed', 'false');
        button.setAttribute('aria-label', showLabel);
        button.title = showLabel;
        button.innerHTML = eyeOpen;

        button.addEventListener('click', (event) => {
          event.preventDefault();
          const wasFocused = document.activeElement === input;
          const show = input.type === 'password';
          input.type = show ? 'text' : 'password';
          button.setAttribute('aria-pressed', String(show));
          button.setAttribute('aria-label', show ? hideLabel : showLabel);
          button.title = show ? hideLabel : showLabel;
          button.innerHTML = show ? eyeOff : eyeOpen;
          if (wasFocused) input.focus();
        });
      };

      bindPasswordToggle('ativar-toggle-senha', 'ativar-senha', 'Mostrar senha', 'Ocultar senha');
      bindPasswordToggle('ativar-toggle-confirmacao', 'ativar-confirmacao', 'Mostrar confirmação de senha', 'Ocultar confirmação de senha');

      const form = document.getElementById('ativar-form');
      if (!form) return;
      form.addEventListener('submit', (e) => { e.preventDefault(); this.handleSubmit(); });
    },

    async handleSubmit() {
      const submitBtn = document.getElementById('ativar-submit');
      const errorDiv = document.getElementById('ativar-error');
      const successDiv = document.getElementById('ativar-success');
      const senha = document.getElementById('ativar-senha').value;
      const confirmacao = document.getElementById('ativar-confirmacao').value;
      const cpfRaw = document.getElementById('ativar-cpf').value;
      const cpf = cpfRaw.replace(/\D/g, '');
      const aceitou = document.getElementById('ativar-termos').checked;

      errorDiv.style.display = 'none';
      successDiv.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Ativando...';

      try {
        if (cpf.length !== 11) throw new Error('Informe um CPF válido.');
        if (senha.length < 8) throw new Error('A senha deve ter pelo menos 8 caracteres.');
        if (!/[a-zA-Z]/.test(senha) || !/[0-9]/.test(senha)) throw new Error('A senha deve conter letras e números.');
        if (senha !== confirmacao) throw new Error('As senhas não coincidem.');
        if (!this.token) throw new Error('Link de ativação inválido ou expirado.');
        if (!aceitou) throw new Error('Você precisa aceitar os Termos de Uso e a Política de Privacidade.');

        const response = await CicloBem.api.post('/conta-digital/ativar', {
          token: this.token,
          cpf,
          password: senha,
          password_confirmacao: confirmacao,
          aceite_termos: true
        });

        if (!response.ok) throw new Error(response.error?.message || 'Não foi possível ativar a conta.');

        if (response.data && response.data.token) {
          CicloBem.storage.setToken(response.data.token);
          CicloBem.storage.setUser(response.data.user);
        }

        successDiv.textContent = 'Conta ativada com sucesso! Redirecionando...';
        successDiv.style.display = 'block';

        setTimeout(() => {
          CicloBem.router.navigate('dashboard');
        }, 1500);
      } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
        CicloBem.logger.error('Ativação falhou', error);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Criar senha e entrar';
      }
    }
  };

  CicloBem.contaDigital.ativar = ContaDigitalAtivar;
})();
