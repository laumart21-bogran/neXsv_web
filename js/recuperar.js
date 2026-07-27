/*=========================================
neXsv
Recuperación de contraseña
=========================================*/

import authService from "./services/auth.service.js";

document.addEventListener("DOMContentLoaded", () => {

    initRecovery();

});

/*=========================================
Recuperar contraseña
=========================================*/

function initRecovery() {

    const form = document.getElementById("recoveryForm");

    if (!form) return;

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const correo = document
            .getElementById("email")
            .value
            .trim();

        const message = document.getElementById("recoveryMessage");

        message.innerHTML = "";

        try {

            if (!correo) {

                message.style.color = "#D32F2F";
                message.innerHTML = "Ingresa tu correo electrónico.";
                return;

            }

            await authService.resetPassword(correo);

            message.style.color = "#1B8A3B";
            message.innerHTML =
                "✅ Hemos enviado un enlace para restablecer tu contraseña. Revisa tu correo.";

        }

        catch (error) {

            console.error(error);

            message.style.color = "#D32F2F";
            message.innerHTML = error.message;

        }

    });

}
