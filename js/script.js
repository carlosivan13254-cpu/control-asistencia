if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker.register("./service-worker.js")
            .then(() => {
                console.log("Service Worker registrado correctamente");
            })
            .catch(error => {
                console.error("Error al registrar Service Worker:", error);
            });

    });

}

const fecha = new Date();
const dia = fecha.getDate();
const mes = fecha.getMonth() + 1;
const año = fecha.getFullYear();

const diasSemana = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado"
];

const diaSemana = diasSemana[fecha.getDay()];

let procesandoRegistro = false;

document.querySelector(".fecha").textContent =
    `Fecha: ${diaSemana}, ${dia}/${mes}/${año}`;

function obtenerDispositivo(){

    console.log("Función obtenerDispositivo ejecutada");

    const ua = navigator.userAgent;

    if (/Android/i.test(ua)) return "Android";

    if (/iPhone/i.test(ua)) return "iPhone";

    if (/iPad/i.test(ua)) return "iPad";

    if (/Macintosh/i.test(ua)) return "Mac";

    if (/Windows/i.test(ua)) return "PC - Windows";

    if (/Linux/i.test(ua)) return "Linux";

    return "Desconocido";

}

function bloquearBotones(){

    document.querySelector("#entrada").disabled = true;
    document.querySelector("#comida").disabled = true;
    document.querySelector("#salida").disabled = true;
    document.querySelector("#extra").disabled = true;

}

function desbloquearBotones(){

    document.querySelector("#entrada").disabled = false;
    document.querySelector("#comida").disabled = false;
    document.querySelector("#salida").disabled = false;
    document.querySelector("#extra").disabled = false;

}

