import AuthSession from "../auth/auth.session.js";
import BusinessService from "../services/business.service.js";
import { APP_CONFIG } from "../core/config.js";

document.addEventListener("DOMContentLoaded", async () => {
    if (!AuthSession.isInitialized()) await AuthSession.initialize();

    if (!AuthSession.isAuthenticated()) {
        window.location.href = APP_CONFIG.routes.login;
        return;
    }

    const user = AuthSession.getCurrentUser();
    renderOwner(user);

    const { data: businesses, error } = await BusinessService.getBusinessesByOwner(user.id);

    if (error) {
        console.error("Error al cargar negocios:", error);
        renderError();
        return;
    }

    renderSummary(businesses);
    renderBusinesses(businesses);
});

function renderOwner(user) {
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || "Miembro";
    const firstName = fullName.trim().split(" ")[0] || "Miembro";
    setText("businessOwnerName", fullName);
    setText("welcomeTitle", `¡Bienvenida, ${firstName}!`);
}

function renderSummary(businesses) {
    const total = businesses.length;
    const active = businesses.filter(b => normalize(b.estado) === "activo").length;
    const pending = businesses.filter(b => normalize(b.estado) !== "activo").length;

    setText("businessTotal", total);
    setText("businessActive", active);
    setText("businessPending", pending);
}

function renderBusinesses(businesses) {
    const container = document.getElementById("businessList");
    if (!container) return;

    if (!businesses.length) {
        container.innerHTML = `
            <div class="business-empty-state">
                <i class="fa-solid fa-store"></i>
                <strong>Aún no tienes un negocio registrado</strong>
                <span>Incorpora tu primer negocio para comenzar.</span>
                <a href="incorporar-negocio.html" class="business-primary-btn">Incorporar negocio</a>
            </div>`;
        return;
    }

    container.innerHTML = businesses.map(businessCard).join("");
}

function businessCard(business) {
    const status = normalize(business.estado);
    const isActive = status === "activo";
    const isCorrection = status === "correccion";
    const statusLabel = isActive ? "Publicado" : isCorrection ? "Requiere corrección" : "En proceso";
    const statusClass = isActive ? "active" : isCorrection ? "correction" : "pending";
    const location = [business.municipio, business.departamento].filter(Boolean).join(", ") || "Ubicación pendiente";
    const expiration = business.fecha_vencimiento ? formatDate(business.fecha_vencimiento) : "Pendiente";

    return `
        <article class="business-item-card">
            <div class="business-item-main">
                <div class="business-item-logo">${business.logo ? `<img src="${escapeAttr(business.logo)}" alt="${escapeAttr(business.nombre || "Negocio")}">` : `<i class="fa-solid fa-store"></i>`}</div>
                <div class="business-item-info">
                    <div class="business-item-heading">
                        <div><h3>${escapeHtml(business.nombre || "Mi negocio")}</h3><span>${escapeHtml(business.categoria || "Negocio")}</span></div>
                        <span class="business-status ${statusClass}"><i class="fa-solid fa-circle"></i>${statusLabel}</span>
                    </div>
                    <p><i class="fa-solid fa-location-dot"></i> ${escapeHtml(location)}</p>
                    ${isActive ? `<small class="business-validity"><i class="fa-regular fa-calendar"></i> Vigencia hasta ${expiration}</small>` : ""}
                </div>
            </div>
            <div class="business-item-actions">
                <a href="#" class="business-outline-btn">Editar información</a>
                ${isActive ? `<a href="#comunidad" class="business-primary-small">Ver tarjeta de negocio <i class="fa-solid fa-arrow-right"></i></a>` : `<span class="business-process-note">La publicación estará disponible al completar el proceso.</span>`}
            </div>
        </article>`;
}

function renderError() {
    setText("businessTotal", "—");
    setText("businessActive", "—");
    setText("businessPending", "—");
    const container = document.getElementById("businessList");
    if (container) container.innerHTML = `<div class="business-empty-state"><i class="fa-solid fa-triangle-exclamation"></i><strong>No pudimos cargar tus negocios</strong><span>Intenta nuevamente en unos momentos.</span></div>`;
}

function normalize(value) {
    return String(value || "").trim().toLowerCase();
}

function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Pendiente";
    return new Intl.DateTimeFormat("es-SV", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function escapeAttr(value) {
    return escapeHtml(value);
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}
