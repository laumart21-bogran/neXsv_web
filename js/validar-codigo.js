/*=========================================
neXsv
Validación de código de recuperación
=========================================*/

document.addEventListener("DOMContentLoaded", () => {

    initCodeValidation();

});


/*=========================================
Validar código
=========================================*/

function initCodeValidation() {

    const form = document.getElementById("codeForm");

    if (!form) return;

    const correo = sessionStorage.getItem("recoveryEmail");

    if (!correo) {

        window.location.href = "recuperar.html";
        return;

    }

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const codigo = document
            .getElementById("code")
            .value
            .trim();

        const message =
            document.getElementById("codeMessage");

        message.innerHTML = "";

        if (!codigo) {

            message.style.color = "#D32F2F";
            message.innerHTML =
                "Ingresa el código recibido.";

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

                        action: "validateRecoveryCode",
                        correo,
                        codigo

                    })

                }

            );

            const data = await response.json();

            if (data.success) {

                message.style.color = "#1B8A3B";
                message.innerHTML =
                    "✅ Código correcto.";

                sessionStorage.setItem(
                    "recoveryCode",
                    codigo
                );

                setTimeout(() => {

                    window.location.href =
                        "nueva-password.html";

                }, 1000);

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
