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

    if (!AuthSession.isInitialized()) await AuthSession.initialize();
    if (!AuthSession.isAuthenticated()) {
        window.location.href = APP_CONFIG.routes.login;
        return;
    }

    const user = AuthSession.getCurrentUser();
    const form = document.getElementById("businessForm");
    if (!form) return;

    configurarUbicacion();
    configurarWhatsapp();
    await cargarColegios();
    await cargarObjetivos();
    configurarLimiteObjetivos();
    configurarOtroObjetivo();

    const correctionRequest = await obtenerSolicitudEnCorreccion(user.id);

    if (correctionRequest) {
        await cargarDatosParaCorreccion(user, correctionRequest);
        prepararModoCorreccion(form);
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (correctionRequest) {
            await guardarCorreccion(user, form, correctionRequest);
        } else {
            await guardarDatosIniciales(user, form);
        }
    });
});

async function obtenerSolicitudEnCorreccion(userId) {
    const { data, error } = await BusinessRequestService.getRequestsByUser(userId);

    if (error) {
        console.error("Error al consultar solicitudes:", error);
        return null;
    }

    return (data || []).find((request) => request.estado === "CORRECCION") || null;
}

function prepararModoCorreccion(form) {
    const submitButton = form.querySelector("button[type='submit']");
    if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Reenviar solicitud corregida";
    }

    const messageElement = document.getElementById("formMessage");
    if (messageElement) {
        messageElement.textContent = "Estás corrigiendo una solicitud. Revisa la información indicada por neXsv y vuelve a enviarla cuando esté lista.";
        messageElement.dataset.type = "info";
    }
}

async function cargarDatosParaCorreccion(user, request) {
    const { data: profile, error: profileError } = await ProfileService.getProfile(user.id);
    if (profileError) {
        console.error("Error al cargar perfil para corrección:", profileError);
        mostrarMensaje("No fue posible cargar tus datos personales.", "error");
        return;
    }

    const { data: business, error: businessError } = await BusinessService.getBusinessById(request.business_id);
    if (businessError) {
        console.error("Error al cargar negocio para corrección:", businessError);
        mostrarMensaje("No fue posible cargar los datos del negocio.", "error");
        return;
    }

    const { data: selectedSchools, error: schoolsError } = await ProfileSchoolService.getSchoolsByProfile(profile.id);
    if (schoolsError) {
        console.error("Error al cargar colegios para corrección:", schoolsError);
    }

    const { data: selectedGoals, error: goalsError } = await BusinessGoalService.getGoalsByBusiness(business.id);
    if (goalsError) {
        console.error("Error al cargar objetivos para corrección:", goalsError);
    }

    const setValue = (id, value) => {
        const element = document.getElementById(id);
        if (element && value !== null && value !== undefined) element.value = value;
    };

    setValue("nombre", business.nombre);
    setValue("categoria", business.categoria);
    setValue("etapa_negocio", business.etapa_negocio);
    setValue("tipo_oferta", business.tipo_oferta);
    setValue("descripcion", business.descripcion);
    setValue("whatsapp", business.whatsapp?.replace(/^https:\/\/wa\.me\/503/, ""));
    setValue("email", business.email);
    setValue("sitio_web", business.sitio_web);
    setValue("google_maps_url", business.google_maps_url);
    setValue("instagram", business.instagram);
    setValue("facebook", business.facebook);
    setValue("tiktok", business.tiktok);
    setValue("otra_red_social", business.otra_red_social);
    setValue("otro_objetivo", business.otro_objetivo);

    const padreSi = document.getElementById("padre-si");
    const padreNo = document.getElementById("padre-no");
    if (profile.es_padre_colegio_privado) {
        padreSi.checked = true;
    } else {
        padreNo.checked = true;
    }
    padreSi?.dispatchEvent(new Event("change", { bubbles: true }));

    const oportunidadesSi = document.getElementById("oportunidades-si");
    const oportunidadesNo = document.getElementById("oportunidades-no");
    if (profile.recibir_oportunidades) {
        oportunidadesSi.checked = true;
    } else {
        oportunidadesNo.checked = true;
    }

    const privacidad = document.getElementById("acepta_privacidad");
    if (privacidad) privacidad.checked = true;

    const departamento = document.getElementById("departamento");
    const municipio = document.getElementById("municipio");
    if (departamento && business.departamento) {
        departamento.value = business.departamento;
        departamento.dispatchEvent(new Event("change", { bubbles: true }));
        if (municipio && business.municipio) municipio.value = business.municipio;
    }

    const schoolIds = new Set((selectedSchools || []).map((row) => row.school_id));
    document.querySelectorAll("#school-section input[name='school_ids']").forEach((input) => {
        input.checked = schoolIds.has(input.value);
    });

    const otroColegioInput = document.getElementById("otro_colegio");
    const otroColegioCheckbox = document.getElementById("school-otro");
    if (profile.otro_colegio) {
        if (otroColegioCheckbox) otroColegioCheckbox.checked = true;
        if (otroColegioInput) otroColegioInput.value = profile.otro_colegio;
        otroColegioCheckbox?.dispatchEvent(new Event("change", { bubbles: true }));
    }

    const goalIds = new Set((selectedGoals || []).map((row) => row.goal_id));
    document.querySelectorAll("input[name='goal_ids']").forEach((input) => {
        input.checked = goalIds.has(input.value);
    });

    const otherGoal = document.getElementById("goal-otros");
    otherGoal?.dispatchEvent(new Event("change", { bubbles: true }));

    console.log("Datos cargados para corrección:", { request, business, profile });
}

