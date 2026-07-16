/*=========================================
neXsv
Sistema de Acceso
=========================================*/

document.addEventListener("DOMContentLoaded", () => {

    initPasswordToggle();
    initLogin();

});

/*=========================================
Mostrar / Ocultar contraseña
=========================================*/

function initPasswordToggle() {

    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");
    const toggleIcon = document.getElementById("togglePasswordIcon");

    if (!passwordInput || !togglePassword) return;

    togglePassword.addEventListener("click", () => {

        const visible = passwordInput.type === "text";

        passwordInput.type = visible ? "password" : "text";

        toggleIcon.className = visible
            ? "fa-regular fa-eye"
            : "fa-regular fa-eye-slash";

    });

}

/*=========================================
Login
=========================================*/

function initLogin() {

    const form = document.getElementById("loginForm");

    if (!form) return;

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const correo = document
            .getElementById("email")
            .value
            .trim();

        const password = document
            .getElementById("password")
            .value;

        const message = document.getElementById("loginMessage");

        message.innerHTML = "";

        try {

            const response = await fetch(
                "https://ne-xsv-api.vercel.app/api/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        correo,
                        password
                    })
                }
            );

            const data = await response.json();

            if (data.success) {

                message.style.color = "#1B8A3B";
                message.innerHTML = "✅ Bienvenido.";

                // Guardar sesión
                localStorage.setItem(
                    "nexsvUser",
                    JSON.stringify(data.user)
                );

                console.log("Usuario autenticado:", data.user);

                setTimeout(() => {

                    window.location.href = "../index.html";

                }, 1000);

            } else {

                message.style.color = "#D32F2F";

                message.innerHTML =
                    data.message || "Correo o contraseña incorrectos.";

            }

        } catch (error) {

            console.error(error);

            message.style.color = "#D32F2F";

            message.innerHTML =
                "No fue posible conectar con el servidor.";

        }

    });

}
