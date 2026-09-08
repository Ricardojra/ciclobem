(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  window.CicloBem.contaDigital = window.CicloBem.contaDigital || {};
  const CicloBem = window.CicloBem;

  const ContaDigitalEsqueciSenha = {
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
            <h1>Recuperar acesso</h1>
            <p>Informe seu e-mail cadastrado. Enviaremos instruções para redefinir sua senha.</p>
          </div>

          <form class="cb-form" id="esqueci-senha-form">
            <div class="cb-form-group">
              <label class="cb-label" for="esqueci-email">E-mail</label>
              <input type="email" id="esqueci-email" class="cb-input" placeholder="seu@email.com" required autocomplete="email">
            </div>

            <div class="cb-form-error" id="esqueci-error" style="display:none;"></div>
            <div class="cb-form-success" id="esqueci-success" style="display:none;"></div>

            <button type="submit" class="cb-button cb-button--full" id="esqueci-submit">Enviar instruções</button>
          </form>

          <div class="conta-digital-auth__footer">
            <a href="#/login">Voltar ao login</a>
          </div>
        </div>
      `;
    },

    bindEvents() {
      const form = document.getElementById('esqueci-senha-form');
      if (!form) return;
      form.addEventListener('submit', (e) => { e.preventDefault(); this.handleSubmit(); });
    },

    async handleSubmit() {
      const submitBtn = document.getElementById('esqueci-submit');
      const errorDiv = document.getElementById('esqueci-error');
      const successDiv = document.getElementById('esqueci-success');
      const email = document.getElementById('esqueci-email').value.trim().toLowerCase();

      errorDiv.style.display = 'none';
      successDiv.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';

      try {
        if (!email) throw new Error('Informe seu e-mail cadastrado.');

        await CicloBem.api.post('/conta-digital/auth/forgot-password', { email });

        // Mensagem genérica por segurança (não revelar se o e-mail existe)
        successDiv.textContent = 'Se este e-mail estiver cadastrado, enviaremos instruções para redefinir a senha.';
        successDiv.style.display = 'block';
        document.getElementById('esqueci-senha-form').style.display = 'none';
      } catch (error) {
        // Mesmo em erro, mensagem genérica
        successDiv.textContent = 'Se este e-mail estiver cadastrado, enviaremos instruções para redefinir a senha.';
        successDiv.style.display = 'block';
        document.getElementById('esqueci-senha-form').style.display = 'none';
        CicloBem.logger.error('Recuperação falhou', error);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar instruções';
      }
    }
  };

  CicloBem.contaDigital.esqueciSenha = ContaDigitalEsqueciSenha;
})();
