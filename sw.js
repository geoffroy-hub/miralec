/* ============================================================
   Miralocks — Service Worker v3
   Stratégie : Cache-first images/css/js, Network-first HTML
   Offline : redirection automatique vers offline.html
   ============================================================ */

const CACHE_V = 'Miralocks-v6';
const STATIC = [
  '/',
  '/index.html',
  '/gallery.html',
  '/services.html',
  '/rendezvous.html',
  '/contact.html',
  '/about.html',
  '/avis.html',
  '/blog.html',
  '/faq.html',
  '/mentions-legales.html',
  '/confidentialite.html',
  '/offline.html',
  '/avant-apres.html',
  '/css/styles.css',
  '/js/main.js',
  '/js/supabase.js',
  '/assets/logo-transparent.avif',
  '/assets/logo-transparent.webp',
  '/assets/logo-transparent.png',
  '/assets/favicon.ico',
  '/assets/favicon-32.png',
  '/assets/apple-touch-icon.png',
  '/images/locks1.webp',
  '/images/locks2.webp',
  '/images/locks3.webp',
  '/images/locks4.webp',
  '/images/locks5.webp',
  '/images/locks6.webp',
  '/images/locks1.jpg',
  '/images/locks2.jpg',
  '/images/locks3.jpg',
  '/images/locks4.jpg',
  '/images/locks5.jpg',
  '/images/locks6.jpg',
];

// Install : précache assets critiques
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_V)
      .then(c => c.addAll(STATIC))
      .then(() => self.skipWaiting())
  );
});

// Activate : nettoyer anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_V).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch : stratégie adaptée
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Ignorer non-GET et requêtes externes (Supabase, fonts…)
  if (e.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // 1. Navigation (pages HTML) : Détection robuste privilégiée
  if (e.request.mode === 'navigate' || (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html'))) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_V).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => 
          caches.match(e.request)
            .then(cached => cached || caches.match('/offline.html'))
        )
    );
    return;
  }

  // 2. Assets statiques (Cache-first)
  const ext = url.pathname.split('.').pop().toLowerCase();
  const isStaticAsset = ['avif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'svg',
    'css', 'js', 'woff', 'woff2', 'ico'].includes(ext);

  if (isStaticAsset) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_V).then(c => c.put(e.request, clone));
          return res;
        }).catch(() => new Response('', { status: 503 }));
      })
    );
  }
});
