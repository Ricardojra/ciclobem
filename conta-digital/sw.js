/**
 * Conta CicloBem — service worker de descontinuação (link cutover).
 *
 * A rota legada /conta-digital/ foi substituída por um redirect para a
 * origem canônica https://conta.ciclobem.com.br. Este worker existe para
 * clientes que ainda têm o app shell antigo em cache: ele se instala,
 * apaga os caches da Conta nesta origem e se desregistra, garantindo que
 * a próxima navegação busque a página de redirect na rede.
 */
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
        await self.registration.unregister();
        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach((client) => client.navigate('https://conta.ciclobem.com.br/'));
    })());
});

self.addEventListener('fetch', (event) => {
    // Passthrough: nada é interceptado ou cacheado.
});
