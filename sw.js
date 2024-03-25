const staticCacheName = "site-static-v2";
const dynamicCacheName = "site-dynamic-v1";

const assets = [
  "/",
  "/index.html",
  "/js/app.js",
  "/js/ui.js",
  "/js/materialize.min.js",
  "/css/styles.css",
  "/css/materialize.min.css",
  "/img/dish.png",
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "/pages/fallback.html",
];

// cach size limit
const limitCacheSize = (name, size) => {
  caches.open(name).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > size) {
        cache.delete(keys[0]).then(limitCacheSize(name, size));
      }
    });
  });
};

// install service worker, self is service worker itself
self.addEventListener("install", (evt) => {
  // console.log("service worker installed");
  evt.waitUntil(
    caches
      .open(staticCacheName)
      .then((cache) => {
        cache.addAll(assets);
        console.log("caching shell assets");
      })
      .catch((error) => {
        console.error("Cache failed:", error);
      })
  );
});

// activate serice worker
self.addEventListener("activate", (evt) => {
  // console.log("service worker activated");
  caches.keys().then((keys) => {
    return Promise.all(
      keys
        .filter((key) => key !== staticCacheName && key !== dynamicCacheName)
        .map((key) => caches.delete(key))
    );
  });
});

//fetch event
self.addEventListener("fetch", (evt) => {
  // console.log("fetch event", evt);
  evt.respondWith(
    caches
      .match(evt.request)
      .then((cacheRes) => {
        return (
          cacheRes ||
          fetch(evt.request).then((fetchRes) => {
            return caches.open(dynamicCacheName).then((cache) => {
              cache.put(evt.request.url, fetchRes.clone());
              limitCacheSize(dynamicCacheName, 2);
              return fetchRes;
            });
          })
        );
      })
      .catch(() => {
        if (evt.request.url.indexOf(".html") > -1) {
          return caches.match("/pages/fallback.html");
        }
      })
  );
});
