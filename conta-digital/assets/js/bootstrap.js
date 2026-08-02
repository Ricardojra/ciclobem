(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  const CicloBem = window.CicloBem;

  function showToast(message, type = 'info') {
    const toast = document.getElementById('conta-digital-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'conta-digital-toast conta-digital-toast--' + type;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 4000);
  }

  function hideLoading() {
    const loading = document.getElementById('conta-digital-loading');
    const root = document.getElementById('conta-digital-root');
    if (loading) loading.style.display = 'none';
    if (root) root.style.display = 'block';
  }

  function handleServiceWorkerUpdate(reg) {
    if (!reg) return;

    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[PWA] Nova versão disponível');

          if (window.confirm('Uma nova versão da Conta Digital CicloBem está disponível. Deseja atualizar agora?')) {
            newWorker.postMessage({ action: 'skipWaiting' });
          }
        }
      });
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.action === 'reload') {
        window.location.reload();
      }
    });

    setInterval(() => {
      console.log('[PWA] Verificando atualização do service worker');
      reg.update();
    }, 60000);
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return null;
    try {
      const reg = await navigator.serviceWorker.register('sw.js');
      handleServiceWorkerUpdate(reg);
      return reg;
    } catch (err) {
      console.warn('[PWA] Service worker não registrado:', err);
      return null;
    }
  }

  function init() {
    try {
      if (!CicloBem.env) throw new Error('Configuração não carregada.');
      CicloBem.toast = { show: showToast };
      CicloBem.router.init();
      hideLoading();
      CicloBem.logger.info('Conta Digital inicializada', { version: CicloBem.env.VERSION });
    } catch (error) {
      const loading = document.getElementById('conta-digital-loading');
      if (loading) {
        loading.innerHTML = `<p class="cb-error">Erro ao iniciar: ${error.message}</p>`;
      }
      console.error('[ContaDigital] Bootstrap failed:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      registerServiceWorker().finally(init);
    });
  } else {
    registerServiceWorker().finally(init);
  }
})();
