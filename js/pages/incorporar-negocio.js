import AuthSession from "../auth/auth.session.js";
import ProfileService from "../services/profile.service.js";
import ProfileSchoolService from "../services/profile-school.service.js";
import BusinessService from "../services/business.service.js";
import BusinessGoalService from "../services/business-goal.service.js";
import BusinessRequestService from "../services/business-request.service.js";
import { DEPARTAMENTOS_EL_SALVADOR, UBICACIONES_EL_SALVADOR } from "../data/el-salvador-ubicaciones.js";
import { APP_CONFIG } from "../core/config.js";

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

    configurarUbicacion();
    configurarWhatsapp();
    await cargarColegios();
    await cargarObjetivos();
    configurarLimiteObjetivos();
    configurarOtroObjetivo();

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        await guardarDatosIniciales(user, form);
    });
});

// =====================================================
// UBICACIÓN: DEPARTAMENTO → MUNICIPIO
// =====================================================

function configurarUbicacion() {
    const departamentoInput = document.getElementById("departamento");
    const municipioInput = document.getElementById("municipio");

    if (!departamentoInput || !municipioInput) {
        console.error("No se encontraron los campos de departamento y municipio.");
        return;
    }

    const departamentoSelect = document.createElement("select");
    departamentoSelect.id = "departamento";
    departamentoSelect.name = "departamento";
    departamentoSelect.required = true;

    departamentoSelect.innerHTML = `
        <option value="">Selecciona un departamento</option>
        ${DEPARTAMENTOS_EL_SALVADOR.map(
            (departamento) => `<option value="${departamento}">${departamento}</option>`
        ).join("")}
    `;

    const municipioSelect = document.createElement("select");
    municipioSelect.id = "municipio";
    municipioSelect.name = "municipio";
    municipioSelect.required = true;
    municipioSelect.disabled = true;
    municipioSelect.innerHTML = `<option value="">Primero selecciona un departamento</option>`;

    departamentoInput.replaceWith(departamentoSelect);
    municipioInput.replaceWith(municipioSelect);

    departamentoSelect.addEventListener("change", () => {
        const departamento = departamentoSelect.value;
        const municipios = UBICACIONES_EL_SALVADOR[departamento] || [];

        municipioSelect.innerHTML = "";
        municipioSelect.disabled = municipios.length === 0;

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = municipios.length
            ? "Selecciona un municipio"
            : "Selecciona un departamento";
        municipioSelect.appendChild(defaultOption);

        municipios.forEach((municipio) => {
            const option = document.createElement("option");
            option.value = municipio;
            option.textContent = municipio;
            municipioSelect.appendChild(option);
        });
    });
}

// =====================================================
// WHATSAPP: NÚMERO → ENLACE wa.me
// =====================================================

function configurarWhatsapp() {
    const whatsappInput = document.getElementById("whatsapp");

    if (!whatsappInput) {
        console.error("No se encontró el campo de WhatsApp.");
        return;
    }

    whatsappInput.addEventListener("input", () => {
        const digits = whatsappInput.value.replace(/\D/g, "").slice(0, 8);

        if (digits.length === 8) {
            whatsappInput.setCustomValidity("");
        } else {
            whatsappInput.setCustomValidity("Ingresa un número de WhatsApp válido de 8 dígitos.");
        }
    });
}

function normalizarWhatsapp(numero) {
    const digits = String(numero || "").replace(/\D/g, "");

    if (!/^\d{8}$/.test(digits)) {
        throw new Error("Ingresa un número de WhatsApp válido de 8 dígitos.");
    }

    return `https://wa.me/503${digits}`;
}

// =====================================================
// COLEGIO: MOSTRAR SOLO SI ES PADRE/MADRE DE COLEGIO PRIVADO
// =====================================================

