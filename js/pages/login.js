/**
 * ==========================================================
 * neXsv Platform v2
 * Login Controller
 * ==========================================================
 */

import AuthService from "../auth/auth.service.js";
import { APP_CONFIG } from "../core/config.js";

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");
const togglePassword = document.getElementById("togglePassword");
const togglePasswordIcon = document.getElementById("togglePasswordIcon");

function getReturnUrl() {
    const value = new URLSearchParams(window.location.search).get("return");
    if (!value || value.startsWith("//") || value.includes("\\")) return "";

    try {
        // Normaliza rutas antiguas relativas y solo permite destinos del mismo sitio.
        const destination = new URL(value, window.location.origin);
        if (destination.origin !== window.location.origin) return "";
        return destination.pathname + destination.search + destination.hash;
    } catch {
        return "";
    }
}

function getPostLoginUrl() {
    return getReturnUrl() || APP_CONFIG.routes.dashboard;
}

function syncRegisterLink() {
    const registerLink = document.querySelector("a[href='registro.html']");
    const returnUrl = getReturnUrl();
    if (registerLink && returnUrl) {
        registerLink.href = `registro.html?return=${encodeURIComponent(returnUrl)}`;
    }
}

syncRegisterLink();

function showMessage(message, type = "error") {
    loginMessage.textContent = message;
    loginMessage.className = type;
}

function clearMessage() {
    loginMessage.textContent = "";
    loginMessage.className = "";
}

function setLoading(isLoading) {
    loginButton.disabled = isLoading;
    loginButton.textContent = isLoading ? "Ingresando..." : "Entrar";
}

togglePassword.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    togglePasswordIcon.className = isPassword
        ? "fa-regular fa-eye-slash"
        : "fa-regular fa-eye";
});

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showMessage("Completa todos los campos.");
        return;
    }

    try {
        setLoading(true);

        const { error } = await AuthService.signIn(email, password);

        if (error) {
            switch (error.message) {
                case "Invalid login credentials":
                    showMessage("Correo o contraseña incorrectos.");
                    break;
                case "Email not confirmed":
                    showMessage("Debes confirmar tu correo antes de ingresar.");
                    break;
                default:
                    showMessage(error.message);
            }
            return;
        }

        showMessage("Inicio de sesión exitoso.", "success");
        window.location.href = getPostLoginUrl();

    } catch (error) {
        console.error(error);
        showMessage("Ocurrió un error inesperado.");
    } finally {
        setLoading(false);
    }
});
