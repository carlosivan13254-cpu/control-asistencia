const DB_NAME = "asistenciaOffline";
const DB_VERSION = 1;
const STORE_NAME = "registrosPendientes";

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

function guardarRegistroOffline(datos){

    return abrirBaseDatos().then(db => {

        return new Promise((resolve, reject) => {

            const transaccion =
                db.transaction(STORE_NAME, "readwrite");

            const almacen =
                transaccion.objectStore(STORE_NAME);

            const registro = {

                id: Date.now() + "-" + Math.random(),

                datos: datos,

                fechaGuardado: new Date().toISOString()

            };

            almacen.add(registro);

            transaccion.oncomplete = function(){

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

function sincronizarRegistrosPendientes(terminar){

    if(sincronizando){
         return;
    }

    sincronizando = true;

    if(!navigator.onLine){
        
        return;
    }

    abrirBaseDatos().then(db => {

        const transaccion =
            db.transaction(STORE_NAME, "readonly");

        const almacen =
            transaccion.objectStore(STORE_NAME);

        const solicitud =
            almacen.getAll();

        solicitud.onsuccess = function(){

            const registros = solicitud.result;

                        function enviarRegistro(indice){

                if(indice >= registros.length){

    sincronizando = false;

    if(terminar){
        terminar();
    }

    return;
}

                const registro = registros[indice];

                fetch("https://script.google.com/macros/s/AKfycbyFgPtnFIwh0e7PiIS7-iTGv3_NfC-nJ-CjbpuV8d6TUg_EfrWEVdWGt8aDvFW_M3qIZg/exec", {
                    method: "POST",
                    body: JSON.stringify(registro.datos)
                })
                .then(response => response.text())
                .then(respuesta => {

                    console.log("Respuesta del servidor:", respuesta);

                    if(
                        respuesta === "Inicio de comida registrado correctamente" ||
                        respuesta === "Comida finalizada correctamente" ||
                        respuesta === "Entrada registrada correctamente" ||
                        respuesta === "Salida registrada correctamente" ||
                        respuesta === "Hora extra iniciada correctamente" ||
                        respuesta === "Hora extra finalizada correctamente" ||
                        respuesta === "Regreso de comida registrado correctamente"
                    ){

                        abrirBaseDatos().then(db => {

                            const transaccion =
                                db.transaction(STORE_NAME, "readwrite");

                            const almacen =
                                transaccion.objectStore(STORE_NAME);

                            almacen.delete(registro.id);

                            transaccion.oncomplete = function(){

                                enviarRegistro(indice + 1);

                            };

                        });

                    }else{

    console.error(
        "❌ El servidor rechazó el registro:",
        respuesta
    );

    abrirBaseDatos().then(db => {

        const transaccion =
            db.transaction(STORE_NAME, "readwrite");

        const almacen =
            transaccion.objectStore(STORE_NAME);

        almacen.delete(registro.id);

        transaccion.oncomplete = function(){

            enviarRegistro(indice + 1);

        };

    });

}

                })
                .catch(error => {

                    console.error("No se pudo sincronizar:", error);

                });

            }

            enviarRegistro(0);

        };

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

