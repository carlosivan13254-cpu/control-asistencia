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

function abrirBaseDatos(){

    return new Promise((resolve, reject) => {

        const solicitud = indexedDB.open(DB_NAME, DB_VERSION);

        solicitud.onupgradeneeded = function(event){

            const db = event.target.result;

            if(!db.objectStoreNames.contains(STORE_NAME)){

                db.createObjectStore(STORE_NAME, {
                    keyPath: "id"
                });

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

function registrarSincronizacionEnSegundoPlano(){

    if(!("serviceWorker" in navigator) || !navigator.serviceWorker) {
        return;
    }

    navigator.serviceWorker.ready
        .then(registro => {

            if("SyncManager" in window && registro.sync){
                registro.sync.register("asistencia-sync")
                    .catch(function(){
                        console.log("Background Sync no disponible para esta sesión.");
                    });
            }

        })
        .catch(function(){
            console.log("Service Worker aún no está listo para sincronización en segundo plano.");
        });

}

function eliminarRegistroPendiente(id){

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

function guardarRegistroOffline(datos){

    return abrirBaseDatos().then(db => {

        return new Promise((resolve, reject) => {

            const transaccion =
                db.transaction(STORE_NAME, "readwrite");

            const almacen =
                transaccion.objectStore(STORE_NAME);

            const idRegistro = Date.now() + "-" + Math.random();
            const registro = {

                id: idRegistro,

                datos: Object.assign({}, datos, {
                    idRegistro: idRegistro,
                    fechaGuardado: new Date().toISOString()
                }),

                fechaGuardado: new Date().toISOString()

            };

            almacen.add(registro);

            transaccion.oncomplete = function(){
                registrarSincronizacionEnSegundoPlano();
                resolve();
            };

            transaccion.onerror = function(){
                reject(transaccion.error);
            };

        });

    });

}

console.log("Sistema offline cargado correctamente");

let sincronizando = false;

async function enviarRegistroPendiente(registro){

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

        console.log("Respuesta del servidor:", textoRespuesta);

        const respuestaValida = respuesta.ok && RESPUESTAS_OK.has(textoRespuesta.trim());

        if(!respuestaValida){
            return false;
        }

        await eliminarRegistroPendiente(registro.id);
        return true;

    }catch(error){

        console.error("No se pudo sincronizar:", error);
        return false;

    }

}

function sincronizarRegistrosPendientes(terminar){

    if(sincronizando || !navigator.onLine){
        if(terminar){
            terminar();
        }
        return;
    }

    sincronizando = true;

    abrirBaseDatos().then(db => {

        const transaccion =
            db.transaction(STORE_NAME, "readonly");

        const almacen =
            transaccion.objectStore(STORE_NAME);

        const solicitud =
            almacen.getAll();

        solicitud.onsuccess = async function(){

            const registros = solicitud.result || [];

            for(const registro of registros){
                const enviado = await enviarRegistroPendiente(registro);

                if(!enviado){
                    sincronizando = false;

                    if(terminar){
                        terminar();
                    }

                    return;
                }
            }

            sincronizando = false;

            if(terminar){
                terminar();
            }

        };

        solicitud.onerror = function(){
            sincronizando = false;
            if(terminar){
                terminar();
            }
        };

    }).catch(function(error){

        console.error("No se pudo abrir la base de datos para sincronizar:", error);
        sincronizando = false;

        if(terminar){
            terminar();
        }

    });

}

window.addEventListener("offline", function(){

    console.log("📴 Conexión perdida.");

});

if(navigator.onLine){

    console.log("🌐 Página cargada con internet. Revisando registros pendientes...");

    sincronizarRegistrosPendientes();

}

window.addEventListener("online", function(){

    console.log("🌐 Conexión recuperada. Sincronizando registros...");

    sincronizarRegistrosPendientes();

});

document.addEventListener("visibilitychange", function(){

    if(!document.hidden && navigator.onLine){
        sincronizarRegistrosPendientes();
    }

});

