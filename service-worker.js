const CACHE_NAME = "asistencia-v7";
const DB_NAME = "asistenciaOffline";
const DB_VERSION = 1;
const STORE_NAME = "registrosPendientes";
const ENDPOINT = "https://script.google.com/macros/s/AKfycbyFgPtnFIwh0e7PiIS7-iTGv3_NfC-nJ-CjbpuV8d6TUg_EfrWEVdWGt8aDvFW_M3qIZg/exec";
const RESPUESTAS_OK = new Set([
    "Inicio de comida registrado correctamente",
    "Comida finalizada correctamente",
    "Entrada registrada correctamente",
    "Salida registrada correctamente",
    "Hora extra iniciada correctamente",
    "Hora extra finalizada correctamente",
    "Regreso de comida registrado correctamente"
]);

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

function precargarArchivos(cache, intento = 1) {

    return cache.addAll(
        ARCHIVOS.map(archivo => new Request(archivo, { cache: "reload" }))
    ).catch(error => {

        if(intento >= 3){
            console.error("No se pudo precargar la aplicación para uso offline:", error);
            throw error;
        }

        console.warn(
            "Falló la precarga offline; se reintentará:",
            intento,
            error
        );

        return new Promise(resolve => {
            setTimeout(resolve, 500 * intento);
        }).then(() => precargarArchivos(cache, intento + 1));

    });

}

function abrirBaseDatos() {

    return new Promise((resolve, reject) => {

        const solicitud = indexedDB.open(DB_NAME, DB_VERSION);

        solicitud.onupgradeneeded = function(event){

            const db = event.target.result;

            if(!db.objectStoreNames.contains(STORE_NAME)){
                db.createObjectStore(STORE_NAME, { keyPath: "id" });
            }

        };

        solicitud.onsuccess = function(event){
            resolve(event.target.result);
        };

        solicitud.onerror = function(){
            reject(solicitud.error);
        };

    });

}

function eliminarRegistroPendiente(id) {

    return abrirBaseDatos().then(db => {

        return new Promise((resolve, reject) => {

            const transaccion = db.transaction(STORE_NAME, "readwrite");
            const almacen = transaccion.objectStore(STORE_NAME);

            almacen.delete(id);

            transaccion.oncomplete = function(){
                resolve();
            };

            transaccion.onerror = function(){
                reject(transaccion.error);
            };

        });

    });

}

async function enviarRegistroPendiente(registro) {

    const payload = Object.assign({}, registro.datos || {}, {
        idRegistro: registro.id,
        fechaGuardado: registro.fechaGuardado
    });

    try{

        const respuesta = await fetch(ENDPOINT, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        const textoRespuesta = await respuesta.text();

        if(!respuesta.ok || !RESPUESTAS_OK.has(textoRespuesta.trim())){
            return false;
        }

        await eliminarRegistroPendiente(registro.id);
        return true;

    }catch(error){
        console.error("Service Worker: no se pudo sincronizar:", error);
        return false;
    }

}

async function sincronizarRegistrosPendientesServiceWorker() {

    const db = await abrirBaseDatos();
    const transaccion = db.transaction(STORE_NAME, "readonly");
    const almacen = transaccion.objectStore(STORE_NAME);

    const registros = await new Promise((resolve, reject) => {

        const solicitud = almacen.getAll();

        solicitud.onsuccess = function(){
            resolve(solicitud.result || []);
        };

        solicitud.onerror = function(){
            reject(solicitud.error);
        };

    });

    for(const registro of registros){
        const enviado = await enviarRegistroPendiente(registro);

        if(!enviado){
            return;
        }
    }

}

self.addEventListener("install", event => {

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => precargarArchivos(cache))
            .then(() => self.skipWaiting())
    );

});

self.addEventListener("activate", event => {

    event.waitUntil(
        caches.keys().then(nombres => {

            return Promise.all(
                nombres
                    .filter(nombre =>
                        nombre.startsWith("asistencia-v") && nombre !== CACHE_NAME
                    )
                    .map(nombre => caches.delete(nombre))
            );

        }).then(() => self.clients.claim())
    );

});

self.addEventListener("sync", event => {

    if(event.tag === "asistencia-sync"){
        event.waitUntil(sincronizarRegistrosPendientesServiceWorker());
    }

});

self.addEventListener("fetch", event => {

    if(event.request.method !== "GET"){
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME)
            .then(cache => cache.match(event.request))
            .then(respuesta => {

                return respuesta || fetch(event.request);

            })
    );

});
