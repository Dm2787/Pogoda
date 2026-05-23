const CACHE_NAME = 'weather-station-v1';
const ASSETS = [
  'index.html',
  'manifest.json',
  'https://openweathermap.org/img/wn/01d@2x.png' // Przykładowa ikona na start, reszta doda się dynamicznie
];

// Instalacja i cache'owanie plików instalacyjnych
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Aktywacja i sprzątanie starych wersji cache
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Obsługa zapytań (Strategia hybrydowa)
self.addEventListener('fetch', (e) => {
  // Dla zapytań do API OpenWeatherMap używamy strategii Network First (zawsze świeże dane)
  if (e.request.url.includes('api.openweathermap.org')) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, resClone);
          });
          return response;
        })
        .catch(() => caches.match(e.request)) // W razie braku sieci, zwróć ostatnio zapamiętaną pogodę
    );
  } else {
    // Dla plików lokalnych (HTML, manifest, ikony) - Cache First
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        return cachedResponse || fetch(e.request).then((response) => {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, resClone);
          });
          return response;
        });
      })
    );
  }
});
                      
