const VERSION = 'hero-rush-v1';
const ASSETS = [];
const BASE = new URL('./', self.location.href).href;
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll((ASSETS.length?ASSETS:['./','manifest.webmanifest','icons/icon-192.png']).map(p=>new URL(p,BASE).href))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('hero-rush-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET' || !e.request.url.startsWith(BASE)) return;
  e.respondWith(fetch(e.request).then(r => { if(r.ok) { const copy=r.clone(); e.waitUntil(caches.open(VERSION).then(c => c.put(e.request, copy))); } return r; }).catch(async () => (await caches.match(e.request)) || (e.request.mode === 'navigate' ? await caches.match(BASE) : undefined) || Response.error()));
});
