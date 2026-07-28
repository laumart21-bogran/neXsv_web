/* ==========================================
   neXsv
   Acceso de Usuarios
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("loginForm");

    if (!form) return;

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const submitButton =
            form.querySelector("button[type='submit']");

        submitButton.disabled = true;

        const correo =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const message =
            document.getElementById("loginMessage");

        message.innerHTML = "";

        try {

            const data = await loginUser(
                correo,
                password
            );

            if (data.success) {

                message.style.color = "#1B8A3B";
                message.innerHTML = "✅ Bienvenido.";

                setTimeout(() => {

                    window.location.href =
                        "../member-home/index.html";

                }, 800);

            } else {

                submitButton.disabled = false;

                message.style.color = "#D32F2F";

                message.innerHTML =
                    data.message ||
                    "Correo o contraseña incorrectos.";

            }

        } catch (error) {

            console.error(error);

            submitButton.disabled = false;

            message.style.color = "#D32F2F";

            message.innerHTML =
                "No fue posible conectar con Supabase.";

        }

    });

});
