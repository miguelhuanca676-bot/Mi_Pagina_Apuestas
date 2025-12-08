document.addEventListener("DOMContentLoaded", () => {
    const usuario = JSON.parse(localStorage.getItem("sesionActiva")) || "Invitado";

    let saldoInicial = parseFloat(localStorage.getItem("fortunaSpinSaldo"));
    if (isNaN(saldoInicial) || saldoInicial < 0) saldoInicial = 0;
    localStorage.setItem("fortunaSpinSaldo", saldoInicial.toFixed(2));

    document.getElementById("mostrarUsuario").innerHTML = `🎰 Usuario: <b>${usuario}</b>`;
    document.getElementById("mostrarSaldo").innerHTML = `💰 Saldo Inicial: <b>Bs ${saldoInicial.toFixed(2)}</b>`;

    actualizarUI();
    dibujarRuleta();
    actualizarHistorialUsuario();
});

// ====== VARIABLES ======
const canvas = document.getElementById("ruletaCanvas");
const ctx = canvas?.getContext("2d");

const btnApostar = document.getElementById("btnApostar");
const montoInput = document.getElementById("montoInput");
const numeroInput = document.getElementById("numeroInput");
const colorInput = document.getElementById("colorInput");
const parImparInput = document.getElementById("parImparInput");
const saldoText = document.getElementById("saldoText");
const historialLista = document.getElementById("historialLista");
const resultadoMensaje = document.getElementById("resultadoMensaje");
const historialUsuarioList = document.getElementById("historialUsuario");

const centro = 250;
const radio = 250;
const totalSectores = 37;
const anguloSector = (2 * Math.PI) / totalSectores;

let anguloActual = 0;
let velocidad = 0;
let ballAngle = 0;
let ballVelocity = 0;

let girando = false;
let frenando = false;
let targetRotation = 0;
let numeroGanadorFinal = null;

let saldo = parseFloat(localStorage.getItem("fortunaSpinSaldo")) || 0;
let nombreUsuarioActivo = JSON.parse(localStorage.getItem("sesionActiva")) || "Invitado";

let apuestaActiva = null;
let animationFrameId = null;
let spinTimeoutId = null;
let giroMaxTimeoutId = null;

// ====== HISTORIAL USUARIO ======
let historialUsuario = JSON.parse(localStorage.getItem(`historial_${nombreUsuarioActivo}`)) || [];

function actualizarHistorialUsuario() {
    if (!historialUsuarioList) return;
    historialUsuarioList.innerHTML = "";
    historialUsuario.slice(-10).reverse().forEach(h => {
        const li = document.createElement("li");
        li.textContent = `${h.tipo.toUpperCase()} (${h.valor}) - Bs ${h.monto.toFixed(2)} - ${h.resultado}`;
        li.style.background = h.resultado === "GANASTE" ? "#05b887" : "#f30317";
        li.style.color = "#fff";
        li.style.padding = "3px 6px";
        li.style.margin = "2px 0";
        li.style.borderRadius = "4px";
        historialUsuarioList.appendChild(li);
    });
}

// ====== INFO NUMEROS ======
const numerosInfo = [
  { num: 0, color: "G" }, { num: 32, color: "R" }, { num: 15, color: "B" },
  { num: 19, color: "R" }, { num: 4, color: "B" }, { num: 21, color: "R" },
  { num: 2, color: "B" }, { num: 25, color: "R" }, { num: 17, color: "B" },
  { num: 34, color: "R" }, { num: 6, color: "B" }, { num: 27, color: "R" },
  { num: 13, color: "B" }, { num: 36, color: "R" }, { num: 11, color: "B" },
  { num: 30, color: "R" }, { num: 8, color: "B" }, { num: 23, color: "R" },
  { num: 10, color: "B" }, { num: 5, color: "R" }, { num: 24, color: "B" },
  { num: 16, color: "R" }, { num: 33, color: "B" }, { num: 1, color: "R" },
  { num: 20, color: "B" }, { num: 14, color: "R" }, { num: 31, color: "B" },
  { num: 9, color: "R" }, { num: 22, color: "B" }, { num: 18, color: "R" },
  { num: 29, color: "B" }, { num: 7, color: "R" }, { num: 28, color: "B" },
  { num: 12, color: "R" }, { num: 35, color: "B" }, { num: 3, color: "R" },
  { num: 26, color: "B" }
];

// ====== FUNCIONES ======

