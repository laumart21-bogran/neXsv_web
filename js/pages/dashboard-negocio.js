import AuthSession from "../auth/auth.session.js";
import BusinessService from "../services/business.service.js";
import { APP_CONFIG } from "../core/config.js";

document.addEventListener("DOMContentLoaded", async () => {

    console.log("Dashboard de negocio cargado correctamente");

    // Inicializar sesión
    if (!AuthSession.isInitialized()) {
        await AuthSession.initialize();
    }

    // Verificar autenticación
    if (!AuthSession.isAuthenticated()) {
        window.location.href = APP_CONFIG.routes.login;
        return;
    }

    // Usuario autenticado
    const user = AuthSession.getCurrentUser();

    console.log("Usuario negocio:", user);

    // Buscar negocio asociado al usuario
    const { data: negocio, error } =
        await BusinessService.getBusinessByOwner(user.id);

    if (error) {
        console.error("Error al cargar negocio:", error);
        mostrarError("No fue posible cargar la información del negocio.");
        return;
    }

    console.log("Negocio encontrado:", negocio);

    // Si el usuario todavía no tiene negocio
    if (!negocio) {
        mostrarSinNegocio();
        return;
    }

    // Mostrar información
    renderBusiness(negocio, user);

});


// =====================================================
// RENDERIZAR NEGOCIO
// =====================================================

function renderBusiness(negocio, user) {

    const nombre =
        negocio.nombre ||
        "Mi negocio";

    const categoria =
        negocio.categoria ||
        "Negocio registrado";

    const estado =
        negocio.estado ||
        "pendiente";

    // Nombre del propietario
    setText(
        "businessOwnerName",
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        "Miembro"
    );

    // Información principal
    setText(
        "businessName",
        nombre
    );

    setText(
        "businessCategory",
        categoria
    );

    // Estado
    renderStatus(estado);

    // Avatar
    renderAvatar(
        negocio.logo,
        nombre
    );

    // Bienvenida
    const primerNombre =
        (
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            "Miembro"
        )
        .trim()
        .split(" ")[0];

    setText(
        "welcomeTitle",
        `¡Bienvenido, ${primerNombre}!`
    );

}


// =====================================================
// ESTADO DEL NEGOCIO
// =====================================================

function renderStatus(estado) {

    const statusElement =
        document.getElementById("businessStatus");

    const titleElement =
        document.getElementById("statusTitle");

    const descriptionElement =
        document.getElementById("statusDescription");


    const estadoNormalizado =
        String(estado)
            .trim()
            .toLowerCase();


    if (estadoNormalizado === "aprobado") {

        if (statusElement) {

            statusElement.innerHTML =
                `<i class="fa-solid fa-circle-check"></i>
                 Negocio aprobado`;

        }

        if (titleElement) {

            titleElement.textContent =
                "Tu negocio está publicado";

        }

        if (descriptionElement) {

            descriptionElement.textContent =
                "Tu negocio forma parte de la red neXsv.";

        }

        return;
    }


    if (estadoNormalizado === "rechazado") {

        if (statusElement) {

            statusElement.innerHTML =
                `<i class="fa-solid fa-circle-xmark"></i>
                 Negocio rechazado`;

        }

        if (titleElement) {

            titleElement.textContent =
                "Tu negocio necesita revisión";

        }

        if (descriptionElement) {

            descriptionElement.textContent =
                "Revisa la información registrada de tu negocio.";

        }

        return;
    }


    // Estado pendiente
    if (statusElement) {

        statusElement.innerHTML =
            `<i class="fa-solid fa-clock"></i>
             Pendiente de revisión`;

    }

    if (titleElement) {

        titleElement.textContent =
            "Tu negocio está en revisión";

    }

    if (descriptionElement) {

        descriptionElement.textContent =
            "Estamos verificando la información de tu negocio antes de publicarla en la red.";

    }

}


// =====================================================
// AVATAR / LOGO
// =====================================================

function renderAvatar(logo, nombre) {

    const headerAvatar =
        document.getElementById("headerAvatar");

    const businessAvatar =
        document.getElementById("businessAvatar");


    if (!logo) {

        const initials =
            getInitials(nombre);

        if (headerAvatar) {

            headerAvatar.textContent =
                initials;

        }

        if (businessAvatar) {

            businessAvatar.textContent =
                initials;

        }

        return;
    }


    if (headerAvatar) {

        headerAvatar.innerHTML =
            `<img src="${logo}"
                  alt="${nombre}">`;

    }

    if (businessAvatar) {

        businessAvatar.innerHTML =
            `<img src="${logo}"
                  alt="${nombre}">`;

    }

}


// =====================================================
// SIN NEGOCIO
// =====================================================

function mostrarSinNegocio() {

    setText(
        "businessName",
        "Sin negocio registrado"
    );

    setText(
        "businessCategory",
        "Todavía no tienes un negocio asociado"
    );

    setText(
        "statusTitle",
        "No encontramos tu negocio"
    );

    setText(
        "statusDescription",
        "Este usuario todavía no tiene un negocio asociado en neXsv."
    );

}


// =====================================================
// ERROR
// =====================================================

function mostrarError(mensaje) {

    console.error(mensaje);

    setText(
        "businessName",
        "Error al cargar"
    );

    setText(
        "statusTitle",
        "No pudimos cargar tu negocio"
    );

    setText(
        "statusDescription",
        mensaje
    );

}


// =====================================================
// UTILIDADES
// =====================================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value;

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
