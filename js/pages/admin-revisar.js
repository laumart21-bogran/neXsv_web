import AuthSession from "../auth/auth.session.js";
import AdminService from "../services/admin.service.js";
import PaymentService from "../services/payment.service.js";

const content = document.getElementById("requestContent");
const message = document.getElementById("adminMessage");
const actions = document.getElementById("reviewActions");
const correctionPanel = document.getElementById("correctionPanel");
const correctionObservation = document.getElementById("correctionObservation");
const btnCorrection = document.getElementById("btnCorrection");
const btnApproveReview = document.getElementById("btnApproveReview");
const btnCancelCorrection = document.getElementById("btnCancelCorrection");
const btnSendCorrection = document.getElementById("btnSendCorrection");
const paymentSection = document.getElementById("paymentSection");
const paymentAction = document.getElementById("paymentAction");
const paymentActive = document.getElementById("paymentActive");
const btnVerifyAndActivate = document.getElementById("btnVerifyAndActivate");

let currentRequestId = null;
let currentAdminId = null;
let currentStatus = null;
let currentBusinessId = null;
let currentPaymentId = null;

function showMessage(text) {
    message.textContent = text;
    message.hidden = false;
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value || "—";
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

function setActionState(status) {
    currentStatus = status;

    // Las acciones administrativas solo están disponibles
    // cuando la solicitud está pendiente de revisión.
    const canReview = status === "PENDIENTE";

    actions.hidden = !canReview;
    correctionPanel.hidden = true;
}

function updateStatusUI(status) {
    const element = document.getElementById("requestStatus");
    element.textContent = statusLabel(status);
    element.className = `status ${statusClass(status)}`;
    setActionState(status);
}

function resetPaymentUI() {
    paymentSection.hidden = true;
    paymentAction.hidden = true;
    paymentActive.hidden = true;
    currentPaymentId = null;
}

function showPayment(payment, business) {
    paymentSection.hidden = false;
    setText("paymentStatus", payment.status);
    setText("paymentAmount", payment.amount != null ? `$${Number(payment.amount).toFixed(2)} ${payment.currency || "USD"}` : "—");
    setText("paymentMethod", payment.method);
    setText("paymentReference", payment.reference);
    setText("paymentPaidAt", formatDate(payment.paid_at));
    setText("paymentProvider", payment.provider);

    currentPaymentId = payment.id;

    const isActive = business.estado === "ACTIVO" || payment.status === "VERIFICADO";
    paymentAction.hidden = !(!isActive && payment.status === "PENDIENTE");
    paymentActive.hidden = !isActive;

    if (isActive) {
        setText("activationDate", business.fecha_activacion ? formatDate(business.fecha_activacion) : "—");
        setText("expirationDate", business.fecha_vencimiento ? formatDate(business.fecha_vencimiento) : "—");
    }
}

async function loadPayment(businessId, requestId, business) {
    resetPaymentUI();

    if (!businessId || !requestId) return;

    const { data: payments, error } = await PaymentService.getPaymentsByBusiness(businessId);

    if (error) {
        console.error("Error al cargar pagos:", error);
        return;
    }

    const payment = (payments || []).find(item => item.request_id === requestId);

    if (payment) {
        showPayment(payment, business);
    }
}

async function loadRequest() {
    const requestId = new URLSearchParams(window.location.search).get("id");

    if (!requestId) {
        showMessage("No se indicó una solicitud para revisar.");
        return;
    }

    currentRequestId = requestId;

    if (!AuthSession.isInitialized()) await AuthSession.initialize();

    if (!AuthSession.isAuthenticated()) {
        window.location.href = "/acceso/login-usuario.html";
        return;
    }

    const user = AuthSession.getCurrentUser();
    currentAdminId = user.id;

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
    currentBusinessId = business.id || request.business_id;

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

    updateStatusUI(request.estado);
    content.hidden = false;

    await loadPayment(currentBusinessId, currentRequestId, business);
}

btnCorrection?.addEventListener("click", () => {
    if (currentStatus !== "PENDIENTE") return;

    correctionPanel.hidden = false;
    correctionObservation.focus();
});

btnCancelCorrection?.addEventListener("click", () => {
    correctionPanel.hidden = true;
    correctionObservation.value = "";
});

btnSendCorrection?.addEventListener("click", async () => {
    if (currentStatus !== "PENDIENTE") return;

    const observation = correctionObservation.value.trim();

    if (!observation) {
        showMessage("Escribe qué debe corregir el negocio antes de enviar la solicitud.");
        correctionObservation.focus();
        return;
    }

    btnSendCorrection.disabled = true;
    const { data, error } = await AdminService.updateRequestStatus(
        currentRequestId,
        "CORRECCION",
        observation,
        currentAdminId
    );
    btnSendCorrection.disabled = false;

    if (error) {
        console.error("Error al solicitar corrección:", error);
        showMessage("No fue posible solicitar la corrección. Verifica los permisos administrativos.");
        return;
    }

    updateStatusUI(data.estado);
    setText("observations", data.observaciones);
    correctionObservation.value = "";
    showMessage("La solicitud quedó en corrección y la observación fue guardada.");
});

btnApproveReview?.addEventListener("click", async () => {
    if (currentStatus !== "PENDIENTE") return;

    const confirmed = window.confirm(
        "¿Confirmas que la solicitud está completa y puede pasar a la siguiente etapa?"
    );

    if (!confirmed) return;

    btnApproveReview.disabled = true;
    const { data, error } = await AdminService.updateRequestStatus(
        currentRequestId,
        "APROBADA",
        null,
        currentAdminId
    );
    btnApproveReview.disabled = false;

    if (error) {
        console.error("Error al aprobar revisión:", error);
        showMessage("No fue posible aprobar la revisión. Verifica los permisos administrativos.");
        return;
    }

    updateStatusUI(data.estado);
    setText("observations", data.observaciones);
    showMessage("Revisión aprobada. La solicitud puede continuar a la siguiente etapa del proceso.");

    // Si existe un pago asociado a esta solicitud, mostrarlo inmediatamente.
    const { data: businessData, error: businessError } = await AdminService.getBusinessById(currentBusinessId);
    if (!businessError && businessData) {
        await loadPayment(currentBusinessId, currentRequestId, businessData);
    }
});

btnVerifyAndActivate?.addEventListener("click", async () => {
    if (!currentPaymentId) return;

    const confirmed = window.confirm(
        "¿Confirmas que el pago fue recibido y verificado? Esta acción activará el negocio por un año."
    );

    if (!confirmed) return;

    btnVerifyAndActivate.disabled = true;

    const { data, error } = await PaymentService.verifyPaymentAndActivateBusiness(currentPaymentId);

    btnVerifyAndActivate.disabled = false;

    if (error) {
        console.error("Error al verificar pago y activar negocio:", error);
        showMessage(error.message || "No fue posible verificar el pago y activar el negocio.");
        return;
    }

    const result = Array.isArray(data) ? data[0] : data;

    paymentAction.hidden = true;
    paymentActive.hidden = false;
    setText("paymentStatus", "VERIFICADO");
    setText("activationDate", result?.fecha_activacion ? formatDate(result.fecha_activacion) : new Date().toLocaleString("es-SV"));
    setText("expirationDate", result?.fecha_vencimiento ? formatDate(result.fecha_vencimiento) : "—");
    showMessage("Pago verificado y negocio activado correctamente.");
});

document.addEventListener("DOMContentLoaded", loadRequest);
