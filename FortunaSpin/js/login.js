document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("formLogin");
    const btnUsuario = document.getElementById("btnUsuario");
    const btnAdmin = document.getElementById("btnAdmin");

    // Mostrar formulario al elegir tipo
    btnUsuario.onclick = () => {
        form.style.display = "block";
        form.dataset.tipo = "usuario";
    };

    btnAdmin.onclick = () => {
        form.style.display = "block";
        form.dataset.tipo = "admin";
    };

    // --- PROCESAR LOGIN ---
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const user = usuarioInput.value.trim();
        const pass = passInput.value.trim();

        // === LOGIN ADMIN ===
        if (form.dataset.tipo === "admin") {

            if (user === "admin" && pass === "1234") {
                localStorage.setItem("sesionActiva", JSON.stringify("admin"));
                alert("Bienvenido ADMIN.");
                return window.location.href = "admin.html";
            }

            return alert("Credenciales de administrador incorrectas.");
        }

        // === LOGIN USUARIO NORMAL ===
        const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
        const u = usuarios.find(x => x.usuario === user && x.password === pass);

        if (!u) return alert("Usuario o contraseña incorrectos.");

        localStorage.setItem("sesionActiva", JSON.stringify(u.usuario));
        localStorage.setItem("fortunaSpinSaldo", u.saldo.toFixed(2));

        alert("Bienvenido " + u.usuario);
        window.location.href = "ruleta.html";
    });
});
