(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  window.CicloBem.contaDigital = window.CicloBem.contaDigital || {};
  const CicloBem = window.CicloBem;
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));

  const ICON_USER = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
  const ICON_SHIELD = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
  const ICON_HELP = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  const ICON_LOGOUT = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';
  const ICON_PIN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';

  const ContaDigitalPerfil = {
    async init() {
      this.render();
      await this.load();
      this.bindEvents();
      if (window.CicloBem.menu) window.CicloBem.menu.render('perfil');
    },

    bindEvents() {
      const form = document.getElementById('perfil-chave-pix-form');
      if (form) form.addEventListener('submit', (e) => { e.preventDefault(); this.salvarChavePix(); });

      const logoutBtn = document.getElementById('perfil-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          await CicloBem.auth.logout();
          CicloBem.router.navigate('login');
        });
      }

      const F = (CicloBem.env && CicloBem.env.FEATURES) || {};
      const card = document.getElementById('perfil-passkeys-card');
      if (card && F.passkeys && CicloBem.webauthn && CicloBem.webauthn.isSupported()) {
        card.style.display = 'block';
        this.loadPasskeys();
        const addBtn = document.getElementById('perfil-passkey-add');
        if (addBtn) addBtn.addEventListener('click', () => this.addPasskey(addBtn));
      }
    },

    async loadPasskeys() {
      const listEl = document.getElementById('perfil-passkeys-list');
      const res = await CicloBem.webauthn.listPasskeys();
      if (!listEl) return;
      if (!res.ok) {
        listEl.innerHTML = '<p class="cb-hint">Indisponível.</p>';
        return;
      }
      const items = res.data?.passkeys || [];
      if (items.length === 0) {
        listEl.innerHTML = '<p class="cb-hint">Nenhuma passkey registrada.</p>';
        return;
      }
      listEl.innerHTML = items.map((p) => `
        <div class="cb-list-row">
          <div>
            <div class="cb-list-row__value" style="text-align:left;">${escapeHtml(p.label || 'Passkey')}</div>
            <div class="cb-hint">${p.device_type === 'multiDevice' ? 'Sincronizada' : 'Deste dispositivo'}${p.last_used_at ? ' · último uso ' + new Date(p.last_used_at).toLocaleDateString('pt-BR') : ''}</div>
          </div>
          <button type="button" class="cb-button cb-button--secondary cb-button--sm perfil-passkey-revoke" data-id="${escapeHtml(p.id)}">Remover</button>
        </div>
      `).join('');
      listEl.querySelectorAll('.perfil-passkey-revoke').forEach((btn) => {
        btn.addEventListener('click', () => this.revokePasskey(btn.dataset.id));
      });
    },

    async addPasskey(button) {
      const errorEl = document.getElementById('perfil-passkeys-error');
      const successEl = document.getElementById('perfil-passkeys-success');
      errorEl.style.display = 'none';
      if (successEl) successEl.style.display = 'none';
      button.disabled = true;
      button.textContent = 'Aguardando dispositivo...';
      try {
        const res = await CicloBem.webauthn.registerPasskey();
        if (!res.ok) {
          errorEl.textContent = res.error?.message || 'Erro ao registrar passkey.';
          errorEl.style.display = 'block';
          return;
        }
        if (successEl) successEl.style.display = 'block';
        await this.loadPasskeys();
      } finally {
        button.disabled = false;
        button.textContent = 'Ativar acesso com biometria';
      }
    },

    async revokePasskey(id) {
      const errorEl = document.getElementById('perfil-passkeys-error');
      errorEl.style.display = 'none';
      const res = await CicloBem.webauthn.revokePasskey(id);
      if (!res.ok) {
        errorEl.textContent = res.error?.message || 'Erro ao remover passkey.';
        errorEl.style.display = 'block';
        return;
      }
      await this.loadPasskeys();
    },

    async salvarChavePix() {
      const input = document.getElementById('perfil-chave-pix');
      const errorEl = document.getElementById('perfil-chave-pix-error');
      const successEl = document.getElementById('perfil-chave-pix-success');
      const chave = input.value.trim();

      errorEl.style.display = 'none';
      successEl.style.display = 'none';

      if (!chave) {
        errorEl.textContent = 'Informe uma chave Pix.';
        errorEl.style.display = 'block';
        return;
      }

      try {
        const response = await CicloBem.api.patch('/conta-digital/me/chave-pix', { chave_pix: chave });

        if (response.ok) {
          successEl.textContent = 'Chave Pix salva com sucesso.';
          successEl.style.display = 'block';
          if (this.currentUser) {
            this.currentUser.chave_pix_mascarada = response.data.chave_pix_mascarada;
            this.currentUser.chave_pix_configurada = response.data.chave_pix_configurada;
          }
          input.value = '';
          input.placeholder = this.currentUser.chave_pix_mascarada || input.placeholder;
        } else {
          errorEl.textContent = response.error?.message || 'Erro ao salvar chave Pix.';
          errorEl.style.display = 'block';
        }
      } catch (error) {
        errorEl.textContent = 'Erro ao conectar com o servidor.';
        errorEl.style.display = 'block';
        CicloBem.logger.error('Salvar chave Pix error', error);
      }
    },

    render() {
      this.currentUser = null;
      const root = document.getElementById('conta-digital-root');
      if (!root) return;

      root.innerHTML = `
        <div class="cb-page">
          <header class="cb-header">
            <div>
              <h1 class="cb-header__title">Perfil</h1>
              <p class="cb-header__sub">Seus dados e preferências da conta.</p>
            </div>
          </header>

          <div class="cb-card">
            <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-4);">
              <span class="cb-list-row__icon" style="width:48px;height:48px;border-radius:var(--radius-pill);background:var(--color-brand-soft);color:var(--color-brand-strong);display:flex;align-items:center;justify-content:center;">${ICON_USER}</span>
              <div>
                <p class="cb-card__title" style="margin:0;" id="perfil-nome">—</p>
                <p class="cb-hint" style="margin:0;" id="perfil-tipo">Conta CicloBem</p>
              </div>
            </div>
            <div class="cb-list" id="perfil-dados">
              <div class="cb-skeleton cb-skeleton--line"></div>
              <div class="cb-skeleton cb-skeleton--line"></div>
            </div>
          </div>

          <div class="cb-card">
            <h2 class="cb-card__title">Chave Pix</h2>
            <p class="cb-hint" style="margin:0 0 var(--space-3);">Usada para receber seus resgates.</p>
            <form id="perfil-chave-pix-form" class="cb-form">
              <div class="cb-form-group">
                <label class="cb-label" for="perfil-chave-pix">Sua chave Pix</label>
                <input type="text" id="perfil-chave-pix" class="cb-input" placeholder="CPF, e-mail, celular ou chave aleatória" required autocomplete="off">
              </div>
              <div class="cb-form-error" id="perfil-chave-pix-error" style="display:none;"></div>
              <div class="cb-form-success" id="perfil-chave-pix-success" style="display:none;"></div>
              <button type="submit" class="cb-button cb-button--full" id="perfil-chave-pix-submit">Salvar chave Pix</button>
            </form>
          </div>

          <div class="cb-card">
            <h2 class="cb-card__title">Conta</h2>
            <div class="cb-list">
              <a href="#/seguranca" class="cb-list-row cb-list-row--link">
                <span class="cb-list-row__icon">${ICON_SHIELD}</span>
                <span class="cb-list-row__label" style="color:var(--color-text-primary);font-size:var(--font-size-body);">Segurança</span>
                <span class="cb-list-row__value">›</span>
              </a>
              <a href="#/ajuda" class="cb-list-row cb-list-row--link">
                <span class="cb-list-row__icon">${ICON_HELP}</span>
                <span class="cb-list-row__label" style="color:var(--color-text-primary);font-size:var(--font-size-body);">Ajuda</span>
                <span class="cb-list-row__value">›</span>
              </a>
              <div class="cb-list-row">
                <span class="cb-list-row__icon">${ICON_PIN}</span>
                <span class="cb-list-row__label" style="color:var(--color-text-primary);font-size:var(--font-size-body);">Locais de coleta</span>
                <span class="cb-badge">Em breve</span>
              </div>
              <button type="button" id="perfil-logout" class="cb-list-row cb-list-row--link" style="width:100%;background:none;border:none;padding:var(--space-3) 0;cursor:pointer;font:inherit;">
                <span class="cb-list-row__icon" style="color:var(--color-error);">${ICON_LOGOUT}</span>
                <span class="cb-list-row__label" style="color:var(--color-error);font-size:var(--font-size-body);">Sair da conta</span>
              </button>
            </div>
          </div>

          <div class="cb-card" id="perfil-passkeys-card" style="display:none;">
            <h2 class="cb-card__title">Segurança</h2>
            <p class="cb-hint" style="margin:0 0 var(--space-3);">
              A verificação biométrica acontece no seu dispositivo. CicloBem não recebe nem armazena biometria.
            </p>
            <div id="perfil-passkeys-list" class="cb-list" style="margin-bottom:var(--space-3);"></div>
            <div class="cb-form-error" id="perfil-passkeys-error" style="display:none;"></div>
            <p class="cb-hint" id="perfil-passkeys-success" style="display:none;color:var(--color-success,#2e7d32);margin:0 0 var(--space-3);">Passkey ativada com sucesso.</p>
            <button type="button" class="cb-button cb-button--secondary cb-button--full" id="perfil-passkey-add">Ativar acesso com biometria</button>
          </div>
        </div>
      `;
    },

    async load() {
      const dadosEl = document.getElementById('perfil-dados');
      const nomeEl = document.getElementById('perfil-nome');

      try {
        const response = await CicloBem.api.get('/conta-digital/me');

        if (!response.ok || !response.data) {
          dadosEl.innerHTML = '<p class="cb-error">Erro ao carregar perfil.</p>';
          return;
        }

        const user = response.data.cliente || response.data.user || response.data.perfil || response.data;
        this.currentUser = user;
        const statusMap = {
          ativo: 'Ativo',
          inativo: 'Inativo',
          pendente_validacao: 'Pendente',
          bloqueado: 'Bloqueado'
        };

        const formatDate = (raw) => {
          if (!raw) return '-';
          const d = new Date(raw);
          return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('pt-BR');
        };

        if (nomeEl) nomeEl.textContent = user.nome || 'Minha conta';

        dadosEl.innerHTML = `
          <div class="cb-list-row">
            <span class="cb-list-row__label">E-mail</span>
            <span class="cb-list-row__value">${escapeHtml(user.email_mascarado || '-')}</span>
          </div>
          <div class="cb-list-row">
            <span class="cb-list-row__label">CPF</span>
            <span class="cb-list-row__value">${escapeHtml(user.cpf_mascarado || '-')}</span>
          </div>
          <div class="cb-list-row">
            <span class="cb-list-row__label">Telefone</span>
            <span class="cb-list-row__value">${escapeHtml(user.telefone_mascarado || '-')}</span>
          </div>
          <div class="cb-list-row">
            <span class="cb-list-row__label">Status</span>
            <span class="cb-badge cb-badge--success">${escapeHtml(statusMap[user.status] || user.status || '-')}</span>
          </div>
          <div class="cb-list-row">
            <span class="cb-list-row__label">Tipo</span>
            <span class="cb-list-row__value">${escapeHtml(user.tipo === 'cliente' ? 'Cidadão' : user.tipo || '-')}</span>
          </div>
          <div class="cb-list-row">
            <span class="cb-list-row__label">Cadastro em</span>
            <span class="cb-list-row__value">${escapeHtml(formatDate(user.created_at))}</span>
          </div>
        `;

        const chaveInput = document.getElementById('perfil-chave-pix');
        if (chaveInput) {
          chaveInput.value = '';
          chaveInput.placeholder = user.chave_pix_mascarada || 'CPF, e-mail, celular ou chave aleatória';
        }
      } catch (error) {
        dadosEl.innerHTML = '<p class="cb-error">Erro ao carregar perfil.</p>';
        CicloBem.logger.error('Perfil load error', error);
      }
    }
  };

  CicloBem.contaDigital.perfil = ContaDigitalPerfil;
})();
