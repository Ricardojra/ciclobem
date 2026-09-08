(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  window.CicloBem.contaDigital = window.CicloBem.contaDigital || {};
  const CicloBem = window.CicloBem;

  const ContaDigitalLogin = {
    init() {
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
            <h1>Conta CicloBem</h1>
            <p>Acesse suas coletas, saldo e extrato.</p>
          </div>

          <form class="cb-form" id="login-form">
            <div class="cb-form-group">
              <label class="cb-label" for="login-email">E-mail</label>
              <input type="email" id="login-email" class="cb-input" placeholder="seu@email.com" required autocomplete="email">
            </div>

            <div class="cb-form-group">
              <label class="cb-label" for="login-senha">Senha</label>
              <div class="cb-input-group">
                <input type="password" id="login-senha" class="cb-input" placeholder="••••••••" required autocomplete="current-password">
                <button type="button" id="login-toggle-senha" class="cb-input-toggle" aria-label="Mostrar senha" title="Mostrar senha">
                  <svg id="login-eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
            </div>

            <div class="cb-form-error" id="login-error"></div>

            <button type="submit" class="cb-button cb-button--full" id="login-submit">Entrar</button>
          </form>

          <div class="conta-digital-auth__links">
            <a href="#/cadastro" class="cb-button cb-button--secondary cb-button--full">Criar minha conta</a>
            <a href="#/ativar" class="cb-button cb-button--secondary cb-button--full">Ativar conta da máquina</a>
          </div>

          <div class="conta-digital-auth__footer">
            <a href="#/esqueci-senha">Esqueci minha senha</a>
          </div>
        </div>
      `;
    },

    bindEvents() {
      const form = document.getElementById('login-form');
      if (form) form.addEventListener('submit', (e) => { e.preventDefault(); this.handleSubmit(); });

      this.bindPasswordToggle('login-toggle-senha', 'login-senha', 'Mostrar senha', 'Ocultar senha');
    },

    bindPasswordToggle(buttonId, inputId, showLabel, hideLabel) {
      const button = document.getElementById(buttonId);
      const input = document.getElementById(inputId);
      if (!button || !input) return;

      const eyeOpen = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
      const eyeOff = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94l9.88 9.88zM9.9 9.9A3 3 0 0 0 12 15a3 3 0 0 0 2.9-2.9l-5-5zM22 12s-4-8-11-8a18.45 18.45 0 0 0-5.06 5.94L3 3l18 18"/></svg>';

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
    },

    async handleSubmit() {
      const submitBtn = document.getElementById('login-submit');
      const errorDiv = document.getElementById('login-error');
      const email = document.getElementById('login-email').value.trim();
      const senha = document.getElementById('login-senha').value;

      errorDiv.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Entrando...';

      try {
        if (!email || !senha) throw new Error('Preencha e-mail e senha.');
        CicloBem.auth.clearAuth();
        await CicloBem.auth.login(email, senha);
        // Dados de autenticação não são registrados no console.
        CicloBem.router.navigate('dashboard');
      } catch (error) {
        errorDiv.textContent = error.message || 'Credenciais inválidas.';
        errorDiv.style.display = 'block';
        CicloBem.logger.error('Login falhou', error);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Entrar';
      }
    }
  };

  CicloBem.contaDigital.login = ContaDigitalLogin;
})();
