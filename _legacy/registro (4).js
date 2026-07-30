/* ==========================================
   neXsv
   Registro de Miembros
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("loginForm");

    if (!form) return;

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const submitButton =
            form.querySelector("button[type='submit']");

        submitButton.disabled = true;

        const nombre =
            document.getElementById("fullName").value.trim();

        const correo =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        const message =
            document.getElementById("loginMessage");

        message.innerHTML = "";

        if (password !== confirmPassword) {

            message.style.color = "#D32F2F";
            message.innerHTML = "Las contraseñas no coinciden.";

            submitButton.disabled = false;

            return;
        }

        try {

            const data = await registerUser(
                nombre,
                correo,
                password
            );

            if (data.success) {

                message.style.color = "#1B8A3B";
                message.innerHTML =
                    "✅ Cuenta creada correctamente.";

                form.reset();

                setTimeout(() => {

                    window.location.href =
                        "login-usuario.html";

                }, 2000);

            } else {

                submitButton.disabled = false;

                message.style.color = "#D32F2F";

                message.innerHTML =
                    data.message ||
                    "Ocurrió un error al crear la cuenta.";

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
