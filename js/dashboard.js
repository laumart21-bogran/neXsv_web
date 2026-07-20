/*=========================================
neXsv Dashboard
=========================================*/

document.addEventListener("DOMContentLoaded", () => {

    // Verificar sesión
    if (!isLogged()) {

        window.location.href = "acceso/login-usuario.html";
        return;

    }

    // Obtener usuario
    const nombre = getUserName();
    const correo = getUserEmail();
    const rol = getUserRole();

    // Header
    const topUserName = document.getElementById("topUserName");
    const topUserRole = document.getElementById("topUserRole");

    if (topUserName) {

        topUserName.textContent = nombre || "Miembro";

    }

    if (topUserRole) {

        topUserRole.textContent = rol || "Miembro";

    }

    // Sidebar
    const memberName = document.getElementById("memberName");
    const memberEmail = document.getElementById("memberEmail");

    if (memberName) {

        memberName.textContent = nombre || "Miembro";

    }

    if (memberEmail) {

        memberEmail.textContent = correo || "";

    }

    // Bienvenida
    const welcomeTitle = document.getElementById("welcomeTitle");

    if (welcomeTitle) {

        const primerNombre = (nombre || "Miembro").split(" ")[0];

        welcomeTitle.textContent = `¡Bienvenido, ${primerNombre}!`;

    }

});
