self.addEventListener("install", (event) => {
  console.log("Service Worker installed");
});

self.addEventListener("fetch", (event) => {
  // Let the browser handle requests normally
});
const CACHE_NAME = "hospital-app-v1";
const urlsToCache = [
"/",
"/index.html",
"/style.css",
"/script.js",
"/login.html",
"/login.js",
"/offline.html",
"/manifest.json",
"/icons/icon-192.png",
"/icons/icon-512.png",
"https://cdn.jsdelivr.net/npm/chart.js",
];

// Install & cache
self.addEventListener("install", (event) => {
event.waitUntil(
  caches.open(CACHE_NAME).then((cache) => {
    return cache.addAll(urlsToCache);
  })
);
});

// Fetch with offline fallback
self.addEventListener("fetch", (event) => {
event.respondWith(
  fetch(event.request).catch(() => {
    return caches.match(event.request).then(response => {
      return response || caches.match('/offline.html');
    });
  })
);
});
