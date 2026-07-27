/*=========================================
neXsv
Nueva contraseña
=========================================*/

document.addEventListener("DOMContentLoaded", () => {

    initPasswordReset();

});


/*=========================================
Actualizar contraseña
=========================================*/

function initPasswordReset() {

    const form = document.getElementById("resetPasswordForm");

    if (!form) return;

    const correo = sessionStorage.getItem("recoveryEmail");
    const codigo = sessionStorage.getItem("recoveryCode");

    if (!correo || !codigo) {

        window.location.href = "recuperar.html";
        return;

    }

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const password =
            document.getElementById("password")
            .value
            .trim();

        const confirmPassword =
            document.getElementById("confirmPassword")
            .value
            .trim();

        const message =
            document.getElementById("resetMessage");

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

            const response = await fetch(

                "https://ne-xsv-api.vercel.app/api/request-recovery",

                {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        action: "resetPassword",
                        correo,
                        codigo,
                        password

                    })

                }

            );

            const data = await response.json();

            if (data.success) {

                message.style.color = "#1B8A3B";
                message.innerHTML =
                    "✅ Contraseña actualizada correctamente.";

                sessionStorage.removeItem("recoveryEmail");
                sessionStorage.removeItem("recoveryCode");

                setTimeout(() => {

                    window.location.href =
                        "login-usuario.html";

                }, 1500);

            }

            else {

                message.style.color = "#D32F2F";
                message.innerHTML =
                    data.message;

            }

        }

        catch (error) {

            console.error(error);

            message.style.color = "#D32F2F";
            message.innerHTML =
                "No fue posible conectar con el servidor.";

        }

    });

}
