// An installed build owns an immutable, complete asset cache. Never mix releases.
const CACHE_PREFIX = 'ovad-clean-engine-';
const CACHE = CACHE_PREFIX + '042e9-cleanup-tuning';
const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/ovad.css?v=042e9",
  "./js/content/build.js?v=042e9",
  "./js/content/data.js?v=042e9",
  "./js/content/game.js?v=042e9",
  "./js/content/tuning.js?v=042e9",
  "./js/content/interactions.js?v=042e9",
  "./js/core/interaction-content.js?v=042e9",
  "./js/ui/interactions.js?v=042e9",
  "./js/core/autosave.js?v=042e9",
  "./js/core/agenda.js?v=042e9",
  "./js/core/dimension-gear.js?v=042e9",
  "./js/core/entities.js?v=042e9",
  "./js/core/movement-plan.js?v=042e9",
  "./js/core/route-path.js?v=042e9",
  "./js/core/transfer-plan.js?v=042e9",
  "./js/core/navigation.js?v=042e9",
  "./js/core/presence.js?v=042e9",
  "./js/core/player.js?v=042e9",
  "./js/core/save-slots.js?v=042e9",
  "./js/core/save.js?v=042e9",
  "./js/core/simulation.js?v=042e9",
  "./js/core/travel.js?v=042e9",
  "./js/core/world.js?v=042e9",
  "./js/main.js?v=042e9",
  "./js/ui/dev-hud.js?v=042e9",
  "./js/ui/hold-input.js?v=042e9",
  "./js/ui/movement-view.js?v=042e9",
  "./js/ui/menu.js?v=042e9",
  "./js/ui/save-menu.js?v=042e9",
  "./js/ui/scene-view.js?v=042e9",
  "./js/ui/travel-view.js?v=042e9",
  "./world/world-stage.json?v=042e9",
  "./assets/berklith-tavern.jpg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/intro-landscape.jpg",
  "./assets/intro-portrait.jpg",
  "./assets/rionnes-room.jpg",
  "./assets/characters/rionne-card.png",
  './assets/sprites/rionne-front.png',
  './assets/sprites/rionne-front-three-quarter.png',
  './assets/sprites/rionne-back-three-quarter.png',
  './assets/sprites/rionne-back.png',
  './assets/sprites/rionne-front-three-quarter-right.png',
  './assets/sprites/rionne-back-three-quarter-right.png',
  './assets/sprites/barmaid-serving.png'
];
// Exact precache URLs include both versioned modules and unversioned images.
// A single completed cache generation owns all of these resources.
const assetURLs = new Set(CORE.map(path => new URL(path, self.registration.scope).href));

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
  if (assetURLs.has(req.url)) {
    // Installed resources are served from one completed cache generation.
    event.respondWith((async () => (await (await caches.open(CACHE)).match(req)) || fetch(req))());
  }
});
