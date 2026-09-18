(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  const CicloBem = window.CicloBem;

  /**
   * DESIGN-SYSTEM-01 — one coherent outline icon style (Feather-style
   * stroke icons) across the navigation. No mixed filled/3D/emoji icons.
   */
  const ICONS = {
    home: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    atividades: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
    qrcode: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><line x1="7" y1="7" x2="7" y2="7"/><line x1="17" y1="7" x2="17" y2="7"/><line x1="17" y1="17" x2="17" y2="17"/><line x1="7" y1="17" x2="7" y2="17"/></svg>`,
    impacto: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
    perfil: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
  };

  function hideMenu() {
    const existing = document.getElementById('conta-digital-bottom-menu');
    if (existing) existing.remove();
    const root = document.getElementById('conta-digital-root');
    if (root) root.classList.remove('conta-digital-root--nav');
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
    menu.className = 'cb-nav';
    // safe-area-inset-bottom is applied via .cb-nav padding
    menu.setAttribute('aria-label', 'Navegação principal');

    const items = [
      { route: 'dashboard', label: 'Início', icon: ICONS.home },
      { route: 'atividades', label: 'Atividades', icon: ICONS.atividades },
      { route: 'qrcode', label: 'Meu QR', icon: ICONS.qrcode },
      { route: 'impacto', label: 'Impacto', icon: ICONS.impacto },
      { route: 'perfil', label: 'Perfil', icon: ICONS.perfil }
    ];

    menu.innerHTML = items.map(item => {
      const isActive = item.route === activeRoute;
      return `
        <a href="#/${item.route}" class="cb-nav__item" aria-label="${item.label}"
           style="min-width: 60px"
           ${isActive ? 'aria-current="page"' : ''}>
          ${item.icon}
          <span>${item.label}</span>
        </a>
      `;
    }).join('');

    app.appendChild(menu);
    const root = document.getElementById('conta-digital-root');
    if (root) root.classList.add('conta-digital-root--nav');
  }

  CicloBem.menu = { render: renderMenu, hide: hideMenu };
})();
