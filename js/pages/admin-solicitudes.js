import AuthSession from "../auth/auth.session.js";
import AdminService from "../services/admin.service.js";

const body = document.getElementById("requestsBody");
const message = document.getElementById("adminMessage");

const statusLabel = {
    PENDIENTE: "Pendiente",
    CORRECCION: "En corrección",
    APROBADA: "Aprobada"
};

function showMessage(text) {
    message.textContent = text;
    message.hidden = false;
}

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function renderRequests(requests) {
    const pending = requests.filter(r => r.estado === "PENDIENTE").length;
    const correction = requests.filter(r => r.estado === "CORRECCION").length;
    const approved = requests.filter(r => r.estado === "APROBADA").length;

    document.getElementById("statPending").textContent = pending;
    document.getElementById("statCorrection").textContent = correction;
    document.getElementById("statApproved").textContent = approved;
    document.getElementById("requestCount").textContent = `${requests.length} solicitud${requests.length === 1 ? "" : "es"}`;

    if (!requests.length) {
        body.innerHTML = `<tr><td colspan="5" class="empty-state">No hay solicitudes registradas.</td></tr>`;
        return;
    }

    body.innerHTML = requests.map(request => {
        const business = request.businesses || {};
        const statusClass = request.estado === "APROBADA"
            ? "approved"
            : request.estado === "CORRECCION"
                ? "correction"
                : "pending";
        const date = request.created_at
            ? new Date(request.created_at).toLocaleDateString("es-SV")
            : "—";

        return `
            <tr>
                <td>
                    <strong>${escapeHtml(business.nombre || "Sin nombre")}</strong><br>
                    <small>${escapeHtml(business.categoria || "Sin categoría")}</small>
                </td>
                <td>
                    ${escapeHtml(business.departamento || "Sin departamento")}<br>
                    <small>${escapeHtml(business.municipio || "Sin municipio")}</small>
                </td>
                <td><span class="status ${statusClass}">${escapeHtml(statusLabel[request.estado] || request.estado || "Sin estado")}</span></td>
                <td>${date}</td>
                <td><button class="view-btn" data-request-id="${escapeHtml(request.id)}">Revisar</button></td>
            </tr>
        `;
    }).join("");

    body.querySelectorAll(".view-btn").forEach(button => {
        button.addEventListener("click", () => {
            const requestId = button.dataset.requestId;
            if (requestId) {
                window.location.href = `admin-revisar.html?id=${encodeURIComponent(requestId)}`;
            }
        });
    });
}

async function loadRequests() {
    body.innerHTML = `<tr><td colspan="5" class="empty-state">Cargando solicitudes...</td></tr>`;
    message.hidden = true;

    const { data, error } = await AdminService.getIncorporationRequests();

    if (error) {
        console.error("Error al cargar solicitudes:", error);
        showMessage("No fue posible cargar las solicitudes. Verifica que tu usuario tenga permisos administrativos.");
        body.innerHTML = `<tr><td colspan="5" class="empty-state">No se pudieron cargar las solicitudes.</td></tr>`;
        return;
    }

    renderRequests(data);
}

document.addEventListener("DOMContentLoaded", async () => {
    if (!AuthSession.isInitialized()) {
        await AuthSession.initialize();
    }

    if (!AuthSession.isAuthenticated()) {
        window.location.href = "/acceso/login-usuario.html";
        return;
    }

    const user = AuthSession.getCurrentUser();
    const { isAdmin, error } = await AdminService.isAdmin(user.id);

    if (error || !isAdmin) {
        showMessage("Acceso restringido: esta sección está disponible únicamente para administradores de neXsv.");
        body.innerHTML = `<tr><td colspan="5" class="empty-state">No tienes permisos para consultar solicitudes.</td></tr>`;
        return;
    }

    await loadRequests();
});

document.getElementById("btnRefresh")?.addEventListener("click", loadRequests);