function configurarColegios() {
    const schoolSection = document.getElementById("school-section");
    const padreSi = document.getElementById("padre-si");
    const padreNo = document.getElementById("padre-no");
    const otroColegioInput = document.getElementById("otro_colegio");

    if (!schoolSection || !padreSi || !padreNo) {
        console.error("No se encontraron los elementos de la sección de colegios.");
        return;
    }

    const actualizarEstado = () => {
        const mostrarColegios = padreSi.checked;
        const schoolInputs = schoolSection.querySelectorAll("input");

        schoolSection.hidden = !mostrarColegios;

        schoolInputs.forEach((input) => {
            input.disabled = !mostrarColegios;
        });

        if (!mostrarColegios) {
            schoolSection.querySelectorAll("input[type='checkbox']").forEach((input) => {
                input.checked = false;
            });

            if (otroColegioInput) {
                otroColegioInput.value = "";
            }
        }
    };

    padreSi.addEventListener("change", actualizarEstado);
    padreNo.addEventListener("change", actualizarEstado);

    actualizarEstado();
}

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

    configurarColegios();
}

// =====================================================
// CARGAR OBJETIVOS DESDE SUPABASE
// =====================================================

async function cargarObjetivos() {
    const container = document.querySelector("input[name='goal_ids']")?.closest(".inc-options");

    if (!container) {
        console.error("No se encontró el contenedor de objetivos.");
        return;
    }

    const { data: goals, error } = await BusinessGoalService.getGoals();

    if (error) {
        console.error("Error al cargar objetivos:", error);
        return;
    }

    container.innerHTML = "";

    goals.forEach((goal) => {
        const option = document.createElement("div");
        option.className = "inc-option";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.id = `goal-${goal.id}`;
        input.name = "goal_ids";
        input.value = goal.id;

        const label = document.createElement("label");
        label.htmlFor = input.id;
        label.textContent = goal.nombre;

        option.appendChild(input);
        option.appendChild(label);
        container.appendChild(option);
    });
}

// =====================================================
// LÍMITE DE OBJETIVOS
// Máximo 3 opciones.
// =====================================================

function configurarLimiteObjetivos() {
    document.addEventListener("change", (event) => {
        if (!event.target.matches("input[name='goal_ids']")) {
            return;
        }

        const selected = document.querySelectorAll("input[name='goal_ids']:checked");

        if (selected.length > 3) {
            event.target.checked = false;
            mostrarMensaje("Puedes seleccionar un máximo de 3 objetivos.", "error");
        }
    });
}

// =====================================================
// OBJETIVO "OTROS"
// =====================================================

function configurarOtroObjetivo() {
    const otherGoalSection = document.getElementById("other-goal-section");
    const otherGoalInput = document.getElementById("otro_objetivo");

    if (!otherGoalSection || !otherGoalInput) {
        return;
    }

    const actualizarEstado = () => {
        const otherGoalSelected = document.querySelector("input[name='goal_ids'][id='goal-otros']")?.checked === true;

        otherGoalSection.hidden = !otherGoalSelected;
        otherGoalInput.disabled = !otherGoalSelected;
        otherGoalInput.required = otherGoalSelected;

        if (!otherGoalSelected) {
            otherGoalInput.value = "";
        }
    };

    document.addEventListener("change", (event) => {
        if (event.target.matches("input[name='goal_ids']")) {
            actualizarEstado();
        }
    });

    actualizarEstado();
}

