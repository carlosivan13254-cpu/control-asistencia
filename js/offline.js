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
        console.warn("Background Sync omitido: Service Worker no disponible.");
        return;
    }

    navigator.serviceWorker.ready
        .then(registro => {

            if(registro.sync && typeof registro.sync.register === "function"){
                return registro.sync.register("asistencia-sync")
                    .then(function(){
                        console.info("Background Sync registrado: asistencia-sync.");
                    })
                    .catch(function(error){
                        console.error("No se pudo registrar Background Sync:", error.name, error.message);
                    });
            }

            console.info("Background Sync no está disponible en este navegador.");

        })
        .catch(function(error){
            console.error("Service Worker no está listo para Background Sync:", error.name, error.message);
        });

}

function reclamarRegistroPendiente(id){

    return abrirBaseDatos().then(db => {

        return new Promise((resolve, reject) => {

            const transaccion = db.transaction(STORE_NAME, "readwrite");
            const almacen = transaccion.objectStore(STORE_NAME);
            let token = null;

            const solicitud = almacen.get(id);

            solicitud.onsuccess = function(){
                const registro = solicitud.result;

                if(!registro){
                    return;
                }

                const ahora = Date.now();
                const reclamoActual = registro.reclamoSincronizacion;

                if(reclamoActual && reclamoActual.expira > ahora){
                    return;
                }

                token = ahora + "-" + Math.random();
                registro.reclamoSincronizacion = {
                    token: token,
                    expira: ahora + 300000
                };
                almacen.put(registro);
            };

            transaccion.oncomplete = function(){
                resolve(token);
            };

            transaccion.onerror = function(){
                reject(transaccion.error);
            };

        });

    });

}

function eliminarRegistroPendiente(id, token){

    return abrirBaseDatos().then(db => {

        return new Promise((resolve, reject) => {

            const transaccion = db.transaction(STORE_NAME, "readwrite");
            const almacen = transaccion.objectStore(STORE_NAME);
            let eliminado = false;
            const solicitud = almacen.get(id);

            solicitud.onsuccess = function(){
                const registro = solicitud.result;

                if(registro && registro.reclamoSincronizacion &&
                    registro.reclamoSincronizacion.token === token){
                    almacen.delete(id);
                    eliminado = true;
                }
            };

            transaccion.oncomplete = function(){
                resolve(eliminado);
            };

            transaccion.onerror = function(){
                reject(transaccion.error);
            };

        });

    });

}

function liberarRegistroPendiente(id, token){

    return abrirBaseDatos().then(db => {

        return new Promise((resolve, reject) => {

            const transaccion = db.transaction(STORE_NAME, "readwrite");
            const almacen = transaccion.objectStore(STORE_NAME);
            const solicitud = almacen.get(id);

            solicitud.onsuccess = function(){
                const registro = solicitud.result;

                if(registro && registro.reclamoSincronizacion &&
                    registro.reclamoSincronizacion.token === token){
                    delete registro.reclamoSincronizacion;
                    almacen.put(registro);
                }
            };

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

                datos: datos,

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

    let token = null;
    try{

        token = await reclamarRegistroPendiente(registro.id);

        if(!token){
            console.info("Registro ya está en proceso por otro contexto o ya fue procesado:", registro.id);
            return true;
        }

        const respuesta = await fetch(ENDPOINT, {
            method: "POST",
            body: JSON.stringify(registro.datos)
        });

        const textoRespuesta = await respuesta.text();

        console.info("Respuesta de sincronización:", {
            id: registro.id,
            status: respuesta.status,
            respuesta: textoRespuesta
        });

        const respuestaValida = respuesta.ok && RESPUESTAS_OK.has(textoRespuesta.trim());

        if(!respuestaValida){
            console.error("Respuesta no confirmada; registro conservado:", registro.id);
            try{
                await liberarRegistroPendiente(registro.id, token);
            }catch(errorLiberacion){
                console.error("No se pudo liberar el reclamo del registro:", errorLiberacion);
            }
            return false;
        }

        const eliminado = await eliminarRegistroPendiente(registro.id, token);

        if(!eliminado){
            console.error("Confirmación recibida pero el registro pendiente cambió de propietario:", registro.id);
        }

        return eliminado;

    }catch(error){

        console.error("Fallo de red/procesamiento al sincronizar; registro conservado:", {
            id: registro.id,
            name: error.name,
            message: error.message
        });

        if(token){
            try{
                await liberarRegistroPendiente(registro.id, token);
            }catch(errorLiberacion){
                console.error("No se pudo liberar el reclamo del registro:", errorLiberacion);
            }
        }

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

            if(registros.length){
                registrarSincronizacionEnSegundoPlano();
            }

            try{

                for(const registro of registros){
                    const enviado = await enviarRegistroPendiente(registro);

                    if(!enviado){
                        break;
                    }
                }

            }catch(error){
                console.error("Error inesperado durante sincronización local:", error);
            }finally{
                sincronizando = false;

                if(terminar){
                    terminar();
                }
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