function registrar(tipoRegistro){

        if(procesandoRegistro){
        return;
    }

    procesandoRegistro = true;

    bloquearBotones();


    if(navigator.geolocation){

        navigator.geolocation.getCurrentPosition(
            
            function(posicion){

    const hora = new Date();

    const latitud = posicion.coords.latitude;
    const longitud = posicion.coords.longitude;
    let datosEnviar;

                console.log("Intentando enviar a Apps Script");

console.log("URL enviada:");
console.log("https://script.google.com/macros/s/AKfycbyFgPtnFIwh0e7PiIS7-iTGv3_NfC-nJ-CjbpuV8d6TUg_EfrWEVdWGt8aDvFW_M3qIZg/exec");

                datosEnviar = {
    idEmpleado: sessionStorage.getItem("idEmpleado"),
    tipoRegistro: tipoRegistro,
    horaRegistro: hora.toISOString(),
    ubicacion: `https://www.google.com/maps?q=${latitud},${longitud}`,
    dispositivo: obtenerDispositivo()
};


fetch("https://script.google.com/macros/s/AKfycbyFgPtnFIwh0e7PiIS7-iTGv3_NfC-nJ-CjbpuV8d6TUg_EfrWEVdWGt8aDvFW_M3qIZg/exec", {
    method: "POST",
    body: JSON.stringify(datosEnviar)
})
.then(response => response.text())
.then(respuesta => {

    if (respuesta === "No se puede registrar otra entrada en esta jornada.") {

        const mensaje = document.querySelector("#mensaje");

        mensaje.style.display = "block";

        mensaje.innerHTML = `
            <strong>⚠️ Entrada ya registrada</strong><br><br>

            No puedes registrar otra entrada durante la misma jornada laboral.
        `;

        setTimeout(function(){

            mensaje.style.display = "none";

        },5000);

        procesandoRegistro = false;

        desbloquearBotones();

        return;
    }

    if (respuesta === "No se puede registrar otra comida en esta jornada.") {

        const mensaje = document.querySelector("#mensaje");

        mensaje.style.display = "block";

        mensaje.innerHTML = `
         <strong>⚠️ Comida ya registrada</strong><br><br>

        No puedes registrar otra comida durante la misma jornada laboral.
    `;

    document.querySelector("#comida").textContent =
    "🍽️ Iniciar comida";

    enComida = false;

    setTimeout(function(){

        mensaje.style.display = "none";

     },5000);

     procesandoRegistro = false;

     desbloquearBotones();

     return;
}

if (respuesta === "No se encontró la jornada del empleado") {

    const mensaje = document.querySelector("#mensaje");

    mensaje.style.display = "block";

    mensaje.innerHTML = `
        <strong>⚠️ No se puede registrar la comida</strong><br><br>

        La jornada ya fue finalizada.
    `;

    if (accionConfirmada === "Salida a comida") {

        document.querySelector("#comida").textContent =
            "🍽️ Iniciar comida";

        enComida = false;

    }

    setTimeout(function(){

        mensaje.style.display = "none";

    },5000);

    procesandoRegistro = false;

    desbloquearBotones();

    return;
}

if (respuesta === "No se encontró una jornada finalizada") {

    const mensaje = document.querySelector("#mensaje");

    mensaje.style.display = "block";

    mensaje.innerHTML = `
        <strong>⚠️ No se puede registrar la hora extra</strong><br><br>

        Primero debes registrar tu salida de la jornada.
    `;

    if (accionConfirmada === "Inicio de hora extra") {

        document.querySelector("#extra").textContent =
            "⏰ Iniciar hora extra";

        enHoraExtra = false;

    }

    setTimeout(function(){

        mensaje.style.display = "none";

    },5000);

    procesandoRegistro = false;

    desbloquearBotones();

    return;
}

if (respuesta === "No se puede registrar la salida mientras la comida esté activa.") {

    const mensaje = document.querySelector("#mensaje");

    mensaje.style.display = "block";

    mensaje.innerHTML = `
        <strong>⚠️ No se puede registrar la salida</strong><br><br>

        Primero debes regresar de comida.
    `;

    setTimeout(function(){

        mensaje.style.display = "none";

    },5000);

    procesandoRegistro = false;

    desbloquearBotones();

    return;
}

if (respuesta === "No se encontró una jornada activa") {

    const mensaje = document.querySelector("#mensaje");

    mensaje.style.display = "block";

    mensaje.innerHTML = `
        <strong>⚠️ No se puede registrar la salida</strong><br><br>

        Primero debes registrar tu entrada.
    `;

    setTimeout(function(){

        mensaje.style.display = "none";

    },5000);

    procesandoRegistro = false;

    desbloquearBotones();

    return;
}

  if (respuesta === "No se puede registrar otra salida en esta jornada.") {

    const mensaje = document.querySelector("#mensaje");

    mensaje.style.display = "block";

    mensaje.innerHTML = `
        <strong>⚠️ Salida ya registrada</strong><br><br>

        No puedes registrar otra salida durante la misma jornada laboral.
    `;

    setTimeout(function(){

        mensaje.style.display = "none";

    },5000);

    procesandoRegistro = false;

    desbloquearBotones();

    return;
}

if (respuesta === "No se puede registrar otra hora extra en esta jornada.") {

    const mensaje = document.querySelector("#mensaje");

    mensaje.style.display = "block";

    mensaje.innerHTML = `
        <strong>⚠️ Hora extra ya registrada</strong><br><br>

        No puedes registrar otra hora extra durante la misma jornada laboral.
    `;

    document.querySelector("#extra").textContent =
        "⏰ Iniciar hora extra";

    enHoraExtra = false;

    setTimeout(function(){

        mensaje.style.display = "none";

    },5000);

    procesandoRegistro = false;

    desbloquearBotones();

    return;
}

    const mensaje = document.querySelector("#mensaje");

    mensaje.style.display = "block";

    mensaje.innerHTML = `
        <strong>✅ ${tipoRegistro} registrada correctamente</strong><br><br>

        🕒 Hora: ${hora.toLocaleTimeString()}<br><br>

        📍 GPS obtenido correctamente<br><br>

        <a href="https://www.google.com/maps?q=${latitud},${longitud}" target="_blank">
            🗺️ Ver ubicación en Google Maps
        </a>
    `;

    if(tipoRegistro === "Entrada"){

    const registro = document.createElement("p");

    registro.innerHTML =
        `🟢 <strong>Entrada registrada:</strong> ${hora.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        })}`;

    document.querySelector("#misRegistros").appendChild(registro);

}

if(tipoRegistro === "Salida a comida"){

    const registro = document.createElement("p");

    registro.innerHTML =
        `🍽️ <strong>Inicio de comida:</strong> ${hora.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        })}`;

    document.querySelector("#misRegistros").appendChild(registro);

}

if(tipoRegistro === "Regreso de comida"){

    const registro = document.createElement("p");

    registro.innerHTML =
        `🍽️ <strong>Fin de comida:</strong> ${hora.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        })}`;

    document.querySelector("#misRegistros").appendChild(registro);

}

if(tipoRegistro === "Salida"){

    const registro = document.createElement("p");

    registro.innerHTML =
        `🔴 <strong>Salida registrada:</strong> ${hora.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        })}`;

    document.querySelector("#misRegistros").appendChild(registro);

}

if(tipoRegistro === "Inicio de hora extra"){

    const registro = document.createElement("p");

    registro.innerHTML =
        `⏰ <strong>Inicio de hora extra:</strong> ${hora.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        })}`;

    document.querySelector("#misRegistros").appendChild(registro);

}

if(tipoRegistro === "Fin de hora extra"){

    const registro = document.createElement("p");

    registro.innerHTML =
        `⏰ <strong>Fin de hora extra:</strong> ${hora.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        })}`;

    document.querySelector("#misRegistros").appendChild(registro);

}

    setTimeout(function(){

        mensaje.style.display = "none";

    },5000);

        procesandoRegistro = false;

        desbloquearBotones();

        })

        .catch(error => {

    console.error("Error:", error);

    guardarRegistroOffline(datosEnviar)
        .then(() => {
            
            if(tipoRegistro === "salida a comida"){
             enComida = true;
            }

            if(tipoRegistro === "regreso de comida"){
             enComida = false;
            }

            let empleadosOffline =
    JSON.parse(localStorage.getItem("empleadosOffline")) || [];

const empleadoGuardado =
    empleadosOffline.find(
        empleado => empleado.idEmpleado === datosEnviar.idEmpleado
    );

if(empleadoGuardado){

    empleadoGuardado.enComida = enComida;

    localStorage.setItem(
        "empleadosOffline",
        JSON.stringify(empleadosOffline)
    );

}

            procesandoRegistro = false;
            desbloquearBotones();

            alert("📴 Sin conexión. Registro guardado para enviarse después.");

        })
        .catch(errorOffline => {

            console.error("Error guardando offline:", errorOffline);

            procesandoRegistro = false;
            desbloquearBotones();

            alert("❌ No se pudo guardar el registro");

        });

});



            },

            function(){

                procesandoRegistro = false;

                desbloquearBotones();
                
                alert("❌ No se pudo obtener la ubicación");

            }

        );

    }else{

         procesandoRegistro = false;

         desbloquearBotones();

        alert("Este dispositivo no permite obtener ubicación");

    }

}

