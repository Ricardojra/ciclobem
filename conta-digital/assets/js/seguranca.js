(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  window.CicloBem.contaDigital = window.CicloBem.contaDigital || {};
  const CicloBem = window.CicloBem;
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));

  const ICON_KEY = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>';
  const ICON_FINGERPRINT = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 0 0 8 11a4 4 0 1 1 8 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0 0 15.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 0 0 8 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"/></svg>';
  const ICON_DEVICES = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>';
  const ICON_LOGOUT = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';

  const ContaDigitalSeguranca = {
    init() {
      this.render();
      this.load();
      if (window.CicloBem.menu) window.CicloBem.menu.render('perfil');
    },

    render() {
      const root = document.getElementById('conta-digital-root');
      if (!root) return;
      const F = (CicloBem.env && CicloBem.env.FEATURES) || {};

      root.innerHTML = `
        <div class="cb-page">
          <header class="cb-header">
            <div>
              <h1 class="cb-header__title">Segurança</h1>
              <p class="cb-header__sub">Proteja sua conta e gerencie o acesso.</p>
            </div>
          </header>

          <div class="cb-card cb-card--security">
            <h2 class="cb-card__title">Sessão atual</h2>
            <div id="seguranca-session">
              <div class="cb-skeleton cb-skeleton--line"></div>
            </div>
          </div>

          <div class="cb-card">
            <h2 class="cb-card__title">Acesso</h2>
            <div class="cb-list">
              <a href="#/esqueci-senha" class="cb-list-row cb-list-row--link">
                <span class="cb-list-row__icon">${ICON_KEY}</span>
                <span class="cb-list-row__label" style="color:var(--color-text-primary);font-size:var(--font-size-body);">Redefinir senha</span>
                <span class="cb-list-row__value">via e-mail</span>
              </a>
              <div class="cb-list-row">
                <span class="cb-list-row__icon">${ICON_FINGERPRINT}</span>
                <span class="cb-list-row__label" style="color:var(--color-text-primary);font-size:var(--font-size-body);">Biometria / Passkeys</span>
                ${F.passkeys
                  ? '<span class="cb-badge cb-badge--success">Disponível</span>'
                  : '<span class="cb-badge">Em breve</span>'}
              </div>
              <div class="cb-list-row">
                <span class="cb-list-row__icon">${ICON_DEVICES}</span>
                <span class="cb-list-row__label" style="color:var(--color-text-primary);font-size:var(--font-size-body);">Dispositivos conectados</span>
                ${F.sessions
                  ? '<span class="cb-badge cb-badge--success">Disponível</span>'
                  : '<span class="cb-badge">Em breve</span>'}
              </div>
            </div>
          </div>

          <div class="cb-card">
            <h2 class="cb-card__title">Boas práticas</h2>
            <div class="cb-list">
              <div class="cb-list-row"><span class="cb-list-row__label">Use uma senha só sua, difícil de adivinhar.</span></div>
              <div class="cb-list-row"><span class="cb-list-row__label">Não compartilhe seu QR Code em redes públicas.</span></div>
              <div class="cb-list-row"><span class="cb-list-row__label">A CicloBem nunca pede sua senha por mensagem.</span></div>
            </div>
          </div>

          <button type="button" class="cb-button cb-button--danger cb-button--full" id="seguranca-logout">
            Sair desta conta
          </button>
        </div>
      `;

      const logoutBtn = document.getElementById('seguranca-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          await CicloBem.auth.logout();
          CicloBem.router.navigate('login');
        });
      }
    },

    async load() {
      const sessionEl = document.getElementById('seguranca-session');
      if (!sessionEl) return;

      try {
        const res = await CicloBem.api.get('/auth/me');
        const user = res.ok && res.data ? (res.data.user || res.data) : null;
        const email = user && (user.email_mascarado || user.email);

        sessionEl.innerHTML = `
          <div class="cb-list">
            <div class="cb-list-row">
              <span class="cb-list-row__label">Conta</span>
              <span class="cb-list-row__value">${escapeHtml(email || 'Sessão ativa')}</span>
            </div>
            <div class="cb-list-row">
              <span class="cb-list-row__label">Este dispositivo</span>
              <span class="cb-badge cb-badge--success">Ativo agora</span>
            </div>
          </div>`;
      } catch (error) {
        sessionEl.innerHTML = `
          <div class="cb-list">
            <div class="cb-list-row"><span class="cb-list-row__label">Sessão ativa neste dispositivo.</span></div>
          </div>`;
        CicloBem.logger.error('Segurança session load error', error);
      }
    }
  };

  CicloBem.contaDigital.seguranca = ContaDigitalSeguranca;
})();