// --- DIBUJAR RULETA ---
function dibujarRuleta() {
    if (!ctx) return;
    ctx.clearRect(0, 0, 500, 500);

    ctx.save();
    ctx.translate(centro, centro);
    ctx.rotate(anguloActual);

    for (let i = 0; i < totalSectores; i++) {
        const info = numerosInfo[i];
        const color = info.color === "G" ? "green" : info.color === "R" ? "#e63946" : "black";

        ctx.beginPath();
        ctx.fillStyle = color;
        const start = i * anguloSector;
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radio * 0.95, start, start + anguloSector);
        ctx.fill();

        if (numeroGanadorFinal !== null && info.num === numeroGanadorFinal && !girando) {
            ctx.strokeStyle = "#ffd700";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(0, 0, radio * 0.95, start, start + anguloSector);
            ctx.stroke();
        }

        ctx.save();
        ctx.rotate(start + anguloSector / 2);
        ctx.fillStyle = "white";
        ctx.font = "bold 18px Arial";
        ctx.fillText(info.num, radio * 0.7, 5);
        ctx.restore();
    }
    ctx.restore();

    ctx.beginPath();
    ctx.fillStyle = "#1e1e1e";
    ctx.arc(centro, centro, radio * 0.15, 0, 2 * Math.PI);
    ctx.fill();

    const ballR = Math.max(6, radio * 0.03);
    const pos = radio * 0.90;
    const ballX = centro + Math.cos(ballAngle) * pos;
    const ballY = centro + Math.sin(ballAngle) * pos;
    ctx.beginPath();
    ctx.fillStyle = "#ffc107";
    ctx.arc(ballX, ballY, ballR, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = "#ffcc00";
    ctx.moveTo(centro, 0);
    ctx.lineTo(centro + 15, 25);
    ctx.lineTo(centro - 15, 25);
    ctx.fill();
}

// --- OBTENER NUMERO GANADOR ---
async function obtenerNumeroGanador() {
    try {
        const resp = await fetch("https://fortunaapi.online/generar_numero.php");
        const j = await resp.json();
        if (j && typeof j.numero === "number") return j.numero;
    } catch (e) {}
    return Math.floor(Math.random() * 37);
}

// --- INICIAR GIRO ---
async function iniciarGiro() {
    if (girando || !apuestaActiva || apuestaActiva.monto > saldo) return;

    saldo -= apuestaActiva.monto;
    if (saldo < 0) saldo = 0;
    actualizarUI();

    girando = true;
    frenando = false;
    btnApostar.disabled = true;
    resultadoMensaje.textContent = "Girando...";
    resultadoMensaje.style.background = "red";

    velocidad = 0.4;
    ballVelocity = -0.8;
    ballAngle = Math.random() * Math.PI * 2;
    anguloActual = Math.random() * Math.PI * 2;

    animar();

    numeroGanadorFinal = await obtenerNumeroGanador();

    spinTimeoutId = setTimeout(() => { frenando = true; calcularTarget(); }, 8000 + Math.random() * 4000);
    giroMaxTimeoutId = setTimeout(() => { if (girando && !frenando) { frenando = true; calcularTarget(); } }, 15000);
}

// --- CALCULAR ROTACION OBJETIVO ---
function calcularTarget() {
    if (numeroGanadorFinal === null) return;
    const idx = numerosInfo.findIndex(n => n.num === numeroGanadorFinal);
    const sectorCenter = idx * anguloSector + anguloSector / 2;
    const objetivo = -Math.PI / 2;
    let diff = objetivo - sectorCenter;
    while (diff < 0) diff += Math.PI * 2;
    targetRotation = anguloActual + diff + (6 + Math.floor(Math.random() * 3)) * 2 * Math.PI;
}

// --- ANIMACION ---
function animar() {
    if (!girando) return;

    if (!frenando) velocidad *= 0.998;
    else {
        const diff = targetRotation - anguloActual;
        if (Math.abs(diff) > 0.001) { velocidad += diff * 0.001; velocidad *= 0.985; }
        else { velocidad = 0; anguloActual = targetRotation; }
    }

    anguloActual += velocidad;
    ballVelocity *= 0.985;
    ballAngle += ballVelocity;

    dibujarRuleta();
    animationFrameId = requestAnimationFrame(animar);

    if (frenando && Math.abs(velocidad) < 0.0005 && Math.abs(ballVelocity) < 0.001) finalizarGiro();
}

// --- FINALIZAR GIRO ---
function finalizarGiro() {
    cancelAnimationFrame(animationFrameId);
    clearTimeout(spinTimeoutId);
    clearTimeout(giroMaxTimeoutId);

    girando = false;
    frenando = false;
    btnApostar.disabled = false;

    dibujarRuleta();
    mostrarResultado();
    actualizarHistorial(numeroGanadorFinal);

    apuestaActiva = null;
}