document.querySelector("#entrada").addEventListener("click", function(){

    accionConfirmada = "Entrada";

    document.querySelector("#textoConfirmacion").textContent =
        "¿Quieres confirmar tu entrada?";

    document.querySelector("#confirmacion").style.display = "block";

});

document.querySelector("#cancelar").addEventListener("click", function(){

    document.querySelector("#confirmacion").style.display = "none";

});

 let accionConfirmada = "";

document.querySelector("#confirmar").addEventListener("click", function(){

    document.querySelector("#confirmacion").style.display = "none";

    if(accionConfirmada === "Salida a comida"){

        document.querySelector("#comida").textContent =
            "🍽️ Regresar de comida";

        enComida = true;

    }

    if(accionConfirmada === "Regreso de comida"){

        document.querySelector("#comida").textContent =
           "🍽️ Iniciar comida";

         enComida = false;

    }

    if(accionConfirmada === "Inicio de hora extra"){

         document.querySelector("#extra").textContent =
         "⏰ Terminar hora extra";

     enHoraExtra = true;

    }

    if(accionConfirmada === "Fin de hora extra"){

         document.querySelector("#extra").textContent =
         "⏰ Iniciar hora extra";

     enHoraExtra = false;

    }

    console.log("accionConfirmada:", accionConfirmada);
    registrar(accionConfirmada);

});

