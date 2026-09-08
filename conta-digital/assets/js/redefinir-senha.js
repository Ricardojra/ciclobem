(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  window.CicloBem.contaDigital = window.CicloBem.contaDigital || {};
  const CicloBem = window.CicloBem;

  const ContaDigitalRedefinirSenha = {
    init(params) {
      this.token = params.token || '';
      if (CicloBem.menu) CicloBem.menu.hide();
      this.render();
      this.bindEvents();
    },

    render() {
      const root = document.getElementById('conta-digital-root');
      if (!root) return;

      if (!this.token) {
        root.innerHTML = `
          <div class="conta-digital-auth">
            <div class="conta-digital-auth__logo">
              <picture>
                <source srcset="../../ciclobem-logo.webp" type="image/webp">
                <img src="../../ciclobem-logo.png" alt="CicloBem" width="363" height="88" style="height:44px;width:auto">
              </picture>
              <h1>Link inválido</h1>
              <p>O link de redefinição está ausente, expirado ou já foi usado.</p>
            </div>
            <div class="conta-digital-auth__footer">
              <a href="#/esqueci-senha">Solicitar novo link</a>
            </div>
          </div>
        `;
        return;
      }

      root.innerHTML = `
        <div class="conta-digital-auth">
          <div class="conta-digital-auth__logo">
            <picture>
              <source srcset="../../ciclobem-logo.webp" type="image/webp">
              <img src="../../ciclobem-logo.png" alt="CicloBem" width="363" height="88" style="height:44px;width:auto">
            </picture>
            <h1>Criar nova senha</h1>
            <p>Digite a nova senha para acessar sua Conta CicloBem.</p>
          </div>

          <form class="cb-form" id="redefinir-senha-form">
            <div class="cb-form-group">
              <label class="cb-label" for="redefinir-senha">Nova senha</label>
              <div class="cb-input-group">
                <input type="password" id="redefinir-senha" class="cb-input" placeholder="Mínimo 8 caracteres" required minlength="8" autocomplete="new-password">
                <button type="button" id="redefinir-toggle-senha" class="cb-input-toggle" aria-label="Mostrar senha" title="Mostrar senha">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
              <span class="cb-hint">Mínimo 8 caracteres, com letras e números.</span>
            </div>

            <div class="cb-form-group">
              <label class="cb-label" for="redefinir-confirmacao">Confirmar nova senha</label>
              <div class="cb-input-group">
                <input type="password" id="redefinir-confirmacao" class="cb-input" placeholder="Digite novamente" required minlength="8" autocomplete="new-password">
                <button type="button" id="redefinir-toggle-confirmacao" class="cb-input-toggle" aria-label="Mostrar senha" title="Mostrar senha">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
            </div>

            <div class="cb-form-error" id="redefinir-error" style="display:none;"></div>
            <div class="cb-form-success" id="redefinir-success" style="display:none;"></div>

            <button type="submit" class="cb-button cb-button--full" id="redefinir-submit">Salvar nova senha</button>
          </form>

          <div class="conta-digital-auth__footer">
            <a href="#/login">Voltar ao login</a>
          </div>
        </div>
      `;
    },

    bindEvents() {
      const form = document.getElementById('redefinir-senha-form');
      if (!form) return;
      form.addEventListener('submit', (e) => { e.preventDefault(); this.handleSubmit(); });

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

      bindPasswordToggle('redefinir-toggle-senha', 'redefinir-senha', 'Mostrar nova senha', 'Ocultar nova senha');
      bindPasswordToggle('redefinir-toggle-confirmacao', 'redefinir-confirmacao', 'Mostrar confirmação de senha', 'Ocultar confirmação de senha');
    },

    async handleSubmit() {
      const submitBtn = document.getElementById('redefinir-submit');
      const errorDiv = document.getElementById('redefinir-error');
      const successDiv = document.getElementById('redefinir-success');
      const senha = document.getElementById('redefinir-senha').value;
      const confirmacao = document.getElementById('redefinir-confirmacao').value;

      errorDiv.style.display = 'none';
      successDiv.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Salvando...';

      try {
        if (senha.length < 8) throw new Error('A senha deve ter pelo menos 8 caracteres.');
        if (!/[a-zA-Z]/.test(senha) || !/[0-9]/.test(senha)) throw new Error('A senha deve conter letras e números.');
        if (senha !== confirmacao) throw new Error('As senhas não coincidem.');

        const response = await CicloBem.api.post('/conta-digital/auth/reset-password', {
          token: this.token,
          password: senha,
          password_confirmacao: confirmacao
        });

        if (!response.ok) throw new Error(response.error?.message || 'Não foi possível redefinir a senha. O link pode ter expirado.');

        successDiv.textContent = 'Senha redefinida com sucesso. Redirecionando para o login...';
        successDiv.style.display = 'block';
        document.getElementById('redefinir-senha-form').style.display = 'none';

        setTimeout(() => {
          CicloBem.router.navigate('login');
        }, 3000);
      } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
        CicloBem.logger.error('Redefinição falhou', error);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Salvar nova senha';
      }
    }
  };

  CicloBem.contaDigital.redefinirSenha = ContaDigitalRedefinirSenha;
})();
