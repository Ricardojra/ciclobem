(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  window.CicloBem.contaDigital = window.CicloBem.contaDigital || {};
  const CicloBem = window.CicloBem;

  const FAQ = [
    {
      q: 'Reciclei e o crédito não apareceu. O que faço?',
      a: 'O crédito pode levar alguns instantes para aparecer após a coleta. Atualize a tela de Atividades. Se continuar sem aparecer, anote o local e o horário da reciclagem e fale com a gente.'
    },
    {
      q: 'Como funciona o resgate?',
      a: 'Você solicita o resgate pela tela Resgatar usando sua chave Pix cadastrada. A CicloBem processa o pedido e você recebe na sua conta. O status do pedido aparece nas Atividades.'
    },
    {
      q: 'Para que serve o Meu QR?',
      a: 'Ele identifica você na CicloMachine ou no CicloPonto. Apresente o QR no leitor antes de depositar o material para que a reciclagem seja vinculada à sua conta.'
    },
    {
      q: 'Não consigo entrar na minha conta.',
      a: 'Confira e-mail e senha. Se esqueceu a senha, use "Esqueci minha senha" na tela de login para receber um link de redefinição. Se a conta foi criada na máquina, use "Ativar conta da máquina".'
    },
    {
      q: 'Meus dados estão seguros?',
      a: 'Seus dados sensíveis aparecem mascarados e nunca são exibidos por completo. Biometria, quando disponível, fica apenas no seu dispositivo — a CicloBem não recebe nem armazena biometria.'
    }
  ];

  const ContaDigitalAjuda = {
    init() {
      this.render();
      if (window.CicloBem.menu && CicloBem.auth && CicloBem.auth.isAuthenticated()) {
        window.CicloBem.menu.render('perfil');
      }
    },

    render() {
      const root = document.getElementById('conta-digital-root');
      if (!root) return;

      root.innerHTML = `
        <div class="cb-page">
          <header class="cb-header">
            <div>
              <h1 class="cb-header__title">Ajuda</h1>
              <p class="cb-header__sub">Dúvidas frequentes e como falar com a gente.</p>
            </div>
          </header>

          <div class="cb-card">
            <div class="cb-list">
              ${FAQ.map((item, i) => `
                <div class="ajuda-faq" style="border-bottom:1px solid var(--color-border);">
                  <button type="button" class="ajuda-toggle" data-idx="${i}" aria-expanded="false"
                    style="width:100%;display:flex;justify-content:space-between;align-items:center;gap:var(--space-3);background:none;border:none;padding:var(--space-3) 0;text-align:left;cursor:pointer;font:inherit;color:var(--color-text-primary);font-weight:var(--font-weight-medium);">
                    <span>${item.q}</span>
                    <span aria-hidden="true">+</span>
                  </button>
                  <div id="ajuda-answer-${i}" style="display:none;padding:0 0 var(--space-3);color:var(--color-text-secondary);font-size:var(--font-size-small);line-height:var(--line-height-body);">
                    ${item.a}
                  </div>
                </div>`).join('')}
            </div>
          </div>

          <div class="cb-card">
            <h2 class="cb-card__title">Fale com a gente</h2>
            <p class="cb-page__lead" style="margin:0 0 var(--space-3);">
              Não achou sua resposta? Escreva para a gente que retornamos.
            </p>
            <a class="cb-button cb-button--secondary cb-button--full" href="mailto:contato@ciclobem.com.br">contato@ciclobem.com.br</a>
          </div>
        </div>
      `;

      root.querySelectorAll('.ajuda-toggle').forEach((btn) => {
        btn.addEventListener('click', () => {
          const answer = document.getElementById(`ajuda-answer-${btn.dataset.idx}`);
          if (!answer) return;
          const open = answer.style.display !== 'none';
          answer.style.display = open ? 'none' : 'block';
          btn.setAttribute('aria-expanded', String(!open));
          btn.querySelector('[aria-hidden]').textContent = open ? '+' : '−';
        });
      });
    }
  };

  CicloBem.contaDigital.ajuda = ContaDigitalAjuda;
})();
