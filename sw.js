const CACHE = 'ovad-clean-engine-033b-gesture-audit';
const CORE = [
  './','./index.html','./manifest.webmanifest','./css/ovad.css',
  './js/main.js','./js/core/world.js','./js/core/player.js','./js/core/dimension-gear.js','./js/core/agenda.js',
  './js/core/entities.js','./js/core/navigation.js','./js/core/simulation.js','./js/core/travel.js','./js/core/save.js',
  './js/content/data.js','./js/content/game.js','./js/content/build.js','./world/world-stage.json',
  './assets/berklith-tavern.jpg','./assets/rionnes-room.jpg','./assets/intro-landscape.jpg',
  './assets/intro-portrait.jpg','./assets/icon-192.png','./assets/icon-512.png'
];
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
});
self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const req = event.request;
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith((async()=>{
      try {
        const fresh = await fetch(req, {cache:'no-store'});
        const cache = await caches.open(CACHE);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch {
        return (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async()=>{
    const cached = await caches.match(req);
    const network = fetch(req).then(async fresh => {
      if (fresh?.ok) (await caches.open(CACHE)).put(req, fresh.clone());
      return fresh;
    }).catch(()=>null);
    return cached || await network || Response.error();
  })());
});
