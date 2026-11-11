const CACHE_NAME = "asistencia-v10";

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
        caches.keys().then(nombres => {

            return Promise.all(
                nombres
                    .filter(nombre =>
                        nombre.startsWith("asistencia-v") &&
                        nombre !== CACHE_NAME
                    )
                    .map(nombre => caches.delete(nombre))
            );

        }).then(() => self.clients.claim())
    );

});

// NETWORK FIRST
self.addEventListener("fetch", event => {

    const solicitud = event.request;
    const url = new URL(solicitud.url);

    // No intervenir en solicitudes POST
    if(solicitud.method !== "GET"){
        return;
    }

    // No intervenir en solicitudes externas
    if(url.origin !== self.location.origin){
        return;
    }

    event.respondWith(

        fetch(solicitud)

            .then(respuesta => {

                if(respuesta.ok){

                    const copia = respuesta.clone();

                    event.waitUntil(
                        caches.open(CACHE_NAME)
                            .then(cache =>
                                cache.put(solicitud, copia)
                            )
                    );

                }

                return respuesta;

            })

            .catch(() => {

                return caches.open(CACHE_NAME)
                    .then(cache => cache.match(solicitud))
                    .then(respuesta => {

                        return respuesta ||
                            Response.error();

                    });

            })

    );

});
