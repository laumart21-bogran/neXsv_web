import AuthSession from "../auth/auth.session.js";
import BusinessService from "../services/business.service.js";
import BusinessRequestService from "../services/business-request.service.js";
import { APP_CONFIG } from "../core/config.js";


// =====================================================
// INICIALIZAR PÁGINA
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {

    console.log("Página de incorporación cargada");

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

    console.log("Usuario autenticado:", user);


    // Escuchar formulario
    const form = document.getElementById("businessForm");

    if (!form) {

        console.error("No se encontró el formulario.");

        return;
    }


    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        await incorporarNegocio(user, form);

    });

});


// =====================================================
// INCORPORAR NEGOCIO
// =====================================================

async function incorporarNegocio(user, form) {

    const messageElement =
        document.getElementById("formMessage");

    const submitButton =
        form.querySelector("button[type='submit']");


    // Estado visual
    if (submitButton) {

        submitButton.disabled = true;

        submitButton.textContent =
            "Enviando solicitud...";

    }


    if (messageElement) {

        messageElement.textContent =
            "";

    }


    // =================================================
    // OBTENER DATOS DEL FORMULARIO
    // =================================================

    const formData =
        new FormData(form);


    const businessData = {

        owner_id: user.id,

        nombre:
            formData.get("nombre")?.trim(),

        categoria:
            formData.get("categoria")?.trim(),

        descripcion:
            formData.get("descripcion")?.trim(),

        telefono:
            formData.get("telefono")?.trim(),

        email:
            formData.get("email")?.trim(),

        sitio_web:
            formData.get("sitio_web")?.trim() || null,

        direccion:
            formData.get("direccion")?.trim(),

        ciudad:
            formData.get("ciudad")?.trim(),

        estado:
            "pendiente",

        fecha_aprobacion:
            null

    };


    console.log(
        "Datos del negocio:",
        businessData
    );


    // =================================================
    // CREAR NEGOCIO
    // =================================================

    const {
        data: business,
        error: businessError
    } =
        await BusinessService.createBusiness(
            businessData
        );


    if (businessError) {

        console.error(
            "Error al crear negocio:",
            businessError
        );

        mostrarMensaje(
            "No fue posible registrar el negocio. Intenta nuevamente.",
            "error"
        );

        restaurarBoton(submitButton);

        return;
    }


    console.log(
        "Negocio creado:",
        business
    );


    // =================================================
    // CREAR SOLICITUD
    // =================================================

    const requestData = {

        business_id:
            business.id,

        user_id:
            user.id,

        estado:
            "PENDIENTE",

        observaciones:
            null,

        reviewed_at:
            null,

        reviewed_by:
            null

    };


    console.log(
        "Solicitud:",
        requestData
    );


    const {
        data: request,
        error: requestError
    } =
        await BusinessRequestService.createRequest(
            requestData
        );


    if (requestError) {

        console.error(
            "Error al crear solicitud:",
            requestError
        );

        mostrarMensaje(
            "El negocio fue registrado, pero no pudimos crear la solicitud. No envíes nuevamente el formulario; revisaremos este caso.",
            "error"
        );

        restaurarBoton(submitButton);

        return;
    }


    console.log(
        "Solicitud creada:",
        request
    );


    // =================================================
    // ÉXITO
    // =================================================

    mostrarMensaje(
        "¡Solicitud enviada correctamente! Tu negocio quedó pendiente de revisión.",
        "success"
    );


    form.reset();


    if (submitButton) {

        submitButton.disabled = true;

        submitButton.textContent =
            "Solicitud enviada";

    }

}


// =====================================================
// MENSAJE
// =====================================================

function mostrarMensaje(mensaje, tipo) {

    const element =
        document.getElementById("formMessage");


    if (!element) {
        return;
    }


    element.textContent =
        mensaje;


    element.dataset.type =
        tipo;

}


// =====================================================
// RESTAURAR BOTÓN
// =====================================================

function restaurarBoton(button) {

    if (!button) {
        return;
    }


    button.disabled = false;

    button.textContent =
        "Enviar solicitud";

}
