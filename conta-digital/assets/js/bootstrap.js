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

  function init() {
    try {
      if (!CicloBem.env) throw new Error('Configuração não carregada.');
      CicloBem.toast = { show: showToast };
      CicloBem.router.init();
      hideLoading();
      CicloBem.logger.info('Conta Digital PWA inicializada', { version: CicloBem.env.VERSION });
    } catch (error) {
      const loading = document.getElementById('conta-digital-loading');
      if (loading) {
        loading.innerHTML = `<p class="cb-error">Erro ao iniciar: ${error.message}</p>`;
      }
      console.error('[ContaDigital] Bootstrap failed:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
