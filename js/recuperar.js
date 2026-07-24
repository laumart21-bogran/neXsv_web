/*=========================================
neXsv
Recuperación de contraseña
=========================================*/

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

            const response = await fetch(
    "https://ne-xsv-api.vercel.app/api/recovery",
    {

                    method: "POST",

                    body: JSON.stringify({

                        action: "requestPasswordRecovery",

                        correo

                    })

                }

            );

            const data = await response.json();

            if (data.success) {

                message.style.color = "#1B8A3B";
                message.innerHTML = "✅ " + data.message;

            } else {

                message.style.color = "#D32F2F";
                message.innerHTML = data.message;

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
