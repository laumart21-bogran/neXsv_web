import AuthSession from "../auth/auth.session.js";
import ProfileService from "../services/profile.service.js";
import ProfileSchoolService from "../services/profile-school.service.js";
import BusinessService from "../services/business.service.js";
import { APP_CONFIG } from "../core/config.js";

// =====================================================
// INICIALIZAR PÁGINA
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {

    console.log("Página de incorporación cargada");

    if (!AuthSession.isInitialized()) {
        await AuthSession.initialize();
    }

    if (!AuthSession.isAuthenticated()) {
        window.location.href = APP_CONFIG.routes.login;
        return;
    }

    const user = AuthSession.getCurrentUser();
    console.log("Usuario autenticado:", user);

    const form = document.getElementById("businessForm");

    if (!form) {
        console.error("No se encontró el formulario.");
        return;
    }

    await cargarColegios();

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        await guardarDatosIniciales(user, form);
    });
});

// =====================================================
// CARGAR COLEGIOS DESDE SUPABASE
// =====================================================

async function cargarColegios() {

    const container = document.querySelector("input[name='school_ids']")?.closest(".inc-options");

    if (!container) {
        console.error("No se encontró el contenedor de colegios.");
        return;
    }

    const { data: schools, error } = await ProfileSchoolService.getSchools();

    if (error) {
        console.error("Error al cargar colegios:", error);
        return;
    }

    container.innerHTML = "";

    schools.forEach((school) => {

        const option = document.createElement("div");
        option.className = "inc-option";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.id = `school-${school.id}`;
        input.name = "school_ids";
        input.value = school.id;

        const label = document.createElement("label");
        label.htmlFor = input.id;
        label.textContent = school.nombre;

        option.appendChild(input);
        option.appendChild(label);
        container.appendChild(option);
    });
}

// =====================================================
// GUARDAR PERFIL + COLEGIOS + NEGOCIO
// Esta etapa todavía NO crea objetivos ni solicitud.
// =====================================================

async function guardarDatosIniciales(user, form) {

    const messageElement = document.getElementById("formMessage");
    const submitButton = form.querySelector("button[type='submit']");

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Guardando información...";
    }

    if (messageElement) {
        messageElement.textContent = "";
        messageElement.dataset.type = "";
    }

    try {

        const formData = new FormData(form);

        // =================================================
        // 1. DATOS PERSONALES → profiles
        // =================================================

        const esPadre = formData.get("es_padre_colegio_privado");
        const recibirOportunidades = formData.get("recibir_oportunidades") === "true";
        const aceptaPrivacidad = formData.get("acepta_privacidad") === "true";

        if (!aceptaPrivacidad) {
            throw new Error("Debes aceptar la política de privacidad para continuar.");
        }

        const selectedSchoolIds = formData.getAll("school_ids").filter(Boolean);

        if (esPadre === "true" && selectedSchoolIds.length === 0) {
            throw new Error("Si indicas que eres padre o madre de un colegio privado, debes seleccionar al menos un colegio.");
        }

        const profileData = {
            es_padre_colegio_privado: esPadre === "true",
            recibir_oportunidades: recibirOportunidades,
            acepta_privacidad: true,
            privacidad_aceptada_at: new Date().toISOString()
        };

        const { data: profile, error: profileError } =
            await ProfileService.updateProfile(user.id, profileData);

        if (profileError) {
            console.error("Error al actualizar perfil:", profileError);
            throw new Error("No fue posible guardar tus datos personales.");
        }

        console.log("Perfil actualizado:", profile);

        // =================================================
        // 2. COLEGIOS → profile_schools
        // =================================================

        const profileId = profile.id;

        const { data: savedSchools, error: schoolsError } =
            await ProfileSchoolService.addSchools(profileId, selectedSchoolIds);

        if (schoolsError) {
            console.error("Error al guardar colegios:", schoolsError);
            throw new Error("Tus datos personales se guardaron, pero no fue posible guardar los colegios seleccionados.");
        }

        console.log("Colegios guardados:", savedSchools);

        // =================================================
        // 3. DATOS DEL NEGOCIO → businesses
        // =================================================

        const businessData = {
            owner_id: user.id,
            nombre: formData.get("nombre")?.trim(),
            categoria: formData.get("categoria")?.trim(),
            descripcion: formData.get("descripcion")?.trim(),
            tipo_oferta: formData.get("tipo_oferta")?.trim(),
            etapa_negocio: formData.get("etapa_negocio")?.trim(),
            whatsapp: formData.get("whatsapp")?.trim(),
            email: formData.get("email")?.trim(),
            sitio_web: formData.get("sitio_web")?.trim() || null,
            ciudad: formData.get("ciudad")?.trim(),
            zona: formData.get("zona")?.trim(),
            google_maps_url: formData.get("google_maps_url")?.trim(),
            instagram: formData.get("instagram")?.trim() || null,
            facebook: formData.get("facebook")?.trim() || null,
            tiktok: formData.get("tiktok")?.trim() || null,
            otra_red_social: formData.get("otra_red_social")?.trim() || null,
            estado: "pendiente",
            fecha_aprobacion: null
        };

        console.log("Datos del negocio:", businessData);

        const { data: business, error: businessError } =
            await BusinessService.createBusiness(businessData);

        if (businessError) {
            console.error("Error al crear negocio:", businessError);
            throw new Error("No fue posible registrar el negocio.");
        }

        console.log("Negocio creado:", business);

        // =================================================
        // ÉXITO DE ESTA ETAPA
        // =================================================

        mostrarMensaje(
            "¡Perfecto! Tus datos personales, colegios y datos de tu negocio se guardaron correctamente. En el siguiente paso conectaremos objetivos y la solicitud de incorporación.",
            "success"
        );

        form.reset();

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Información guardada";
        }

    } catch (error) {

        console.error("Error en incorporación:", error);

        mostrarMensaje(
            error.message || "Ocurrió un error al guardar la información.",
            "error"
        );

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Enviar solicitud de incorporación";
        }
    }
}

// =====================================================
// MENSAJE
// =====================================================

function mostrarMensaje(mensaje, tipo) {

    const element = document.getElementById("formMessage");

    if (!element) {
        return;
    }

    element.textContent = mensaje;
    element.dataset.type = tipo;
}