function configurarUbicacion() {
    const departamentoInput = document.getElementById("departamento");
    const municipioInput = document.getElementById("municipio");
    if (!departamentoInput || !municipioInput) return;

    const departamentoSelect = document.createElement("select");
    departamentoSelect.id = "departamento";
    departamentoSelect.name = "departamento";
    departamentoSelect.required = true;
    departamentoSelect.innerHTML = `
        <option value="">Selecciona un departamento</option>
        ${DEPARTAMENTOS_EL_SALVADOR.map((departamento) => `<option value="${departamento}">${departamento}</option>`).join("")}
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
        const municipios = UBICACIONES_EL_SALVADOR[departamentoSelect.value] || [];
        municipioSelect.innerHTML = "";
        municipioSelect.disabled = municipios.length === 0;

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = municipios.length ? "Selecciona un municipio" : "Selecciona un departamento";
        municipioSelect.appendChild(defaultOption);

        municipios.forEach((municipio) => {
            const option = document.createElement("option");
            option.value = municipio;
            option.textContent = municipio;
            municipioSelect.appendChild(option);
        });
    });
}

function configurarWhatsapp() {
    const whatsappInput = document.getElementById("whatsapp");
    if (!whatsappInput) return;
    whatsappInput.addEventListener("input", () => {
        const digits = whatsappInput.value.replace(/\D/g, "").slice(0, 8);
        whatsappInput.setCustomValidity(digits.length === 8 ? "" : "Ingresa un número de WhatsApp válido de 8 dígitos.");
    });
}

function normalizarWhatsapp(numero) {
    const digits = String(numero || "").replace(/\D/g, "");
    if (!/^\d{8}$/.test(digits)) throw new Error("Ingresa un número de WhatsApp válido de 8 dígitos.");
    return `https://wa.me/503${digits}`;
}

function configurarColegios() {
    const schoolSection = document.getElementById("school-section");
    const padreSi = document.getElementById("padre-si");
    const padreNo = document.getElementById("padre-no");
    const otroColegioCheckbox = document.getElementById("school-otro");
    const otroColegioSection = document.getElementById("other-school-section");
    const otroColegioInput = document.getElementById("otro_colegio");
    if (!schoolSection || !padreSi || !padreNo) return;

    const actualizarEstado = () => {
        const mostrarColegios = padreSi.checked;
        const otroSeleccionado = mostrarColegios && otroColegioCheckbox?.checked === true;
        schoolSection.hidden = !mostrarColegios;
        schoolSection.querySelectorAll("input").forEach((input) => input.disabled = !mostrarColegios);

        if (otroColegioSection && otroColegioInput) {
            otroColegioSection.hidden = !otroSeleccionado;
            otroColegioInput.disabled = !otroSeleccionado;
            otroColegioInput.required = otroSeleccionado;
        }

        if (!mostrarColegios) {
            schoolSection.querySelectorAll("input[type='checkbox']").forEach((input) => input.checked = false);
            if (otroColegioInput) otroColegioInput.value = "";
        }
        if (!otroSeleccionado && mostrarColegios && otroColegioInput) otroColegioInput.value = "";
    };

    padreSi.addEventListener("change", actualizarEstado);
    padreNo.addEventListener("change", actualizarEstado);
    otroColegioCheckbox?.addEventListener("change", actualizarEstado);
    actualizarEstado();
}

