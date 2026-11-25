const CACHE_NAME = "convo-talk-v3";
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/socket.io")) {
    return;
  }

  if (url.pathname.startsWith("/api")) {
    return;
  }

  // Navigations are never cached. Serving a stored shell at an arbitrary URL
  // is a soft 404 for humans, keeps stale metadata alive after a deploy and
  // grows storage without bound for chat and profile URLs. Prerendered pages
  // are static files behind a CDN, so the network is the right source here.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .match(OFFLINE_URL)
          .then(
            (cached) =>
              cached ||
              new Response("You are offline.", {
                status: 503,
                headers: { "Content-Type": "text/plain; charset=utf-8" },
              }),
          ),
      ),
    );
    return;
  }

  // Hashed build output is immutable: serve it from cache when present.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok && url.pathname.includes("/assets/")) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: "Nova mensagem",
      body: event.data.text(),
    };
  }

  const title = payload.title || "ConvoTalk";
  const options = {
    body: payload.body || "Você tem uma nova mensagem.",
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/icon-192.png",
    tag: payload.tag || "convotalk-message",
    renotify: true,
    data: payload.data || { url: "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const targetPath = new URL(
          targetUrl,
          self.location.origin,
        ).pathname;

        // Prioriza um client que já está exatamente na URL de destino
        for (const client of clientList) {
          if (
            client.url &&
            new URL(client.url, self.location.origin).pathname === targetPath &&
            "focus" in client
          ) {
            return client.focus();
          }
        }

        // Navega a primeira window disponível até a URL de destino
        const focusable = clientList.filter(
          (client) => client.url && "focus" in client,
        );
        if (focusable.length > 0) {
          const client = focusable[0];
          if ("navigate" in client && typeof client.navigate === "function") {
            return client
              .navigate(targetUrl)
              .catch(() => {})
              .then(() => client.focus());
          }
          return client.focus();
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      }),
  );
});
