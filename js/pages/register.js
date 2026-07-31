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
 * ==========================================================
 * Validar formulario
 * ==========================================================
 */
function validateForm() {

    const nombre = nombreInput.value.trim();
    const apellido = apellidoInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!nombre) {

        showMessage("Ingresa tu nombre.");
        nombreInput.focus();
        return null;

    }

    if (!apellido) {

        showMessage("Ingresa tu apellido.");
        apellidoInput.focus();
        return null;

    }

    if (!email) {

        showMessage("Ingresa tu correo electrónico.");
        emailInput.focus();
        return null;

    }

    if (!password) {

        showMessage("Ingresa una contraseña.");
        passwordInput.focus();
        return null;

    }

    if (password.length < 8) {

        showMessage("La contraseña debe tener al menos 8 caracteres.");
        passwordInput.focus();
        return null;

    }

    if (password !== confirmPassword) {

        showMessage("Las contraseñas no coinciden.");
        confirmPasswordInput.focus();
        return null;

    }

    return {

        nombre,
        apellido,
        email,
        password

    };

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

/**
 * Registro de usuario
 */
form.addEventListener("submit", async (event) => {

    event.preventDefault();

    clearMessage();

    const nombre = nombreInput.value.trim();
    const apellido = apellidoInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validaciones básicas

    if (!nombre || !apellido || !email || !password || !confirmPassword) {

        showMessage("Completa todos los campos.");
        return;

    }

    if (password !== confirmPassword) {

        showMessage("Las contraseñas no coinciden.");
        return;

    }

    if (password.length < 8) {

        showMessage("La contraseña debe tener al menos 8 caracteres.");
        return;

    }

    try {

        setLoading(true);

        // Registro en Supabase
        const authResult = await AuthService.signUp({
            email,
            password
        });

        // Crear perfil
        await ProfileService.createProfile({

            authUserId: authResult.user.id,
            nombre,
            apellido

        });

        showMessage(
            "Cuenta creada correctamente. Revisa tu correo para confirmar tu cuenta.",
            "success"
        );

        form.reset();

        setTimeout(() => {

            window.location.href = APP_CONFIG.routes.login;

        }, 2500);

    } catch (error) {

        console.error(error);

        showMessage(error.message || "No fue posible crear la cuenta.");

    } finally {

        setLoading(false);

    }

});
