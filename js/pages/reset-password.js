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

    console.log("Contraseña válida:", formData.password);

    showMessage(
        "Validación correcta. El siguiente paso será actualizar la contraseña en Supabase.",
        "success"
    );

}

form.addEventListener("submit", handleReset);

console.log("reset-password.js cargado correctamente");