let enComida = false;

document.querySelector("#comida").addEventListener("click", function(){

    if(enComida === false){

        accionConfirmada = "Salida a comida";

        document.querySelector("#textoConfirmacion").textContent =
        "¿Quieres confirmar el inicio de tu comida?";

     document.querySelector("#confirmacion").style.display = "block";

    }else{

        accionConfirmada = "Regreso de comida";

        document.querySelector("#textoConfirmacion").textContent =
        "¿Quieres confirmar tu regreso de comida?";

        document.querySelector("#confirmacion").style.display = "block";

    }

});

document.querySelector("#salida").addEventListener("click", function(){

    accionConfirmada = "Salida";

    document.querySelector("#textoConfirmacion").textContent =
        "¿Quieres confirmar tu salida?";

    document.querySelector("#confirmacion").style.display = "block";

});


let enHoraExtra = false;

document.querySelector("#extra").addEventListener("click", function(){

    if(enHoraExtra === false){

    accionConfirmada = "Inicio de hora extra";

     document.querySelector("#textoConfirmacion").textContent =
        "¿Quieres confirmar el inicio de tu hora extra?";

    document.querySelector("#confirmacion").style.display = "block";

    }else{

     accionConfirmada = "Fin de hora extra";

          document.querySelector("#textoConfirmacion").textContent =
         "¿Quieres confirmar el fin de tu hora extra?";

        document.querySelector("#confirmacion").style.display = "block";

     }

});

document.body.classList.add("login-activo");

