const tabla = document.querySelector("#tablaUsuarios tbody");
let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

// === RENDER USUARIOS ===
const renderUsuarios = () => {
    tabla.innerHTML = "";
    usuarios.forEach(u => {
        // Si el saldo es negativo o NaN, poner en 0
        if (isNaN(u.saldo) || u.saldo < 0) u.saldo = 0;

        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${u.usuario}</td>
            <td id="saldoActual_${u.usuario}">${u.saldo.toFixed(2)}</td>
            <td><input type="number" id="montoASumar_${u.usuario}" placeholder="Monto a sumar"></td>
            <td><button onclick="sumarSaldo('${u.usuario}')">Asignar Saldo</button></td>
            <td><button onclick="eliminarUsuario('${u.usuario}')" style="background:red;color:white;padding:5px 10px;border:none;border-radius:5px;cursor:pointer;">Eliminar</button></td>
        `;
        tabla.appendChild(fila);
    });
};

// Cambiar encabezado de columna
document.querySelector("#tablaUsuarios thead th:nth-child(2)").textContent = "Saldo acumulado";

// === SUMAR O RESTAR SALDO ===
window.sumarSaldo = (usuario) => {
    const montoInput = document.getElementById("montoASumar_" + usuario);
    if (!montoInput) return alert("Usuario no encontrado.");

    let monto = Number(montoInput.value);
    if (isNaN(monto) || monto === 0) return alert("Ingrese un monto válido (puede ser negativo).");

    const index = usuarios.findIndex(u => u.usuario === usuario);
    if (index === -1) return alert("Usuario no encontrado.");

    // === SALDO ACTUAL DEL USUARIO ===
    let saldoActualUsuario = usuarios[index].saldo || 0;

    // === NUEVO SALDO ===
    let nuevoSaldo = saldoActualUsuario + monto;

    // Evitar saldo negativo
    if (nuevoSaldo < 0) nuevoSaldo = 0;

    usuarios[index].saldo = nuevoSaldo;

    // === ACTUALIZAR SALDO GLOBAL DE RULETA ===
    let saldoRuleta = parseFloat(localStorage.getItem("fortunaSpinSaldo")) || 0;
    saldoRuleta += monto;

    // Evitar saldo negativo en la ruleta también
    if (saldoRuleta < 0) saldoRuleta = 0;

    localStorage.setItem("fortunaSpinSaldo", saldoRuleta.toFixed(2));

    // Guardar cambios
    localStorage.setItem("usuarios", JSON.stringify(usuarios));

    // Mostrar mensaje
    alert(`Saldo actualizado. Nuevo saldo de ${usuario}: Bs ${nuevoSaldo.toFixed(2)}`);

    renderUsuarios();
};



// === ELIMINAR USUARIO ===
window.eliminarUsuario = (usuario) => {
    if (!confirm(`¿Desea eliminar al usuario "${usuario}"?`)) return;

    usuarios = usuarios.filter(u => u.usuario !== usuario);
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    renderUsuarios();
};

// === LISTAR COMPROBANTES ===
const lista = document.getElementById("listaComprobantes");
let comprobantes = JSON.parse(localStorage.getItem("comprobantes")) || [];

const renderComprobantes = () => {
    lista.innerHTML = "";

    comprobantes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    comprobantes.forEach(c => {
        const fecha = new Date(c.fecha);
        const fechaTexto = isNaN(fecha.getTime()) ? "Fecha no válida" : fecha.toLocaleString();

        const sec = document.createElement("section");
        sec.style.border = "1px solid #666";
        sec.style.padding = "15px";
        sec.style.margin = "15px";
        sec.style.background = "#1a1a1a";

        // Mostrar el usuario correcto que envió el comprobante
        const usuarioComprobante = c.usuario || "Desconocido";

        sec.innerHTML = `
            <h3>Depósito de: ${usuarioComprobante}</h3>
            <p>Monto reportado: Bs ${c.montoReportado}</p>
            <p>Fecha y hora: ${fechaTexto}</p>
            <img src="${c.imagen}" width="250" style="border:2px solid #fff;border-radius:10px;">
        `;

        lista.appendChild(sec);
    });
};

// === LIMPIAR COMPROBANTES ===
document.getElementById("btnLimpiarComprobantes").onclick = () => {
    if (!confirm("¿Seguro que quieres borrar todos los comprobantes?")) return;

    localStorage.removeItem("comprobantes");
    comprobantes = [];
    renderComprobantes();
    alert("Todos los comprobantes fueron eliminados.");
};

// === INICIALIZAR ===
renderUsuarios();
renderComprobantes();
