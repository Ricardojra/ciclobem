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
            <h1>Criar nova senha</h1>
            <p>Digite a nova senha para acessar sua Conta CicloBem.</p>
          </div>

          <form class="cb-form" id="redefinir-senha-form">
            <div class="cb-form-group">
              <label class="cb-label" for="redefinir-senha">Nova senha</label>
              <input type="password" id="redefinir-senha" class="cb-input" placeholder="Mínimo 8 caracteres" required minlength="8" autocomplete="new-password">
              <span class="cb-hint">Mínimo 8 caracteres, com letras e números.</span>
            </div>

            <div class="cb-form-group">
              <label class="cb-label" for="redefinir-confirmacao">Confirmar nova senha</label>
              <input type="password" id="redefinir-confirmacao" class="cb-input" placeholder="Digite novamente" required minlength="8" autocomplete="new-password">
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
