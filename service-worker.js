const CACHE_NAME = "asistencia-v5";

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

self.addEventListener("install", event => {

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ARCHIVOS))
    );

});

self.addEventListener("activate", event => {

    event.waitUntil(
        caches.keys().then(nombres => {

            return Promise.all(
                nombres
                    .filter(nombre => nombre !== CACHE_NAME)
                    .map(nombre => caches.delete(nombre))
            );

        })
    );

});

self.addEventListener("fetch", event => {

    event.respondWith(
        caches.match(event.request)
            .then(respuesta => {

                return respuesta || fetch(event.request);

            })
    );

});