// --- MOSTRAR RESULTADO ---
function mostrarResultado() {
    const ganador = numeroGanadorFinal;
    const info = numerosInfo.find(n => n.num === ganador);
    const colorRes = info.color === "G" ? "Verde" : info.color === "R" ? "Rojo" : "Negro";

    let ganancia = 0;
    const { monto, tipo, valor } = apuestaActiva || {};

    if (tipo && monto) {
        if (tipo === "numero" && valor === ganador) ganancia = monto * 36;
        else if (tipo === "color") {
            if (valor === "rojo" && info.color === "R") ganancia = monto * 2;
            if (valor === "negro" && info.color === "B") ganancia = monto * 2;
        } else if (tipo === "parimpar") {
            if (valor === "par" && ganador !== 0 && ganador % 2 === 0) ganancia = monto * 2;
            if (valor === "impar" && ganador % 2 === 1) ganancia = monto * 2;
        }
    }

    let texto;
    if (ganancia > 0) {
        saldo += ganancia;
        texto = `¡GANASTE! SaliÓ ${ganador} (${colorRes}). Ganancia neta: Bs ${(ganancia - monto).toFixed(2)}`;
        resultadoMensaje.style.background = "#05b887"; // verde
    } else {
        texto = `PERDISTE. SaliÓ ${ganador} (${colorRes}). Perdiste Bs ${monto?.toFixed(2) || 0}.`;
        resultadoMensaje.style.background = "#f30317"; // rojo
    }

    if (saldo < 0) saldo = 0;
    localStorage.setItem("fortunaSpinSaldo", saldo.toFixed(2));
    actualizarUI();

    // === GUARDAR EN HISTORIAL USUARIO ===
    historialUsuario.push({
        tipo: apuestaActiva.tipo,
        valor: apuestaActiva.valor,
        monto: apuestaActiva.monto,
        resultado: ganancia > 0 ? "GANASTE" : "PERDISTE",
        numero: ganador
    });
    localStorage.setItem(`historial_${nombreUsuarioActivo}`, JSON.stringify(historialUsuario));
    actualizarHistorialUsuario();

    resultadoMensaje.textContent = `SALIO ${ganador}`;
}


// --- PROCESAR APUESTA ---
function procesarApuesta() {
    if (girando) return;

    const monto = parseFloat(montoInput.value);
    if (isNaN(monto) || monto <= 0) { alert("Monto inválido"); return; }

    let tipo = null, valor = null, count = 0;
    const num = numeroInput.value.trim();
    const col = colorInput.value.trim().toLowerCase();
    const parImpar = parImparInput.value.trim().toLowerCase();

    if (num !== "") { const n = parseInt(num); if (n>=0 && n<=36){tipo="numero";valor=n;count++;} }
    if (col==="rojo"||col==="negro"){tipo="color";valor=col;count++; }
    if (parImpar==="par"||parImpar==="impar"){tipo="parimpar";valor=parImpar;count++; }

    if(count!==1){alert("Ingrese solo una apuesta."); return;}
    if(monto>saldo){alert("No tienes suficiente saldo."); return;}

    apuestaActiva = {monto, tipo, valor};
    iniciarGiro();
}

// --- ACTUALIZAR UI ---
function actualizarUI(){
    saldoText.textContent = `Bs ${saldo.toFixed(2)}`;
    localStorage.setItem("fortunaSpinSaldo", saldo.toFixed(2));
}

// --- ACTUALIZAR HISTORIAL RULETA ---
function actualizarHistorial(num){
    if(!historialLista) return;
    const li = document.createElement("li");
    const info = numerosInfo.find(n => n.num===num);
    li.textContent = num;
    li.style.background = info.color==="R"?"#e63946":info.color==="B"?"black":"green";
    li.style.color = info.color==="B"?"white":"black";
    li.style.padding = "2px 4px";
    li.style.margin = "2px";
    historialLista.prepend(li);
    if(historialLista.children.length>10) historialLista.removeChild(historialLista.lastChild);
}
// === CERRAR SESIÓN ===
function cerrarSesion() {
    // Confirmación opcional, puedes quitarla si quieres salida instantánea
    if (!confirm("¿Seguro que deseas salir de la página?")) return;

    // Eliminar todos los datos de sesión
    localStorage.removeItem("sesionActiva");
    localStorage.removeItem("fortunaSpinSaldo");

    // Redirigir al inicio
    window.location.href = "index.html";
}

// MENU HAMBURGUESA
const hamburger = document.getElementById("hamburger");
const menuLinks = document.getElementById("menuLinks");

hamburger.addEventListener("click", () => {
    menuLinks.classList.toggle("show");
});

// FUNCIONALIDAD DEL BOTON SALIR
document.getElementById("salirBtn").addEventListener("click", () => {
    localStorage.removeItem("sesionActiva");
    window.location.href = "index.html";
});


// ===== EVENTOS =====
btnApostar?.addEventListener("click", procesarApuesta);
