/**
 * ==========================================================
 * neXsv Platform v2
 * Forgot Password Controller
 * ==========================================================
 */

import AuthService from "../auth/auth.service.js";

const form = document.getElementById("recoveryForm");

const emailInput = document.getElementById("email");

const recoveryButton = document.getElementById("recoveryButton");

const recoveryMessage = document.getElementById("recoveryMessage");

/**
 * Mostrar mensaje
 */
function showMessage(message, type = "error") {

    recoveryMessage.textContent = message;
    recoveryMessage.className = type;

}

/**
 * Limpiar mensaje
 */
function clearMessage() {

    recoveryMessage.textContent = "";
    recoveryMessage.className = "";

}

/**
 * Bloquear interfaz
 */
function setLoading(isLoading) {

    recoveryButton.disabled = isLoading;

    recoveryButton.textContent = isLoading
        ? "Enviando..."
        : "Recuperar contraseña";

  /**
 * ==========================================================
 * Validar formulario
 * ==========================================================
 */
function validateForm() {

    const email = emailInput.value.trim().toLowerCase();

    if (!email) {

        showMessage("Ingresa tu correo electrónico.");
        emailInput.focus();

        return null;

    }

    return {
        email
    };

}

}

/**
 * ==========================================================
 * Recuperar contraseña
 * ==========================================================
 */
async function handleRecovery(event) {

    event.preventDefault();

    clearMessage();

    const formData = validateForm();

    if (!formData) {

        return;

    }

    try {

        setLoading(true);

        const result = await AuthService.resetPassword(
            formData.email
        );

        if (result.error) {

            throw result.error;

        }

        showMessage(

            "Si el correo existe, hemos enviado un enlace para restablecer tu contraseña.",

            "success"

        );

        form.reset();

    } catch (error) {

        console.error(error);

        showMessage(

            error.message || "No fue posible enviar el correo."

        );

    } finally {

        setLoading(false);

    }

}

/**
 * ==========================================================
 * Inicialización
 * ==========================================================
 */

form.addEventListener("submit", handleRecovery);
