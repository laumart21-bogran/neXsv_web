import AuthSession from "../auth/auth.session.js";
import AdminService from "../services/admin.service.js";

const content = document.getElementById("requestContent");
const message = document.getElementById("adminMessage");

function showMessage(text) {
    message.textContent = text;
    message.hidden = false;
}

function setText(id, value) {
    document.getElementById(id).textContent = value || "—";
}

function formatDate(value) {
    return value ? new Date(value).toLocaleString("es-SV") : "—";
}

function statusClass(status) {
    if (status === "APROBADA") return "approved";
    if (status === "CORRECCION") return "correction";
    return "pending";
}

function statusLabel(status) {
    if (status === "APROBADA") return "Aprobada";
    if (status === "CORRECCION") return "En corrección";
    return "Pendiente";
}

async function loadRequest() {
    const requestId = new URLSearchParams(window.location.search).get("id");

    if (!requestId) {
        showMessage("No se indicó una solicitud para revisar.");
        return;
    }

    if (!AuthSession.isInitialized()) {
        await AuthSession.initialize();
    }

    if (!AuthSession.isAuthenticated()) {
        window.location.href = "/acceso/login-usuario.html";
        return;
    }

    const user = AuthSession.getCurrentUser();
    const { isAdmin, error: adminError } = await AdminService.isAdmin(user.id);

    if (adminError || !isAdmin) {
        showMessage("Acceso restringido: esta sección está disponible únicamente para administradores de neXsv.");
        return;
    }

    const { data: request, error } = await AdminService.getIncorporationRequestById(requestId);

    if (error || !request) {
        console.error("Error al cargar solicitud:", error);
        showMessage("No fue posible cargar la solicitud seleccionada.");
        return;
    }

    const business = request.businesses || {};

    setText("businessName", business.nombre);
    setText("businessCategory", business.categoria);
    setText("description", business.descripcion);
    setText("offer", business.tipo_oferta);
    setText("stage", business.etapa_negocio);
    setText("department", business.departamento);
    setText("municipality", business.municipio);
    setText("whatsapp", business.whatsapp);
    setText("email", business.email);
    setText("website", business.sitio_web);
    setText("maps", business.google_maps_url);
    setText("instagram", business.instagram);
    setText("facebook", business.facebook);
    setText("tiktok", business.tiktok);
    setText("otherSocial", business.otra_red_social);
    setText("createdAt", formatDate(request.created_at));
    setText("observations", request.observaciones);

    const status = document.getElementById("requestStatus");
    status.textContent = statusLabel(request.estado);
    status.className = `status ${statusClass(request.estado)}`;

    content.hidden = false;
}

document.addEventListener("DOMContentLoaded", loadRequest);
