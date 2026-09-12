import AuthSession from "../auth/auth.session.js";
import AdminService from "../services/admin.service.js";
import PaymentService from "../services/payment.service.js";

const paymentSection = document.getElementById("paymentSection");
const manualPaymentFormWrapper = document.getElementById("manualPaymentFormWrapper");
const manualPaymentForm = document.getElementById("manualPaymentForm");
const paymentDetails = document.getElementById("paymentDetails");
const paymentAction = document.getElementById("paymentAction");
const paymentActive = document.getElementById("paymentActive");
const btnRegisterPayment = document.getElementById("btnRegisterPayment");
const btnVerifyAndActivate = document.getElementById("btnVerifyAndActivate");
const message = document.getElementById("adminMessage");

let requestId = null;
let businessId = null;
let paymentId = null;

function showMessage(text) {
    if (!message) return;
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

function setLocalPaymentDate() {
    const input = document.getElementById("paymentDateInput");
    if (!input || input.value) return;

    const now = new Date();
    const offset = now.getTimezoneOffset();
    input.value = new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function showRegisteredPayment(payment, business = {}) {
    paymentSection.hidden = false;
    manualPaymentFormWrapper.hidden = true;
    paymentDetails.hidden = false;
    paymentAction.hidden = payment.status !== "PENDIENTE";
    paymentActive.hidden = payment.status !== "VERIFICADO" && business.estado !== "ACTIVO";

    paymentId = payment.id;

    setText("paymentStatus", payment.status);
    setText("paymentAmount", payment.amount != null ? `$${Number(payment.amount).toFixed(2)} ${payment.currency || "USD"}` : "—");
    setText("paymentMethod", payment.method);
    setText("paymentReference", payment.reference);
    setText("paymentPaidAt", formatDate(payment.paid_at));
    setText("paymentProvider", payment.provider);

    if (payment.status === "VERIFICADO" || business.estado === "ACTIVO") {
        setText("activationDate", business.fecha_activacion ? formatDate(business.fecha_activacion) : "—");
        setText("expirationDate", business.fecha_vencimiento ? formatDate(business.fecha_vencimiento) : "—");
    }
}

function showForm() {
    paymentSection.hidden = false;
    manualPaymentFormWrapper.hidden = false;
    paymentDetails.hidden = true;
    paymentAction.hidden = true;
    paymentActive.hidden = true;
    setLocalPaymentDate();
}

async function load() {
    requestId = new URLSearchParams(window.location.search).get("id");
    if (!requestId) return;

    if (!AuthSession.isInitialized()) await AuthSession.initialize();
    if (!AuthSession.isAuthenticated()) return;

    const user = AuthSession.getCurrentUser();
    const { isAdmin, error: adminError } = await AdminService.isAdmin(user.id);
    if (adminError || !isAdmin) return;

    const { data: request, error: requestError } = await AdminService.getIncorporationRequestById(requestId);
    if (requestError || !request) return;

    businessId = request.business_id || request.businesses?.id;

    // El registro manual solo aparece después de aprobar la solicitud.
    if (request.estado !== "APROBADA" || !businessId) return;

    const { data: payments, error } = await PaymentService.getPaymentsByBusiness(businessId);
    if (error) {
        console.error("Error al consultar pagos:", error);
        showMessage("No fue posible consultar el estado del pago.");
        return;
    }

    const payment = (payments || []).find(item => item.request_id === requestId);

    if (payment) {
        showRegisteredPayment(payment, request.businesses || {});
    } else {
        showForm();
    }
}

manualPaymentForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!requestId || !businessId) return;

    const method = document.getElementById("paymentMethodInput")?.value;
    const amount = Number(document.getElementById("paymentAmountInput")?.value);
    const reference = document.getElementById("paymentReferenceInput")?.value.trim() || null;
    const paymentDate = document.getElementById("paymentDateInput")?.value;
    const notes = document.getElementById("paymentNotesInput")?.value.trim() || null;

    if (!Number.isFinite(amount) || amount <= 0) {
        showMessage("Ingresa un monto válido mayor que cero.");
        return;
    }

    if (!paymentDate) {
        showMessage("Selecciona la fecha en que recibiste el pago.");
        return;
    }

    btnRegisterPayment.disabled = true;

    const { data, error } = await PaymentService.registerManualPayment({
        businessId,
        requestId,
        amount,
        method,
        reference,
        notes,
        paidAt: `${paymentDate}T12:00:00`
    });

    btnRegisterPayment.disabled = false;

    if (error) {
        console.error("Error al registrar pago:", error);
        showMessage(error.message || "No fue posible registrar el pago.");
        return;
    }

    showRegisteredPayment(data, { estado: "PENDIENTE" });
    showMessage("Pago registrado correctamente. Queda pendiente de verificación.");
});

btnVerifyAndActivate?.addEventListener("click", async () => {
    if (!paymentId) return;

    const confirmed = window.confirm("¿Confirmas que el pago fue recibido y verificado? Esta acción activará el negocio por un año.");
    if (!confirmed) return;

    btnVerifyAndActivate.disabled = true;

    const { data, error } = await PaymentService.verifyPaymentAndActivateBusiness(paymentId);

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
    setText("activationDate", result?.fecha_activacion ? formatDate(result.fecha_activacion) : "—");
    setText("expirationDate", result?.fecha_vencimiento ? formatDate(result.fecha_vencimiento) : "—");
    showMessage("Pago verificado y negocio activado correctamente.");
});

document.addEventListener("DOMContentLoaded", load);
