(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  const CicloBem = window.CicloBem;

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
      { route: 'dashboard', label: 'Início' },
      { route: 'qrcode', label: 'QR Code' },
      { route: 'resgatar', label: 'Resgatar' },
      { route: 'perfil', label: 'Perfil' }
    ];

    menu.innerHTML = items.map(item => {
      const isActive = item.route === activeRoute;
      return `
        <a href="#/${item.route}" style="
          display: flex;
          flex-direction: column;
          align-items: center;
          text-decoration: none;
          color: ${isActive ? '#2dd67b' : 'var(--text-muted, #8b9cb0)'};
          font-size: 12px;
          padding: 6px 12px;
        ">
          <span style="font-size:20px;margin-bottom:2px;">${item.icon || '•'}</span>
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
