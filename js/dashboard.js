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
    // Usuario completo
const usuario = getCurrentUser();

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

/*=========================================
Fotografía del usuario
=========================================*/

const topAvatarImage = document.getElementById("topAvatarImage");
const topAvatarInitials = document.getElementById("topAvatarInitials");

const sidebarAvatarImage = document.getElementById("sidebarAvatarImage");
const sidebarAvatarInitials = document.getElementById("sidebarAvatarInitials");

const iniciales = obtenerIniciales(usuario.nombre || "Miembro");

if (usuario.foto) {

    if (topAvatarImage) {

        topAvatarImage.src = usuario.foto;
        topAvatarImage.style.display = "block";

    }

    if (sidebarAvatarImage) {

        sidebarAvatarImage.src = usuario.foto;
        sidebarAvatarImage.style.display = "block";

    }

    if (topAvatarInitials)
        topAvatarInitials.style.display = "none";

    if (sidebarAvatarInitials)
        sidebarAvatarInitials.style.display = "none";

} else {

    if (topAvatarInitials)
        topAvatarInitials.textContent = iniciales;

    if (sidebarAvatarInitials)
        sidebarAvatarInitials.textContent = iniciales;

}

/*=========================================
Obtener Iniciales
=========================================*/

function obtenerIniciales(nombre){

    const partes = nombre.trim().split(" ");

    let texto = "";

    if(partes.length > 0 && partes[0].length){

        texto += partes[0][0];

    }

    if(partes.length > 1 && partes[1].length){

        texto += partes[1][0];

    }

    return texto.toUpperCase();

}