// =====================================================
// GUARDAR PERFIL + COLEGIOS + NEGOCIO + OBJETIVOS + SOLICITUD
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

        const esPadre = formData.get("es_padre_colegio_privado");
        const recibirOportunidades = formData.get("recibir_oportunidades") === "true";
        const aceptaPrivacidad = formData.get("acepta_privacidad") === "true";
        const otroColegio = esPadre === "true"
            ? formData.get("otro_colegio")?.trim() || null
            : null;

        const selectedSchoolIds = esPadre === "true"
            ? Array.from(
                document.querySelectorAll("#school-section input[name='school_ids']:checked:not(:disabled)")
            ).map((input) => input.value).filter(Boolean)
            : [];

        const selectedGoalIds = formData.getAll("goal_ids").filter(Boolean);
        const otroObjetivo = document.getElementById("otro_objetivo")?.value.trim() || null;
        const otherGoalSelected = document.querySelector("input[name='goal_ids'][id='goal-otros']")?.checked === true;

        console.log("Estado padre/madre:", esPadre);
        console.log("Colegios seleccionados:", selectedSchoolIds);
        console.log("Otro colegio:", otroColegio);
        console.log("Objetivos seleccionados:", selectedGoalIds);
        console.log("Otro objetivo:", otroObjetivo);

        if (!aceptaPrivacidad) {
            throw new Error("Debes aceptar la política de privacidad para continuar.");
        }

        if (esPadre === "true" && selectedSchoolIds.length === 0 && !otroColegio) {
            throw new Error("Selecciona al menos un colegio o indica el nombre de tu colegio si no aparece en la lista.");
        }

        if (selectedGoalIds.length > 3) {
            throw new Error("Puedes seleccionar un máximo de 3 objetivos.");
        }

        if (otherGoalSelected && !otroObjetivo) {
            throw new Error("Indica qué buscas cuando seleccionas el objetivo “Otros”.");
        }

        const whatsapp = normalizarWhatsapp(formData.get("whatsapp"));

        const profileData = {
            es_padre_colegio_privado: esPadre === "true",
            otro_colegio: otroColegio,
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

        const profileId = profile.id;

        let savedSchools = [];

        if (esPadre === "true") {
            const { data, error } =
                await ProfileSchoolService.addSchools(profileId, selectedSchoolIds);

            if (error) {
                console.error("Error al guardar colegios:", error);
                throw new Error("Tus datos personales se guardaron, pero no fue posible guardar los colegios seleccionados.");
            }

            savedSchools = data || [];
        }

        console.log("Colegios guardados:", savedSchools);

        const businessData = {
            owner_id: user.id,
            nombre: formData.get("nombre")?.trim(),
            categoria: formData.get("categoria")?.trim(),
            descripcion: formData.get("descripcion")?.trim(),
            tipo_oferta: formData.get("tipo_oferta")?.trim(),
            etapa_negocio: formData.get("etapa_negocio")?.trim(),
            whatsapp,
            email: formData.get("email")?.trim(),
            sitio_web: formData.get("sitio_web")?.trim() || null,
            departamento: formData.get("departamento")?.trim(),
            municipio: formData.get("municipio")?.trim(),
            google_maps_url: formData.get("google_maps_url")?.trim(),
            instagram: formData.get("instagram")?.trim() || null,
            facebook: formData.get("facebook")?.trim() || null,
            tiktok: formData.get("tiktok")?.trim() || null,
            otra_red_social: formData.get("otra_red_social")?.trim() || null,
            otro_objetivo: otherGoalSelected ? otroObjetivo : null,
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

        const { data: savedGoals, error: goalsError } =
            await BusinessGoalService.addGoals(business.id, selectedGoalIds);

        if (goalsError) {
            console.error("Error al guardar objetivos:", goalsError);
            throw new Error("El negocio se creó, pero no fue posible guardar los objetivos seleccionados.");
        }

        console.log("Objetivos guardados:", savedGoals);

        const requestData = {
            business_id: business.id,
            user_id: user.id,
            estado: "PENDIENTE",
            observaciones: null,
            reviewed_at: null,
            reviewed_by: null
        };

        console.log("Solicitud de incorporación:", requestData);

        const { data: request, error: requestError } =
            await BusinessRequestService.createRequest(requestData);

        if (requestError) {
            console.error("Error al crear solicitud:", requestError);
            throw new Error("El negocio se creó, pero no fue posible registrar la solicitud de incorporación.");
        }

        console.log("Solicitud creada:", request);

        mostrarMensaje(
            "¡Perfecto! Tus datos, negocio, objetivos y solicitud de incorporación se guardaron correctamente.",
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
