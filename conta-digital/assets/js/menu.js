(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  const CicloBem = window.CicloBem;

  const ICONS = {
    home: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    qrcode: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><line x1="7" y1="7" x2="7" y2="7"/><line x1="17" y1="7" x2="17" y2="7"/><line x1="17" y1="17" x2="17" y2="17"/><line x1="7" y1="17" x2="7" y2="17"/></svg>`,
    resgatar: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
    perfil: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
  };

  function hideMenu() {
    const existing = document.getElementById('conta-digital-bottom-menu');
    if (existing) existing.remove();
  }

  function renderMenu(activeRoute) {
    if (window.CicloBem && !window.CicloBem.auth.isAuthenticated()) {
      hideMenu();
      return;
    }

    const app = document.getElementById('conta-digital-app');
    if (!app) return;

    hideMenu();

    const menu = document.createElement('nav');
    menu.id = 'conta-digital-bottom-menu';
    menu.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-around;
      background: var(--bg-elevated, #111e33);
      border-top: 1px solid var(--border, #1e3a5f);
      box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.4);
      padding: 8px 0 16px;
      z-index: 100;
    `;

    const items = [
      { route: 'dashboard', label: 'Início', icon: ICONS.home },
      { route: 'qrcode', label: 'QR Code', icon: ICONS.qrcode },
      { route: 'resgatar', label: 'Resgatar', icon: ICONS.resgatar },
      { route: 'perfil', label: 'Perfil', icon: ICONS.perfil }
    ];

    menu.innerHTML = items.map(item => {
      const isActive = item.route === activeRoute;
      return `
        <a href="#/${item.route}" aria-label="${item.label}" style="
          display: flex;
          flex-direction: column;
          align-items: center;
          text-decoration: none;
          color: ${isActive ? '#2dd67b' : 'var(--text-muted, #8b9cb0)'};
          font-size: 12px;
          padding: 6px 12px;
          min-width: 60px;
        ">
          <span style="width:24px;height:24px;margin-bottom:2px;display:flex;align-items:center;justify-content:center;">${item.icon}</span>
          ${item.label}
        </a>
      `;
    }).join('');

    app.appendChild(menu);

    document.querySelectorAll('.conta-digital-dashboard, .conta-digital-root').forEach(el => {
      el.style.paddingBottom = '70px';
    });
  }

  CicloBem.menu = { render: renderMenu, hide: hideMenu };
})();
