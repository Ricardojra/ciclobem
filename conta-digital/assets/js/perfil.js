(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  window.CicloBem.contaDigital = window.CicloBem.contaDigital || {};
  const CicloBem = window.CicloBem;

  const ContaDigitalPerfil = {
    async init() {
      this.render();
      await this.load();
      if (window.CicloBem.menu) window.CicloBem.menu.render('perfil');
    },

    render() {
      const root = document.getElementById('conta-digital-root');
      if (!root) return;

      root.innerHTML = `
        <div class="conta-digital-dashboard">
          <div class="dashboard-header" style="position:sticky;top:0;z-index:101;background:var(--bg-elevated,#111e33);border-bottom:1px solid var(--border,#1e3a5f);padding:20px 24px;margin:-24px -24px 24px;display:flex;justify-content:space-between;align-items:center;">
            <h1 style="font-size:22px;margin:0;">Meu Perfil</h1>
            <button id="perfil-logout" class="cb-button cb-button--secondary" style="padding:8px 14px;font-size:13px;">Sair</button>
          </div>

          <div class="dashboard-card" style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;margin-bottom:16px;">
            <h2 style="font-size:14px;color:var(--text-muted);margin:0 0 12px;">Dados cadastrais</h2>
            <div id="perfil-dados" style="display:flex;flex-direction:column;gap:12px;">
              <p style="color:var(--text-muted);">Carregando...</p>
            </div>
          </div>

          <div class="dashboard-card" style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;">
            <h2 style="font-size:14px;color:var(--text-muted);margin:0 0 12px;">Status da conta</h2>
            <div id="perfil-status" style="display:flex;flex-direction:column;gap:12px;">
              <p style="color:var(--text-muted);">Carregando...</p>
            </div>
          </div>
        </div>
      `;

      const logoutBtn = document.getElementById('perfil-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          await CicloBem.auth.logout();
          CicloBem.router.navigate('login');
        });
      }
    },

    async load() {
      const dadosEl = document.getElementById('perfil-dados');
      const statusEl = document.getElementById('perfil-status');

      try {
        const response = await CicloBem.api.get('/conta-digital/me');

        if (!response.ok || !response.data) {
          dadosEl.innerHTML = '<p class="cb-error">Erro ao carregar perfil.</p>';
          statusEl.innerHTML = '<p class="cb-error">Erro ao carregar status.</p>';
          return;
        }

        const user = response.data.cliente || response.data.user || response.data.perfil || response.data;
        const statusMap = {
          ativo: 'Ativo',
          inativo: 'Inativo',
          pendente_validacao: 'Pendente',
          bloqueado: 'Bloqueado'
        };

        const cpf = user.cpf_mascarado || user.cpf || '-';

        const formatDate = (raw) => {
          if (!raw) return '-';
          let fixed = raw;
          if (typeof raw === 'string' && raw.match(/\.\d{2}Z$/)) {
            fixed = raw.replace(/\.(\d{2})Z$/, '.490Z');
          }
          const d = new Date(fixed);
          return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('pt-BR');
        };

        dadosEl.innerHTML = `
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border);padding-bottom:8px;">
            <span style="color:var(--text-muted);">Nome</span>
            <span style="color:var(--text);font-weight:500;">${user.nome || '-'}</span>
          </div>
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border);padding-bottom:8px;">
            <span style="color:var(--text-muted);">E-mail</span>
            <span style="color:var(--text);font-weight:500;">${user.email || '-'}</span>
          </div>
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border);padding-bottom:8px;">
            <span style="color:var(--text-muted);">CPF</span>
            <span style="color:var(--text);font-weight:500;">${cpf}</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:var(--text-muted);">Telefone</span>
            <span style="color:var(--text);font-weight:500;">${user.telefone || '-'}</span>
          </div>
        `;

        statusEl.innerHTML = `
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border);padding-bottom:8px;">
            <span style="color:var(--text-muted);">Status</span>
            <span style="color:var(--lime);font-weight:500;">${statusMap[user.status] || user.status || '-'}</span>
          </div>
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border);padding-bottom:8px;">
            <span style="color:var(--text-muted);">Tipo</span>
            <span style="color:var(--text);font-weight:500;">${user.tipo === 'cliente' ? 'Cidadão' : user.tipo || '-'}</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:var(--text-muted);">Cadastro em</span>
            <span style="color:var(--text);font-weight:500;">${formatDate(user.created_at)}</span>
          </div>
        `;
      } catch (error) {
        dadosEl.innerHTML = '<p class="cb-error">Erro ao carregar perfil.</p>';
        statusEl.innerHTML = '<p class="cb-error">Erro ao carregar status.</p>';
        CicloBem.logger.error('Perfil load error', error);
      }
    }
  };

  CicloBem.contaDigital.perfil = ContaDigitalPerfil;
})();
