document.getElementById("btnEnviar").onclick = () => {
    const file = archivo.files[0];
    const montoIngresado = document.getElementById("monto").value.trim();

    if (!file) return alert("Selecciona un comprobante.");
    if (montoIngresado === "" || isNaN(montoIngresado) || Number(montoIngresado) <= 0) {
        return alert("Ingresa un monto válido.");
    }

    const reader = new FileReader();

    reader.onload = (e) => {
        let comprobantes = JSON.parse(localStorage.getItem("comprobantes")) || [];
        const usuarioActivo = JSON.parse(localStorage.getItem("sesionActiva"));

        comprobantes.push({
            usuario: usuarioActivo,
            imagen: e.target.result,
            montoReportado: Number(montoIngresado),
            fecha: new Date().toISOString()
        });

        localStorage.setItem("comprobantes", JSON.stringify(comprobantes));

        alert("Comprobante enviado correctamente.");
        window.location.href = "ruleta.html";
    };

    reader.readAsDataURL(file);
};

document.getElementById("btnVolver").onclick = () => {
    window.location.href = "ruleta.html";
};
