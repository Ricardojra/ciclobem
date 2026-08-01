(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  window.CicloBem.contaDigital = window.CicloBem.contaDigital || {};
  const CicloBem = window.CicloBem;

  function isValidCPF(cpf) {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(digits.charAt(i)) * (10 - i);
    let rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(digits.charAt(9))) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(digits.charAt(i)) * (11 - i);
    rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(digits.charAt(10))) return false;
    return true;
  }

  const ContaDigitalCadastro = {
    init(params) {
      this.params = params || {};
      this.render();
      this.bindEvents();
    },

    render() {
      const root = document.getElementById('conta-digital-root');
      if (!root) return;

      root.innerHTML = `
        <div class="conta-digital-auth">
          <div class="conta-digital-auth__logo">
            <h1>Criar conta</h1>
            <p>Cadastre-se para acompanhar suas coletas e saldo.</p>
          </div>

          <form class="cb-form" id="cadastro-form">
            <div class="cb-form-group">
              <label class="cb-label" for="cadastro-nome">Nome completo</label>
              <input type="text" id="cadastro-nome" class="cb-input" placeholder="Seu nome completo" required autocomplete="name" value="${this._escape(this.params.nome || '')}">
            </div>

            <div class="cb-form-group">
              <label class="cb-label" for="cadastro-cpf">CPF</label>
              <input type="text" id="cadastro-cpf" class="cb-input" placeholder="000.000.000-00" required maxlength="14" autocomplete="off" value="${this._escape(this.params.cpf || '')}">
            </div>

            <div class="cb-form-group">
              <label class="cb-label" for="cadastro-email">E-mail</label>
              <input type="email" id="cadastro-email" class="cb-input" placeholder="seu@email.com" required autocomplete="email" value="${this._escape(this.params.email || '')}">
            </div>

            <div class="cb-form-group">
              <label class="cb-label" for="cadastro-telefone">Telefone</label>
              <input type="tel" id="cadastro-telefone" class="cb-input" placeholder="(00) 00000-0000" autocomplete="tel">
            </div>

            <div class="cb-form-group">
              <label class="cb-label" for="cadastro-senha">Senha</label>
              <input type="password" id="cadastro-senha" class="cb-input" placeholder="Mínimo 8 caracteres" required minlength="8" autocomplete="new-password">
              <span class="cb-hint">Mínimo 8 caracteres, com letras e números.</span>
            </div>

            <div class="cb-form-group">
              <label class="cb-label" for="cadastro-confirmacao">Confirmar senha</label>
              <input type="password" id="cadastro-confirmacao" class="cb-input" placeholder="Digite novamente" required minlength="8" autocomplete="new-password">
            </div>

            <div class="cb-form-group">
              <label class="cb-label" style="display: flex; gap: 8px; align-items: center; font-size: 13px; color: var(--text-muted); cursor: pointer;">
                <input type="checkbox" id="cadastro-termos" required style="width: 18px; height: 18px;">
                Aceito os Termos de Uso e Política de Privacidade
              </label>
            </div>

            <div class="cb-form-error" id="cadastro-error"></div>
            <div class="cb-form-success" id="cadastro-success"></div>

            <button type="submit" class="cb-button cb-button--full" id="cadastro-submit">Criar conta</button>
          </form>

          <div class="conta-digital-auth__footer">
            <a href="#/login">Já tem conta? Fazer login</a>
          </div>
        </div>
      `;
    },

    _escape(value) {
      return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    bindEvents() {
      const cpfInput = document.getElementById('cadastro-cpf');
      if (cpfInput) {
        cpfInput.addEventListener('input', (e) => {
          let v = e.target.value.replace(/\D/g, '');
          v = v.replace(/(\d{3})(\d)/, '$1.$2');
          v = v.replace(/(\d{3})(\d)/, '$1.$2');
          v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
          e.target.value = v.slice(0, 14);
        });
      }

      const form = document.getElementById('cadastro-form');
      if (!form) return;
      form.addEventListener('submit', (e) => { e.preventDefault(); this.handleSubmit(); });
    },

    async handleSubmit() {
      const submitBtn = document.getElementById('cadastro-submit');
      const errorDiv = document.getElementById('cadastro-error');
      const successDiv = document.getElementById('cadastro-success');

      errorDiv.style.display = 'none';
      successDiv.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Criando conta...';

      try {
        const nome = document.getElementById('cadastro-nome').value.trim();
        const cpfRaw = document.getElementById('cadastro-cpf').value;
        const cpf = cpfRaw.replace(/\D/g, '');
        const email = document.getElementById('cadastro-email').value.trim().toLowerCase();
        const telefone = document.getElementById('cadastro-telefone').value.replace(/\D/g, '');
        const senha = document.getElementById('cadastro-senha').value;
        const confirmacao = document.getElementById('cadastro-confirmacao').value;
        const aceitou = document.getElementById('cadastro-termos').checked;

        if (!nome || !cpf || !email || !senha) throw new Error('Preencha todos os campos obrigatórios.');
        if (cpf.length !== 11 || !isValidCPF(cpf)) throw new Error('Informe um CPF válido.');
        if (senha.length < 8) throw new Error('A senha deve ter pelo menos 8 caracteres.');
        if (!/[a-zA-Z]/.test(senha) || !/[0-9]/.test(senha)) throw new Error('A senha deve conter letras e números.');
        if (senha !== confirmacao) throw new Error('As senhas não coincidem.');
        if (!aceitou) throw new Error('Você precisa aceitar os Termos de Uso.');

        const response = await CicloBem.api.post('/conta-digital/cadastro', {
          nome,
          cpf,
          telefone,
          email,
          password: senha,
          password_confirmacao: confirmacao,
          aceite_termos: true
        });

        if (!response.ok) throw new Error(response.error?.message || 'Não foi possível criar a conta.');

        if (response.data && response.data.token) {
          CicloBem.storage.setToken(response.data.token);
          CicloBem.storage.setUser(response.data.user);
        }

        successDiv.textContent = 'Conta criada com sucesso! Redirecionando...';
        successDiv.style.display = 'block';

        setTimeout(() => {
          CicloBem.router.navigate('dashboard');
        }, 1500);
      } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
        CicloBem.logger.error('Cadastro falhou', error);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Criar conta';
      }
    }
  };

  CicloBem.contaDigital.cadastro = ContaDigitalCadastro;
})();
