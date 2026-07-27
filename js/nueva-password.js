/*=========================================
neXsv
Nueva contraseña
=========================================*/

import authService from "./services/auth.service.js";

document.addEventListener("DOMContentLoaded", () => {

    initPasswordReset();

});

/*=========================================
Actualizar contraseña
=========================================*/

function initPasswordReset() {

    const form = document.getElementById("resetPasswordForm");

    if (!form) return;

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const password = document
            .getElementById("password")
            .value
            .trim();

        const confirmPassword = document
            .getElementById("confirmPassword")
            .value
            .trim();

        const message = document.getElementById("resetMessage");

        message.innerHTML = "";

        if (password.length < 8) {

            message.style.color = "#D32F2F";
            message.innerHTML =
                "La contraseña debe tener al menos 8 caracteres.";

            return;

        }

        if (password !== confirmPassword) {

            message.style.color = "#D32F2F";
            message.innerHTML =
                "Las contraseñas no coinciden.";

            return;

        }

        try {

            await authService.updatePassword(password);

            message.style.color = "#1B8A3B";
            message.innerHTML =
                "✅ Contraseña actualizada correctamente.";

            setTimeout(() => {

                window.location.href = "login-usuario.html";

            }, 1500);

        }

        catch (error) {

            console.error(error);

            message.style.color = "#D32F2F";
            message.innerHTML = error.message;

        }

    });

}
