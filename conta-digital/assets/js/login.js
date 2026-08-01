(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  window.CicloBem.contaDigital = window.CicloBem.contaDigital || {};
  const CicloBem = window.CicloBem;

  const ContaDigitalLogin = {
    init() {
      this.render();
      this.bindEvents();
    },

    render() {
      const root = document.getElementById('conta-digital-root');
      if (!root) return;

      root.innerHTML = `
        <div class="conta-digital-auth">
          <div class="conta-digital-auth__logo">
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
              <input type="password" id="login-senha" class="cb-input" placeholder="••••••••" required autocomplete="current-password">
            </div>

            <div class="cb-form-error" id="login-error"></div>

            <button type="submit" class="cb-button cb-button--full" id="login-submit">Entrar</button>
          </form>

          <div class="conta-digital-auth__links">
            <a href="#/cadastro" class="cb-button cb-button--secondary cb-button--full">Criar minha conta</a>
            <a href="#/ativar" class="cb-button cb-button--secondary cb-button--full">Ativar conta da máquina</a>
          </div>

          <div class="conta-digital-auth__footer">
            <a href="#">Esqueci minha senha</a>
          </div>
        </div>
      `;
    },

    bindEvents() {
      const form = document.getElementById('login-form');
      if (!form) return;
      form.addEventListener('submit', (e) => { e.preventDefault(); this.handleSubmit(); });
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
        await CicloBem.auth.login(email, senha);
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
