const form = document.getElementById("resetPasswordForm");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const message = document.getElementById("resetMessage");
const button = document.getElementById("resetButton");

function showMessage(text, type = "error") {
    message.textContent = text;
    message.className = type;
}

function clearMessage() {
    message.textContent = "";
    message.className = "";
}

function setLoading(isLoading) {
    button.disabled = isLoading;
    button.textContent = isLoading
        ? "Actualizando..."
        : "Actualizar contraseña";
}

console.log("reset-password.js cargado correctamente");
