// An installed build owns an immutable, complete asset cache. Never mix releases.
const CACHE_PREFIX = 'ovad-clean-engine-';
const CACHE = CACHE_PREFIX + '034h-continue-recovery';
const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/ovad.css?v=034h",
  "./js/content/build.js?v=034h",
  "./js/content/data.js?v=034h",
  "./js/content/game.js?v=034h",
  "./js/core/autosave.js?v=034h",
  "./js/core/agenda.js?v=034h",
  "./js/core/dimension-gear.js?v=034h",
  "./js/core/entities.js?v=034h",
  "./js/core/navigation.js?v=034h",
  "./js/core/player.js?v=034h",
  "./js/core/save-slots.js?v=034h",
  "./js/core/save.js?v=034h",
  "./js/core/simulation.js?v=034h",
  "./js/core/travel.js?v=034h",
  "./js/core/world.js?v=034h",
  "./js/main.js?v=034h",
  "./js/ui/dev-hud.js?v=034h",
  "./js/ui/hold-input.js?v=034h",
  "./js/ui/menu.js?v=034h",
  "./js/ui/save-menu.js?v=034h",
  "./js/ui/scene-view.js?v=034h",
  "./js/ui/travel-view.js?v=034h",
  "./world/world-stage.json?v=034h",
  "./assets/berklith-tavern.jpg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/intro-landscape.jpg",
  "./assets/intro-portrait.jpg",
  "./assets/rionnes-room.jpg"
];
const assetPaths = new Set(CORE.filter(path => path.includes('?v=034h')).map(path => new URL(path, self.registration.scope).pathname));

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
      return (await caches.open(CACHE)).match(new URL('./index.html', self.registration.scope)) || Response.error();
    })());
    return;
  }
  const url = new URL(req.url);
  if (url.searchParams.get('v') === '034h' && assetPaths.has(url.pathname)) {
    // Installed resources are served from one completed cache generation.
    event.respondWith((async () => (await caches.open(CACHE)).match(req) || fetch(req))());
  }
});
