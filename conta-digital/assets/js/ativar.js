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
            <h1>Criar senha</h1>
            <p>Complete seu cadastro e acesse sua Conta CicloBem.</p>
          </div>

          <form class="cb-form" id="ativar-form">
            <div class="cb-form-group">
              <label class="cb-label" for="ativar-senha">Senha</label>
              <input type="password" id="ativar-senha" class="cb-input" placeholder="Mínimo 8 caracteres" required minlength="8" autocomplete="new-password">
              <span class="cb-hint">Mínimo 8 caracteres, com letras e números.</span>
            </div>

            <div class="cb-form-group">
              <label class="cb-label" for="ativar-confirmacao">Confirmar senha</label>
              <input type="password" id="ativar-confirmacao" class="cb-input" placeholder="Digite novamente" required minlength="8" autocomplete="new-password">
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

      errorDiv.style.display = 'none';
      successDiv.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Ativando...';

      try {
        if (senha.length < 8) throw new Error('A senha deve ter pelo menos 8 caracteres.');
        if (!/[a-zA-Z]/.test(senha) || !/[0-9]/.test(senha)) throw new Error('A senha deve conter letras e números.');
        if (senha !== confirmacao) throw new Error('As senhas não coincidem.');
        if (!this.token) throw new Error('Link de ativação inválido ou expirado.');

        const response = await CicloBem.api.post('/conta-digital/ativar', {
          token: this.token,
          password: senha,
          password_confirmacao: confirmacao
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