document.querySelector("#iniciarSesion").addEventListener("click", function(){

    const idEmpleado = document.querySelector("#idEmpleado").value.trim();

    if(idEmpleado === ""){
        alert("Ingresa tu ID de empleado");
        return;
    }

    const datosLogin = {
        accion: "login",
        idEmpleado: idEmpleado
    };

    if(!navigator.onLine){

         const empleadosOffline =
             JSON.parse(localStorage.getItem("empleadosOffline")) || [];

        const empleadoGuardado =
             empleadosOffline.find(empleado => empleado.idEmpleado === idEmpleado);

    if(empleadoGuardado && empleadoGuardado.idEmpleado === idEmpleado){

        sessionStorage.setItem("idEmpleado", idEmpleado);

        document.querySelector("#extra").style.display = "none";

        enComida = empleadoGuardado.enComida;

        if(enComida){

            document.querySelector("#comida").textContent =
               "🍽️ Regresar de comida";

        }

        enHoraExtra = empleadoGuardado.enHoraExtra;

         if(enHoraExtra){

            document.querySelector("#extra").textContent =
             "⏰ Terminar hora extra";

        }

        document.body.classList.remove("login-activo");
        document.body.classList.add("sistema-activo");

        document.querySelector("#inicioSesion").style.display = "none";

        history.pushState({ pantalla: "asistencia" }, "", location.href);
        
        document.querySelector("#sistemaAsistencia").style.display = "block";

        document.querySelector(".bienvenida").textContent = empleadoGuardado.nombre;

        return;

    }else{

        alert("❌ No se encontró información de este empleado en el dispositivo.");
        return;

    }

}

    fetch("https://script.google.com/macros/s/AKfycbyFgPtnFIwh0e7PiIS7-iTGv3_NfC-nJ-CjbpuV8d6TUg_EfrWEVdWGt8aDvFW_M3qIZg/exec", {
        method: "POST",
        body: JSON.stringify(datosLogin)
    })
    .then(response => response.json())
    .then(data => {

        if(data.valido){

            sessionStorage.setItem("idEmpleado", idEmpleado);

            console.log("data.enComida:", data.enComida);
            console.log("enComida:", enComida);
            
            let empleadosOffline =
    JSON.parse(localStorage.getItem("empleadosOffline")) || [];

const empleadoExistente =
    empleadosOffline.find(empleado => empleado.idEmpleado === idEmpleado);

if(empleadoExistente){

    empleadoExistente.nombre = data.nombre;
    empleadoExistente.enComida = data.enComida;
    empleadoExistente.enHoraExtra = data.enHoraExtra;

}else{

    empleadosOffline.push({
        idEmpleado: idEmpleado,
        nombre: data.nombre,
        enComida: data.enComida,
        enHoraExtra: data.enHoraExtra
    });

}

localStorage.setItem(
    "empleadosOffline",
    JSON.stringify(empleadosOffline)
);

console.log("Guardado offline:", empleadosOffline);


            if(data.enComida === true){

    enComida = true;

    document.querySelector("#comida").textContent =
        "🍽️ Regresar de comida";

}

if(data.enHoraExtra === true){

    enHoraExtra = true;

    document.querySelector("#extra").textContent =
        "⏰ Terminar hora extra";

}
            
            document.body.classList.remove("login-activo");
            document.body.classList.add("sistema-activo");

            document.querySelector("#inicioSesion").style.display = "none";

            history.pushState({ pantalla: "asistencia" }, "", location.href);
            
            document.querySelector("#sistemaAsistencia").style.display = "block";

            document.querySelector(".bienvenida").textContent = data.nombre;


                const misRegistros = document.querySelector("#misRegistros");

misRegistros.innerHTML = `
    <h2>Mis registros</h2>
`;

if(data.registros && data.registros.entrada === true){

    const registro = document.createElement("p");

    const horaEntrada = new Date(data.registros.horaEntrada);

    registro.innerHTML =
        `🟢 <strong>Entrada registrada:</strong> ${horaEntrada.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        })}`;

    misRegistros.appendChild(registro);

}

if(data.registros && data.registros.inicioComida !== ""){

    const registro = document.createElement("p");

    const horaInicioComida =
        new Date(data.registros.inicioComida);

    registro.innerHTML =
        `🍽️ <strong>Inicio de comida:</strong> ${horaInicioComida.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        })}`;

    misRegistros.appendChild(registro);

}

if(data.registros && data.registros.finComida !== ""){

    const registro = document.createElement("p");

    const horaFinComida =
        new Date(data.registros.finComida);

    registro.innerHTML =
        `🍽️ <strong>Fin de comida:</strong> ${horaFinComida.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        })}`;

    misRegistros.appendChild(registro);

}

if(data.registros && data.registros.salida !== ""){

    const registro = document.createElement("p");

    const horaSalida =
        new Date(data.registros.salida);

    registro.innerHTML =
        `🔴 <strong>Salida registrada:</strong> ${horaSalida.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        })}`;

    misRegistros.appendChild(registro);

}

if(data.registros && data.registros.inicioExtra !== ""){

    const registro = document.createElement("p");

    const horaInicioExtra =
        new Date(data.registros.inicioExtra);

    registro.innerHTML =
        `⏰ <strong>Inicio de hora extra:</strong> ${horaInicioExtra.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        })}`;

    misRegistros.appendChild(registro);

}

if(data.registros && data.registros.finExtra !== ""){

    const registro = document.createElement("p");

    const horaFinExtra =
        new Date(data.registros.finExtra);

    registro.innerHTML =
        `⏰ <strong>Fin de hora extra:</strong> ${horaFinExtra.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        })}`;

    misRegistros.appendChild(registro);

}

        }else{

    if(data.mensaje){
        alert("❌ " + data.mensaje);
    }else{
        alert("❌ ID de empleado no encontrado");
    }

}

    })
    .catch(error => {

        console.error("Error:", error);

        alert("❌ No se pudo conectar con el sistema");

    });

});



function volverAlLogin() {
    document.querySelector("#sistemaAsistencia").style.display = "none";
    document.querySelector("#inicioSesion").style.display = "block";

    document.body.classList.remove("sistema-activo");
    document.body.classList.add("login-activo");

    sessionStorage.removeItem("idEmpleado");
    document.querySelector("#idEmpleado").value = "";
    document.querySelector("#confirmacion").style.display = "none";
}

// Detectar cuando el usuario pulsa la flecha de atrás
window.addEventListener("popstate", function () {
    const sistema = document.querySelector("#sistemaAsistencia");

    if (sistema.style.display !== "none") {
        volverAlLogin();
    }
});



