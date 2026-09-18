/**
 * Conta CicloBem — PWA service worker.
 *
 * Cache policy (CICLOBEM-CONTA-DIGITAL-PWA-PROFESSIONALIZATION-01):
 *   CACHE_ALLOWED : versioned static app shell only (HTML/CSS/JS/icons).
 *   NETWORK_ONLY  : /api/, /auth/, env.js, sw.js — never intercepted.
 *
 * Update strategy: update-on-next-load. A new worker installs and waits;
 * it activates when the last controlled client closes, or early via the
 * 'skipWaiting' message. No mid-session swap.
 *
 * Cleanup scope: only caches under the CicloBem Conta prefixes
 * (ciclobem-conta-* / conta-ciclobem-*) are deleted — unrelated origin
 * caches are left untouched.
 */
const CACHE_VERSION = 'v5';
const CACHE_PREFIXES = ['ciclobem-conta-', 'conta-ciclobem-'];
const CACHE_NAME = `ciclobem-conta-static-${CACHE_VERSION}`;

const APP_SHELL = [
    '/conta-digital/',
    '/conta-digital/index.html',
    '/conta-digital/manifest.json',
    '/conta-digital/politica-privacidade.html',
    '/conta-digital/termos-de-uso.html',
    '/conta-digital/styles/tokens.css',
    '/conta-digital/assets/css/components.css',
    '/conta-digital/assets/css/conta-digital.css',
    '/conta-digital/assets/brand/ciclobem-logo-dark.png',
    '/conta-digital/assets/brand/ciclobem-logo.png',
    '/conta-digital/assets/js/ajuda.js',
    '/conta-digital/assets/js/apiClient.js',
    '/conta-digital/assets/js/ativar.js',
    '/conta-digital/assets/js/atividades.js',
    '/conta-digital/assets/js/auth.js',
    '/conta-digital/assets/js/bootstrap.js',
    '/conta-digital/assets/js/cadastro.js',
    '/conta-digital/assets/js/dashboard.js',
    '/conta-digital/assets/js/env.js',
    '/conta-digital/assets/js/esqueci-senha.js',
    '/conta-digital/assets/js/impacto.js',
    '/conta-digital/assets/js/logger.js',
    '/conta-digital/assets/js/login.js',
    '/conta-digital/assets/js/menu.js',
    '/conta-digital/assets/js/money.js',
    '/conta-digital/assets/js/perfil.js',
    '/conta-digital/assets/js/qrcode-generator.js',
    '/conta-digital/assets/js/qrcode.js',
    '/conta-digital/assets/js/redefinir-senha.js',
    '/conta-digital/assets/js/resgatar.js',
    '/conta-digital/assets/js/router.js',
    '/conta-digital/assets/js/seguranca.js',
    '/conta-digital/assets/js/storage.js',
    '/conta-digital/assets/js/webauthn.js',
    '/conta-digital/icons/icon-192.png',
    '/conta-digital/icons/icon-192x192.png',
    '/conta-digital/icons/icon-512.png',
    '/conta-digital/icons/icon-512x512.png',
    '/conta-digital/icons/icon-maskable-192x192.png',
    '/conta-digital/icons/icon-maskable-512x512.png',
    '/conta-digital/icons/apple-touch-icon.png'
];

function isNetworkOnly(url) {
  return url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/');
}

function shouldCache(url) {
  if (isNetworkOnly(url)) return false;
  if (url.pathname.includes('/env.js')) return false;
  if (url.pathname.includes('/sw.js')) return false;
  return url.pathname.startsWith('/conta-digital/');
}

function isContaCache(key) {
  return CACHE_PREFIXES.some((p) => key.startsWith(p));
}

self.addEventListener('install', (event) => {
  console.log('[SW] Instalando nova versão:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) =>
        // Resilient precache: one missing/optional asset must not abort the
        // whole install (root cause of the old 'addAll cache failed' bug).
        Promise.allSettled(APP_SHELL.map((url) => cache.add(url)))
          .then((results) => {
            const failed = results.filter((r) => r.status === 'rejected');
            if (failed.length) {
              console.error(`[SW] Precache parcial: ${failed.length}/${APP_SHELL.length} falharam`);
            }
          })
      )
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
          if (isContaCache(key) && key !== CACHE_NAME) {
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

  // Auth and financial APIs are network-only: the worker never intercepts.
  if (isNetworkOnly(url)) {
    return;
  }

  if (url.pathname.includes('/env.js') || url.pathname.includes('/sw.js')) {
    return;
  }

  // Navigation HTML: network-first so a new deploy is never hidden by a
  // stale shell; cache fallback only as an offline shell.
  if (url.pathname === '/conta-digital/' || url.pathname === '/conta-digital/index.html') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
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

  // Static assets: cache-first, write-through on miss. A cache write
  // failure must never block the online response.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache)).catch(() => {});
        }
        return response;
      });
    })
  );
});
