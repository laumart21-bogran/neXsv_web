import AuthService from "../services/auth.service.js";

const form = document.getElementById("resetPasswordForm");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const message = document.getElementById("resetMessage");
const button = document.getElementById("resetButton");

/**
 * Mostrar mensajes
 */
function showMessage(text, type = "error") {
    message.textContent = text;
    message.className = type;
}

/**
 * Limpiar mensajes
 */
function clearMessage() {
    message.textContent = "";
    message.className = "";
}

/**
 * Estado del botón
 */
function setLoading(isLoading) {
    button.disabled = isLoading;
    button.textContent = isLoading
        ? "Actualizando..."
        : "Actualizar contraseña";
}

/**
 * Validación del formulario
 */
function validateForm() {

    clearMessage();

    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (!password || !confirmPassword) {

        showMessage("Completa todos los campos.");
        return null;

    }

    if (password.length < 8) {

        showMessage("La contraseña debe tener al menos 8 caracteres.");
        return null;

    }

    if (password !== confirmPassword) {

        showMessage("Las contraseñas no coinciden.");
        return null;

    }

    return {
        password
    };

}

/**
 * Envío del formulario
 */
async function handleReset(event) {

    event.preventDefault();

    const formData = validateForm();

    if (!formData) {
        return;
    }

    try {

    setLoading(true);

    const { error } = await AuthService.updatePassword(
        formData.password
    );

    if (error) {
        throw error;
    }

    showMessage(
        "Contraseña actualizada correctamente. Serás redirigido al inicio de sesión.",
        "success"
    );

    setTimeout(() => {

        window.location.href = "login-usuario.html";

    }, 2000);

} catch (error) {

    console.error(error);

    showMessage(
        error.message || "No fue posible actualizar la contraseña."
    );

} finally {

    setLoading(false);

}

}

form.addEventListener("submit", handleReset);

console.log("reset-password.js cargado correctamente");
