// Verifica si el archivo existe antes de usarlo
document.addEventListener("DOMContentLoaded", () => {

    // Si estamos en paso 1
    const form1 = document.getElementById("formPaso1");

    if (form1) {
        form1.addEventListener("submit", (e) => {
            e.preventDefault();

            // Verificar si el usuario ya existe
            const usuarioIngresado = document.getElementById("usuario").value;
            const usuariosGuardados = JSON.parse(localStorage.getItem("usuarios")) || [];

            const existe = usuariosGuardados.some(u => u.usuario === usuarioIngresado);

            if (existe) {
                alert("ESE NOMBRE DE USUARIO YA EXISTE, ELIGE OTRO");
                return; // Detener registro
            }

            // Creamos un objeto con los datos
            const datosPaso1 = {
                pais: document.getElementById("pais").value,
                nombre: document.getElementById("nombre").value,
                apellido: document.getElementById("apellido").value,
                usuario: usuarioIngresado,
                correo: document.getElementById("correo").value,
                password: document.getElementById("password").value,
                celular: document.getElementById("celular").value
            };

            // Guardamos temporalmente antes de finalizar
            localStorage.setItem("registroTemporal", JSON.stringify(datosPaso1));

            // Pasamos al paso 2
            window.location.href = "registro2.html";
        });
    }


    /* 
       REGISTRO PASO 2
       Completa registro y guarda usuario en localStorage
      */

    const form2 = document.getElementById("formPaso2");

    if (form2) {
        form2.addEventListener("submit", (e) => {
            e.preventDefault();

            // Recuperamos datos del paso 1
            const paso1 = JSON.parse(localStorage.getItem("registroTemporal"));

            // Datos del paso 2
            const datosPaso2 = {
                nombre: document.getElementById("nombre2").value,
                apellido: document.getElementById("apellido2").value,
                nacimiento: document.getElementById("nacimiento").value,
                direccion: document.getElementById("direccion").value
            };

            // Unimos los datos en un solo objeto
            const usuarioFinal = { ...paso1, ...datosPaso2, saldo: 0 };

            // Guardar en localStorage
            let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
            usuarios.push(usuarioFinal);

            localStorage.setItem("usuarios", JSON.stringify(usuarios));

            // Borramos el temporal
            localStorage.removeItem("registroTemporal");

            // Redirigimos
            window.location.href = "login.html";
        });
    }

});
