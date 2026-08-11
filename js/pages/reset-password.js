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

function setLoading(isLoading) {
    ...
}

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

    return { password };

}

console.log("reset-password.js cargado correctamente");

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
