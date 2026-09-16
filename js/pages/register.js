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

function getReturnUrl() {
    const value = new URLSearchParams(window.location.search).get("return");
    if (!value) return "";
    if (/^https?:\/\//i.test(value) || value.startsWith("//")) return "";
    return value;
}

function showMessage(message, type = "error") {
    registerMessage.textContent = message;
    registerMessage.className = type;
}

function clearMessage() {
    registerMessage.textContent = "";
    registerMessage.className = "";
}

function setLoading(isLoading) {
    registerButton.disabled = isLoading;
    registerButton.textContent = isLoading ? "Creando cuenta..." : "Crear cuenta";
}

function validateForm() {
    const nombre = nombreInput.value.trim();
    const apellido = apellidoInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!nombre) { showMessage("Ingresa tu nombre."); nombreInput.focus(); return null; }
    if (!apellido) { showMessage("Ingresa tu apellido."); apellidoInput.focus(); return null; }
    if (!email) { showMessage("Ingresa tu correo electrónico."); emailInput.focus(); return null; }
    if (!password) { showMessage("Ingresa una contraseña."); passwordInput.focus(); return null; }
    if (password.length < 8) { showMessage("La contraseña debe tener al menos 8 caracteres."); passwordInput.focus(); return null; }
    if (password !== confirmPassword) { showMessage("Las contraseñas no coinciden."); confirmPasswordInput.focus(); return null; }

    return { nombre, apellido, email, password };
}

togglePassword.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    togglePasswordIcon.className = isPassword ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
});

toggleConfirmPassword.addEventListener("click", () => {
    const isPassword = confirmPasswordInput.type === "password";
    confirmPasswordInput.type = isPassword ? "text" : "password";
    toggleConfirmPasswordIcon.className = isPassword ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
});

async function registerUser(formData) {
    const result = await AuthService.signUp({
        firstName: formData.nombre,
        lastName: formData.apellido,
        email: formData.email,
        password: formData.password
    });

    if (result.error) throw result.error;
    return result.data.user;
}

async function createUserProfile(user, formData) {
    const result = await ProfileService.createProfile({
        authUserId: user.id,
        nombre: formData.nombre,
        apellido: formData.apellido
    });

    if (result.error) throw result.error;
    return result.data;
}

async function handleRegister(event) {
    event.preventDefault();
    clearMessage();

    const formData = validateForm();
    if (!formData) return;

    try {
        setLoading(true);

        const user = await registerUser(formData);
        await createUserProfile(user, formData);

        showMessage("Cuenta creada correctamente. Ahora confirma tu correo e inicia sesión.", "success");
        form.reset();

        const returnUrl = getReturnUrl();
        const loginUrl = returnUrl
            ? `${APP_CONFIG.routes.login}?return=${encodeURIComponent(returnUrl)}`
            : APP_CONFIG.routes.login;

        setTimeout(() => {
            window.location.href = loginUrl;
        }, 2000);

    } catch (error) {
        console.error(error);
        showMessage(error.message || "No fue posible crear la cuenta.");
    } finally {
        setLoading(false);
    }
}

form.addEventListener("submit", handleRegister);
