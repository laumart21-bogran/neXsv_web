/**
 * ==========================================================
 * neXsv Platform v2
 * Dashboard Controller
 * ==========================================================
 */

import AuthSession from "../auth/auth.session.js";
import { APP_CONFIG } from "../core/config.js";

document.addEventListener("DOMContentLoaded", async () => {

    // Asegurar que la sesión esté inicializada
    if (!AuthSession.isInitialized()) {
        await AuthSession.initialize();
    }

    // Verificar autenticación
    if (!AuthSession.isAuthenticated()) {
        window.location.href = APP_CONFIG.routes.login;
        return;
    }

    const user = AuthSession.getCurrentUser();

    renderDashboard(user);

});

/**
 * ==========================================================
 * Render principal
 * ==========================================================
 */

function renderDashboard(user) {

    const nombre =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        "Miembro";

    const correo = user.email || "";

    const rol =
        user.user_metadata?.role ||
        "Miembro";

    setText("topUserName", nombre);
    setText("topUserRole", rol);

    setText("memberName", nombre);
    setText("memberEmail", correo);

    const primerNombre = nombre.split(" ")[0];

    setText(
        "welcomeTitle",
        `¡Bienvenido, ${primerNombre}!`
    );

    renderAvatar(
        user.user_metadata?.avatar_url,
        nombre
    );

}

/**
 * ==========================================================
 * Avatar
 * ==========================================================
 */

function renderAvatar(photo, nombre) {

    const topAvatarImage =
        document.getElementById("topAvatarImage");

    const sidebarAvatarImage =
        document.getElementById("sidebarAvatarImage");

    const topAvatarInitials =
        document.getElementById("topAvatarInitials");

    const sidebarAvatarInitials =
        document.getElementById("sidebarAvatarInitials");

    if (photo) {

        if (topAvatarImage) {
            topAvatarImage.src = photo;
            topAvatarImage.style.display = "block";
        }

        if (sidebarAvatarImage) {
            sidebarAvatarImage.src = photo;
            sidebarAvatarImage.style.display = "block";
        }

        if (topAvatarInitials)
            topAvatarInitials.style.display = "none";

        if (sidebarAvatarInitials)
            sidebarAvatarInitials.style.display = "none";

        return;

    }

    const initials = getInitials(nombre);

    if (topAvatarInitials)
        topAvatarInitials.textContent = initials;

    if (sidebarAvatarInitials)
        sidebarAvatarInitials.textContent = initials;

}

/**
 * ==========================================================
 * Helpers
 * ==========================================================
 */

function setText(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }

}

function getInitials(name) {

    return name
        .trim()
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0])
        .join("")
        .toUpperCase();

}
