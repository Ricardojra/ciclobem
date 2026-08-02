#!/usr/bin/env node
/**
 * Deploy script para Conta Digital CicloBem
 * - Gera hash por arquivo de asset
 * - Atualiza index.html com query string de cache busting
 * - Atualiza sw.js com APP_SHELL e CACHE_NAME versionado
 * - Commita e sobe para o GitHub (opcional)
 *
 * Uso:
 *   node deploy.js
 *   node deploy.js --no-push
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const ROOT = __dirname;
const CONTA_DIGITAL = path.join(ROOT, 'conta-digital');
const INDEX_HTML = path.join(CONTA_DIGITAL, 'index.html');
const SW_JS = path.join(CONTA_DIGITAL, 'sw.js');
const MANIFEST = path.join(CONTA_DIGITAL, 'manifest.json');

function hashFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
}

function hashAllFiles(filePaths) {
  const hashes = filePaths.map(hashFile).join('|');
  return crypto.createHash('sha256').update(hashes).digest('hex').slice(0, 12);
}

function listAssets() {
  const jsDir = path.join(CONTA_DIGITAL, 'assets', 'js');
  const cssDir = path.join(CONTA_DIGITAL, 'assets', 'css');
  const iconsDir = path.join(CONTA_DIGITAL, 'icons');

  const jsFiles = fs.readdirSync(jsDir)
    .filter(f => f.endsWith('.js'))
    .map(f => `assets/js/${f}`);

  const cssFiles = fs.readdirSync(cssDir)
    .filter(f => f.endsWith('.css'))
    .map(f => `assets/css/${f}`);

  const iconFiles = fs.existsSync(iconsDir)
    ? fs.readdirSync(iconsDir)
        .filter(f => f.endsWith('.png') || f.endsWith('.svg'))
        .map(f => `icons/${f}`)
    : [];

  return {
    js: jsFiles,
    css: cssFiles,
    icons: iconFiles
  };
}

function updateIndexHtml(assets, hashes) {
  let html = fs.readFileSync(INDEX_HTML, 'utf8');

  html = html.replace(/\?v=[a-f0-9]+"/g, '"');

  const all = [...assets.js, ...assets.css, 'manifest.json'];
  all.forEach(relativePath => {
    const fullPath = path.join(CONTA_DIGITAL, relativePath);
    const hash = fs.existsSync(fullPath) ? hashFile(fullPath) : hashes.global;

    const safePath = relativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const srcPattern = new RegExp(`src="([^"]*)${safePath}"`, 'g');
    const hrefPattern = new RegExp(`href="([^"]*)${safePath}"`, 'g');

    html = html.replace(srcPattern, (match, prefix) => `src="${prefix}${relativePath}?v=${hash}"`);
    html = html.replace(hrefPattern, (match, prefix) => `href="${prefix}${relativePath}?v=${hash}"`);
  });

  fs.writeFileSync(INDEX_HTML, html, 'utf8');
  console.log(`[deploy] ${INDEX_HTML} atualizado`);
}

function updateServiceWorker(assets, hashes) {
  const appShell = [
    '/conta-digital/',
    '/conta-digital/index.html',
    '/conta-digital/manifest.json',
    ...[...assets.css, ...assets.js, ...assets.icons].map(f => `/conta-digital/${f}`)
  ];

  const cacheName = `conta-ciclobem-${hashes.global}`;

  const appShellList = appShell
    .map(p => `    '${p}'`)
    .join(',\n');

  const swTemplate = `const CACHE_NAME = '${cacheName}';
const APP_SHELL = [
${appShellList}
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
`;

  fs.writeFileSync(SW_JS, swTemplate, 'utf8');
  console.log(`[deploy] ${SW_JS} atualizado (cache: ${cacheName})`);
}

function gitCommitAndPush() {
  try {
    const status = execSync('git status --short', { cwd: ROOT, encoding: 'utf8' });
    if (!status.trim()) {
      console.log('[deploy] Nada para commitar.');
      return;
    }

    execSync('git add .', { cwd: ROOT, stdio: 'inherit' });
    const timestamp = new Date().toISOString();
    const msg = `deploy: atualiza cache busting e service worker - ${timestamp}`;
    execSync(`git commit -m "${msg}"`, { cwd: ROOT, stdio: 'inherit' });
    execSync('git push origin main', { cwd: ROOT, stdio: 'inherit' });
    console.log('[deploy] Push realizado.');
  } catch (err) {
    console.error('[deploy] Erro no git:', err.message);
    process.exit(1);
  }
}

function main() {
  const noPush = process.argv.includes('--no-push');

  const assets = listAssets();
  const allFiles = [
    INDEX_HTML,
    MANIFEST,
    ...assets.js.map(f => path.join(CONTA_DIGITAL, f)),
    ...assets.css.map(f => path.join(CONTA_DIGITAL, f))
  ];
  const globalHash = hashAllFiles(allFiles);
  const hashes = { global: globalHash };

  updateServiceWorker(assets, hashes);
  updateIndexHtml(assets, hashes);

  if (!noPush) {
    gitCommitAndPush();
  } else {
    console.log('[deploy] Modo --no-push: arquivos atualizados localmente, mas não subidos.');
  }
}

main();