async function cargarColegios() {
    const container = document.querySelector("input[name='school_ids']")?.closest(".inc-options");
    if (!container) return;
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
        option.append(input, label);
        container.appendChild(option);
    });

    configurarColegios();
}

async function cargarObjetivos() {
    const container = document.querySelector("input[name='goal_ids']")?.closest(".inc-options");
    if (!container) return;
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
        input.id = goal.nombre === "Otros" ? "goal-otros" : `goal-${goal.id}`;
        input.name = "goal_ids";
        input.value = goal.id;

        const label = document.createElement("label");
        label.htmlFor = input.id;
        label.textContent = goal.nombre;
        option.append(input, label);
        container.appendChild(option);
    });
}

function configurarLimiteObjetivos() {
    document.addEventListener("change", (event) => {
        if (!event.target.matches("input[name='goal_ids']")) return;
        const selected = document.querySelectorAll("input[name='goal_ids']:checked");
        if (selected.length > 3) {
            event.target.checked = false;
            mostrarMensaje("Puedes seleccionar un máximo de 3 objetivos.", "error");
        }
    });
}

function configurarOtroObjetivo() {
    const otherGoalSection = document.getElementById("other-goal-section");
    const otherGoalInput = document.getElementById("otro_objetivo");
    if (!otherGoalSection || !otherGoalInput) return;

    const actualizarEstado = () => {
        const otherGoalSelected = document.querySelector("input[name='goal_ids'][id='goal-otros']")?.checked === true;
        otherGoalSection.hidden = !otherGoalSelected;
        otherGoalInput.disabled = !otherGoalSelected;
        otherGoalInput.required = otherGoalSelected;
        if (!otherGoalSelected) otherGoalInput.value = "";
    };

    document.addEventListener("change", (event) => {
        if (event.target.matches("input[name='goal_ids']")) actualizarEstado();
    });
    actualizarEstado();
}

async function guardarDatosIniciales(user, form) {
    const messageElement = document.getElementById("formMessage");
    const submitButton = form.querySelector("button[type='submit']");
    setGuardando(submitButton, messageElement);

    try {
        const formData = new FormData(form);
        const datos = await validarFormulario(formData);
        await actualizarPerfilYRelaciones(user, datos);

        const businessData = construirBusinessData(user, formData, datos.whatsapp);
        const { data: business, error: businessError } = await BusinessService.createBusiness(businessData);
        if (businessError) throw new Error("No fue posible registrar el negocio.");

        const { error: goalsError } = await BusinessGoalService.addGoals(business.id, datos.selectedGoalIds);
        if (goalsError) throw new Error("El negocio se creó, pero no fue posible guardar los objetivos seleccionados.");

        const { error: requestError } = await BusinessRequestService.createRequest({
            business_id: business.id,
            user_id: user.id,
            estado: "PENDIENTE",
            observaciones: null,
            reviewed_at: null,
            reviewed_by: null
        });
        if (requestError) throw new Error("El negocio se creó, pero no fue posible registrar la solicitud de incorporación.");

        mostrarMensaje("¡Perfecto! Tus datos, negocio, objetivos y solicitud de incorporación se guardaron correctamente.", "success");
        form.reset();
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Información guardada";
        }
    } catch (error) {
        console.error("Error en incorporación:", error);
        mostrarMensaje(error.message || "Ocurrió un error al guardar la información.", "error");
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Enviar solicitud de incorporación";
        }
    }
}

async function guardarCorreccion(user, form, request) {
    const messageElement = document.getElementById("formMessage");
    const submitButton = form.querySelector("button[type='submit']");
    setGuardando(submitButton, messageElement, "Guardando corrección...");

    try {
        const formData = new FormData(form);
        const datos = await validarFormulario(formData);
        await actualizarPerfilYRelaciones(user, datos);

        const businessData = construirBusinessData(user, formData, datos.whatsapp);
        const { error: businessError } = await BusinessService.updateBusiness(request.business_id, businessData);
        if (businessError) {
            console.error("Error al actualizar negocio:", businessError);
            throw new Error("No fue posible actualizar el negocio.");
        }

        const { error: goalsError } = await BusinessGoalService.replaceGoals(request.business_id, datos.selectedGoalIds);
        if (goalsError) {
            console.error("Error al actualizar objetivos:", goalsError);
            throw new Error("El negocio se actualizó, pero no fue posible actualizar los objetivos.");
        }

        const { data: updatedRequest, error: requestError } = await BusinessRequestService.resubmitCorrection(request.id);
        if (requestError) {
            console.error("Error al reenviar solicitud:", requestError);
            throw new Error("Los datos se actualizaron, pero no fue posible reenviar la solicitud.");
        }

        console.log("Solicitud corregida y reenviada:", updatedRequest);
        mostrarMensaje("¡Listo! La solicitud fue corregida y reenviada a neXsv para una nueva revisión.", "success");

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Solicitud reenviada";
        }
    } catch (error) {
        console.error("Error en corrección:", error);
        mostrarMensaje(error.message || "Ocurrió un error al guardar la corrección.", "error");
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Reenviar solicitud corregida";
        }
    }
}

