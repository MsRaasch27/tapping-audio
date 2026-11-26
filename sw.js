// Service worker: makes the app work offline and receives audio shared from other apps.
// Bump this version whenever you change any app file, so phones pick up the update.
const CACHE = 'recordings-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.method === 'POST' && url.pathname.endsWith('/share-target')) {
    event.respondWith(handleShare(req));
    return;
  }
  if (req.method !== 'GET') return;

  // Stale-while-revalidate: answer from cache instantly, refresh the cache in the background.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
    const network = fetch(req).then((res) => {
      if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    if (cached) { event.waitUntil(network); return cached; }
    const res = await network;
    if (res) return res;
    if (req.mode === 'navigate') {
      const shell = await cache.match('./index.html');
      if (shell) return shell;
    }
    return new Response('Offline', { status: 503 });
  })());
});

// ---- Share target: save shared audio files into the same database the app uses ----
const AUDIO_EXT = /\.(m4a|mp3|wav|ogg|oga|opus|webm|aac|flac|mp4|3gp|amr)$/i;

async function handleShare(request) {
  let added = 0;
  try {
    const form = await request.formData();
    const files = form.getAll('audio').filter((f) => f && typeof f === 'object' && f.size > 0);
    const db = await openDB();
    for (const file of files) {
      if (!(file.type || '').startsWith('audio/') && !AUDIO_EXT.test(file.name || '') &&
          !(file.type || '').startsWith('video/')) continue;
      const id = (self.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random();
      const name = (file.name || 'Shared recording').replace(/\.[^.]+$/, '') || 'Shared recording';
      const ext = ((file.name || '').match(/\.([^.]+)$/) || [])[1] || '';
      const meta = {
        id, name, ext: ext.toLowerCase(), type: file.type || '',
        created: Date.now(), size: file.size, duration: null, position: 0, source: 'share'
      };
      await new Promise((resolve, reject) => {
        const t = db.transaction(['meta', 'blobs'], 'readwrite');
        t.objectStore('meta').put(meta);
        t.objectStore('blobs').put(file, id);
        t.oncomplete = resolve;
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      });
      added++;
    }
  } catch (e) {
    console.error('Share failed', e);
  }
  return Response.redirect(new URL('./?shared=' + added, self.registration.scope).href, 303);
}

function openDB() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open('recordings-db', 1);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('blobs')) db.createObjectStore('blobs');
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
