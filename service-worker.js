const CACHE_NAME = "asistencia-v8";

const ARCHIVOS = [
    "./",
    "./index.html",
    "./css/style.css",
    "./js/script.js",
    "./js/offline.js",
    "./manifest.json",
    "./img/prueba3.avif",
    "./img/perfil.png"
];

// INSTALACIÓN
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(
                ARCHIVOS.map(archivo =>
                    new Request(archivo, { cache: "reload" })
                )
            ))
            .then(() => self.skipWaiting())
    );
});

// ACTIVACIÓN
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(nombres => Promise.all(
                nombres
                    .filter(nombre =>
                        nombre.startsWith("asistencia-v") &&
                        nombre !== CACHE_NAME
                    )
                    .map(nombre => caches.delete(nombre))
            ))
            .then(() => self.clients.claim())
    );
});

// ACTUALIZACIÓN AUTOMÁTICA
self.addEventListener("fetch", event => {

    if (event.request.method !== "GET") return;

    event.respondWith(
        fetch(event.request)
            .then(respuesta => {

                if (respuesta.ok &&
                    new URL(event.request.url).origin === self.location.origin) {

                    const copia = respuesta.clone();

                    event.waitUntil(
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(event.request, copia))
                    );
                }

                return respuesta;
            })
            .catch(() => caches.match(event.request))
    );

});
