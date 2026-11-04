// An installed build owns an immutable, complete asset cache. Never mix releases.
const CACHE_PREFIX = 'ovad-clean-engine-';
const CACHE = CACHE_PREFIX + '041a-entity-presence';
const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/ovad.css?v=041a",
  "./js/content/build.js?v=041a",
  "./js/content/data.js?v=041a",
  "./js/content/game.js?v=041a",
  "./js/core/autosave.js?v=041a",
  "./js/core/agenda.js?v=041a",
  "./js/core/dimension-gear.js?v=041a",
  "./js/core/entities.js?v=041a",
  "./js/core/navigation.js?v=041a",
  "./js/core/presence.js?v=041a",
  "./js/core/player.js?v=041a",
  "./js/core/save-slots.js?v=041a",
  "./js/core/save.js?v=041a",
  "./js/core/simulation.js?v=041a",
  "./js/core/travel.js?v=041a",
  "./js/core/world.js?v=041a",
  "./js/main.js?v=041a",
  "./js/ui/dev-hud.js?v=041a",
  "./js/ui/hold-input.js?v=041a",
  "./js/ui/menu.js?v=041a",
  "./js/ui/save-menu.js?v=041a",
  "./js/ui/scene-view.js?v=041a",
  "./js/ui/travel-view.js?v=041a",
  "./world/world-stage.json?v=041a",
  "./assets/berklith-tavern.jpg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/intro-landscape.jpg",
  "./assets/intro-portrait.jpg",
  "./assets/rionnes-room.jpg",
  './assets/sprites/rionne-front.png',
  './assets/sprites/rionne-front-three-quarter.png',
  './assets/sprites/rionne-back-three-quarter.png',
  './assets/sprites/rionne-back.png',
  './assets/sprites/barmaid-serving.png'
];
const assetPaths = new Set(CORE.filter(path => path.includes('?v=041a')).map(path => new URL(path, self.registration.scope).pathname));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try {
      // Cache.addAll rejects if any required resource fails: no partial activation.
      await cache.addAll(CORE.map(path => new Request(new URL(path, self.registration.scope), { cache: 'reload' })));
    } catch (error) {
      await caches.delete(CACHE);
      throw error;
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(req, { cache: 'no-store' });
        if (response.ok) return response;
      } catch { /* offline fallback below */ }
      return (await (await caches.open(CACHE)).match(new URL('./index.html', self.registration.scope))) || Response.error();
    })());
    return;
  }
  const url = new URL(req.url);
  if (url.searchParams.get('v') === '041a' && assetPaths.has(url.pathname)) {
    // Installed resources are served from one completed cache generation.
    event.respondWith((async () => (await (await caches.open(CACHE)).match(req)) || fetch(req))());
  }
});