async function validarFormulario(formData) {
    const esPadre = formData.get("es_padre_colegio_privado");
    const recibirOportunidades = formData.get("recibir_oportunidades") === "true";
    const aceptaPrivacidad = formData.get("acepta_privacidad") === "true";
    const otroColegioCheckbox = document.getElementById("school-otro");
    const otroColegioSeleccionado = esPadre === "true" && otroColegioCheckbox?.checked === true;
    const otroColegio = otroColegioSeleccionado ? formData.get("otro_colegio")?.trim() || null : null;
    const selectedSchoolIds = esPadre === "true"
        ? Array.from(document.querySelectorAll("#school-section input[name='school_ids']:checked:not(:disabled)"))
            .map((input) => input.value).filter(Boolean)
        : [];
    const selectedGoalIds = formData.getAll("goal_ids").filter(Boolean);
    const otroObjetivo = document.getElementById("otro_objetivo")?.value.trim() || null;
    const otherGoalSelected = document.querySelector("input[name='goal_ids'][id='goal-otros']")?.checked === true;

    if (!aceptaPrivacidad) throw new Error("Debes aceptar la política de privacidad para continuar.");
    if (esPadre === "true" && selectedSchoolIds.length === 0 && !otroColegioSeleccionado) {
        throw new Error("Selecciona al menos un colegio o marca “Otro colegio” si no aparece en la lista.");
    }
    if (otroColegioSeleccionado && !otroColegio) {
        throw new Error("Escribe el nombre de tu colegio después de seleccionar “Otro colegio”.");
    }
    if (selectedGoalIds.length > 3) throw new Error("Puedes seleccionar un máximo de 3 objetivos.");
    if (otherGoalSelected && !otroObjetivo) {
        throw new Error("Indica qué buscas cuando seleccionas el objetivo “Otros”.");
    }

    return {
        esPadre,
        recibirOportunidades,
        selectedSchoolIds,
        otroColegio,
        selectedGoalIds,
        otroObjetivo,
        otherGoalSelected,
        whatsapp: normalizarWhatsapp(formData.get("whatsapp")),
        aceptaPrivacidad
    };
}

async function actualizarPerfilYRelaciones(user, datos) {
    const { data: profile, error: profileError } = await ProfileService.updateProfile(user.id, {
        es_padre_colegio_privado: datos.esPadre === "true",
        otro_colegio: datos.otroColegio,
        recibir_oportunidades: datos.recibirOportunidades,
        acepta_privacidad: true,
        privacidad_aceptada_at: new Date().toISOString()
    });

    if (profileError) {
        console.error("Error al actualizar perfil:", profileError);
        throw new Error("No fue posible guardar tus datos personales.");
    }

    if (datos.esPadre === "true") {
        const { error } = await ProfileSchoolService.replaceSchools(profile.id, datos.selectedSchoolIds);
        if (error) {
            console.error("Error al actualizar colegios:", error);
            throw new Error("No fue posible actualizar los colegios seleccionados.");
        }
    } else {
        const { error } = await ProfileSchoolService.replaceSchools(profile.id, []);
        if (error) {
            console.error("Error al limpiar colegios:", error);
            throw new Error("No fue posible actualizar la información de colegios.");
        }
    }
}

function construirBusinessData(user, formData, whatsapp) {
    return {
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
        otro_objetivo: document.getElementById("goal-otros")?.checked
            ? document.getElementById("otro_objetivo")?.value.trim() || null
            : null,
        estado: "pendiente",
        fecha_aprobacion: null
    };
}

function setGuardando(submitButton, messageElement, text = "Guardando información...") {
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = text;
    }
    if (messageElement) {
        messageElement.textContent = "";
        messageElement.dataset.type = "";
    }
}

function mostrarMensaje(mensaje, tipo) {
    const element = document.getElementById("formMessage");
    if (!element) return;
    element.textContent = mensaje;
    element.dataset.type = tipo;
}
