import AuthSession from "../auth/auth.session.js";
import ProfileService from "../services/profile.service.js";
import { APP_CONFIG } from "../core/config.js";

document.addEventListener("DOMContentLoaded", async () => {

    if (!AuthSession.isInitialized()) {
        await AuthSession.initialize();
    }

    if (!AuthSession.isAuthenticated()) {
        window.location.href = APP_CONFIG.routes.login;
        return;
    }

    const user = AuthSession.getCurrentUser();

    const { data: perfil, error } =
        await ProfileService.getProfile(user.id);

    if (error) {
        console.error("Error al cargar el perfil:", error);
    }

    renderDashboard(user, perfil);

});


function renderDashboard(user, perfil) {

    const nombre =
        perfil?.nombre ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        "Miembro";

    const apellido =
        perfil?.apellido || "";

    const nombreCompleto =
        `${nombre} ${apellido}`.trim();

    const correo = user.email || "";

    const rol =
        user.user_metadata?.role ||
        "Miembro";

    setText("topUserName", nombreCompleto);
    setText("topUserRole", rol);

    setText("memberName", nombreCompleto);
    setText("memberEmail", correo);

    const primerNombre = nombre.split(" ")[0];

    setText(
        "welcomeTitle",
        `¡Bienvenido, ${primerNombre}!`
    );

    renderAvatar(
        perfil?.foto,
        nombreCompleto
    );

}


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

    if (topAvatarInitials) {
        topAvatarInitials.textContent = initials;
        topAvatarInitials.style.display = "block";
    }

    if (sidebarAvatarInitials) {
        sidebarAvatarInitials.textContent = initials;
        sidebarAvatarInitials.style.display = "block";
    }

}


function setText(id, value) {

    const element =
        document.getElementById(id);

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
