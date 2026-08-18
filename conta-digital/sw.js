const CACHE_NAME = 'conta-ciclobem-1248eda2ef62';
const APP_SHELL = [
    '/conta-digital/',
    '/conta-digital/index.html',
    '/conta-digital/manifest.json',
    '/conta-digital/assets/css/conta-digital.css',
    '/conta-digital/assets/js/apiClient.js',
    '/conta-digital/assets/js/ativar.js',
    '/conta-digital/assets/js/auth.js',
    '/conta-digital/assets/js/bootstrap.js',
    '/conta-digital/assets/js/cadastro.js',
    '/conta-digital/assets/js/dashboard.js',
    '/conta-digital/assets/js/env.js',
    '/conta-digital/assets/js/esqueci-senha.js',
    '/conta-digital/assets/js/logger.js',
    '/conta-digital/assets/js/login.js',
    '/conta-digital/assets/js/menu.js',
    '/conta-digital/assets/js/perfil.js',
    '/conta-digital/assets/js/qrcode.js',
    '/conta-digital/assets/js/redefinir-senha.js',
    '/conta-digital/assets/js/resgatar.js',
    '/conta-digital/assets/js/router.js',
    '/conta-digital/assets/js/storage.js',
    '/conta-digital/icons/icon-192x192.png',
    '/conta-digital/icons/icon-512x512.png'
];

const NEVER_CACHE = [
  '/api/',
  '/auth/',
  '/conta-digital/assets/js/env.js'
];

function shouldCache(url) {
  if (url.pathname.includes('/env.js')) return false;
  if (url.pathname.includes('/sw.js')) return false;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return false;
  if (url.pathname.startsWith('/conta-digital/ativar') || url.pathname.startsWith('/conta-digital/login') || url.pathname.startsWith('/conta-digital/cadastro')) return false;
  return url.pathname.startsWith('/conta-digital/');
}

self.addEventListener('install', (event) => {
  console.log('[SW] Instalando nova versão:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.error('[SW] Falha ao pre-cache:', err);
        self.skipWaiting();
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    console.log('[SW] skipWaiting recebido');
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Limpando cache antigo:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) {
    return;
  }

  if (url.pathname.includes('/env.js') || url.pathname.includes('/sw.js')) {
    return;
  }

  if (url.pathname === '/conta-digital/' || url.pathname === '/conta-digital/index.html') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  if (!shouldCache(url)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
        }
        return response;
      });
    })
  );
});
