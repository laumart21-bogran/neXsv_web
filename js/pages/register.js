/**
 * ==========================================================
 * neXsv Platform v2
 * Register Controller
 * ==========================================================
 */

import AuthService from "../auth/auth.service.js";
import ProfileService from "../services/profile.service.js";
import { APP_CONFIG } from "../core/config.js";

const form = document.getElementById("registerForm");

const nombreInput = document.getElementById("nombre");
const apellidoInput = document.getElementById("apellido");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");

const registerButton = document.getElementById("registerButton");
const registerMessage = document.getElementById("registerMessage");

const togglePassword = document.getElementById("togglePassword");
const togglePasswordIcon = document.getElementById("togglePasswordIcon");

const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
const toggleConfirmPasswordIcon = document.getElementById("toggleConfirmPasswordIcon");

/**
 * Mostrar mensaje
 */
function showMessage(message, type = "error") {

    registerMessage.textContent = message;
    registerMessage.className = type;

}

/**
 * Limpiar mensaje
 */
function clearMessage() {

    registerMessage.textContent = "";
    registerMessage.className = "";

}

/**
 * Bloquear interfaz
 */
function setLoading(isLoading) {

    registerButton.disabled = isLoading;

    registerButton.textContent = isLoading
        ? "Creando cuenta..."
        : "Crear cuenta";

}

/**
 * Mostrar / ocultar contraseña
 */
togglePassword.addEventListener("click", () => {

    const isPassword = passwordInput.type === "password";

    passwordInput.type = isPassword
        ? "text"
        : "password";

    togglePasswordIcon.className = isPassword
        ? "fa-regular fa-eye-slash"
        : "fa-regular fa-eye";

});

/**
 * Mostrar / ocultar confirmar contraseña
 */
toggleConfirmPassword.addEventListener("click", () => {

    const isPassword = confirmPasswordInput.type === "password";

    confirmPasswordInput.type = isPassword
        ? "text"
        : "password";

    toggleConfirmPasswordIcon.className = isPassword
        ? "fa-regular fa-eye-slash"
        : "fa-regular fa-eye";

});
