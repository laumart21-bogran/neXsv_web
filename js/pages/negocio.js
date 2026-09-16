import BusinessService from "../services/business.service.js";
import AuthService from "../auth/auth.service.js";

const params = new URLSearchParams(window.location.search);
const businessId = params.get("id");
const requestedAction = params.get("action");
let publicBusiness = null;
let fullBusiness = null;

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function normalizeWhatsapp(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    const digits = raw.replace(/\D/g, "");
    return digits ? `https://wa.me/${digits.startsWith("503") ? digits : `503${digits}`}` : "";
}

function firstValue(data, keys) {
    for (const key of keys) {
        const value = data?.[key];
        if (value !== null && value !== undefined && String(value).trim() !== "") return String(value).trim();
    }
    return "";
}

function renderPublicBusiness(data) {
    const container = document.getElementById("contenido");
    if (!container) return;

    const name = escapeHtml(data.nombre || "Negocio");
    const category = escapeHtml(data.categoria || "Negocio");
    const description = escapeHtml(data.descripcion || "Este negocio forma parte de la comunidad neXsv.");
    const logo = String(data.logo || "").trim();

    container.innerHTML = `
        <section class="business-hero-card">
            <div class="business-logo">
                ${logo ? `<img src="${escapeHtml(logo)}" alt="Logo de ${name}">` : `<i class="fa-solid fa-store"></i>`}
            </div>
            <div>
                <span class="category-badge">${category}</span>
                <span class="verified-badge"><i class="fa-solid fa-check"></i> Verificado en neXsv</span>
                <h1>${name}</h1>
                <p>${description}</p>
            </div>
        </section>

        <section class="detail-grid">
            <article class="detail-card">
                <h2>Conoce este negocio</h2>
                <p>${description}</p>
            </article>

            <article class="detail-card">
                <h2>Información de contacto</h2>
                <div class="access-gate">
                    <div class="access-gate-icon"><i class="fa-solid fa-lock"></i></div>
                    <strong>Información exclusiva para miembros</strong>
                    <p>Inicia sesión o crea tu cuenta gratuita para ver WhatsApp, ubicación y datos de contacto.</p>
                    <div class="access-gate-actions">
                        <a class="gate-primary" href="acceso/registro.html?return=${encodeURIComponent(`negocio.html?id=${businessId}`)}">Crear cuenta gratis</a>
                        <a class="gate-secondary" href="acceso/login-usuario.html?return=${encodeURIComponent(`negocio.html?id=${businessId}`)}">Ya tengo cuenta</a>
                    </div>
                </div>
            </article>
        </section>

        <div class="detail-footer-actions">
            <button type="button" id="shareBusiness" class="share-btn"><i class="fa-solid fa-share-nodes"></i> Compartir</button>
            <a href="negocios.html" class="back-btn"><i class="fa-solid fa-arrow-left"></i> Volver a negocios</a>
        </div>
    `;

    document.getElementById("shareBusiness")?.addEventListener("click", shareBusiness);
}

function renderAuthenticatedBusiness(data) {
    const container = document.getElementById("contenido");
    if (!container) return;

    const name = escapeHtml(data.nombre || "Negocio");
    const category = escapeHtml(data.categoria || "Negocio");
    const description = escapeHtml(data.descripcion || "Este negocio forma parte de la comunidad neXsv.");
    const logo = String(data.logo || "").trim();
    const whatsapp = normalizeWhatsapp(data.whatsapp);
    const maps = firstValue(data, ["google_maps_url", "maps_url", "ubicacion_url"]);
    const email = firstValue(data, ["email"]);
    const website = firstValue(data, ["sitio_web", "website"]);
    const instagram = firstValue(data, ["instagram"]);
    const facebook = firstValue(data, ["facebook"]);
    const tiktok = firstValue(data, ["tiktok"]);
    const otherSocial = firstValue(data, ["otra_red_social"]);
    const departamento = firstValue(data, ["departamento"]);
    const municipio = firstValue(data, ["municipio"]);
    const typeOffer = firstValue(data, ["tipo_oferta"]);
    const stage = firstValue(data, ["etapa_negocio"]);

    const contactItems = [
        whatsapp ? `<a class="detail-action whatsapp" href="${escapeHtml(whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>` : "",
        email ? `<a class="detail-action" href="mailto:${escapeHtml(email)}">Correo</a>` : "",
        website ? `<a class="detail-action" href="${escapeHtml(website)}" target="_blank" rel="noopener">Sitio web</a>` : "",
        maps ? `<a class="detail-action" href="${escapeHtml(maps)}" target="_blank" rel="noopener">Cómo llegar</a>` : ""
    ].filter(Boolean).join("");

    const socialItems = [instagram, facebook, tiktok, otherSocial]
        .filter(Boolean)
        .map(url => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(url)}</a>`)
        .join("");

    const metaItems = [
        departamento || municipio ? `<div><strong>Ubicación</strong><span>${escapeHtml([municipio, departamento].filter(Boolean).join(", "))}</span></div>` : "",
        typeOffer ? `<div><strong>Oferta</strong><span>${escapeHtml(typeOffer)}</span></div>` : "",
        stage ? `<div><strong>Etapa</strong><span>${escapeHtml(stage)}</span></div>` : ""
    ].filter(Boolean).join("");

    container.innerHTML = `
        <section class="business-hero-card">
            <div class="business-logo">
                ${logo ? `<img src="${escapeHtml(logo)}" alt="Logo de ${name}">` : `<i class="fa-solid fa-store"></i>`}
            </div>
            <div>
                <span class="category-badge">${category}</span>
                <span class="verified-badge"><i class="fa-solid fa-check"></i> Verificado en neXsv</span>
                <h1>${name}</h1>
                <p>${description}</p>
            </div>
        </section>

        <section class="detail-grid">
            <article class="detail-card">
                <h2>Conoce este negocio</h2>
                <p>${description}</p>
                ${metaItems ? `<div class="meta-grid">${metaItems}</div>` : ""}
            </article>

            <article class="detail-card">
                <h2>Contacto</h2>
                <div class="contact-actions">${contactItems || `<p class="muted">Este negocio aún no ha publicado datos de contacto.</p>`}</div>
                ${socialItems ? `<div class="social-list">${socialItems}</div>` : ""}
            </article>
        </section>

        <div class="detail-footer-actions">
            <button type="button" id="shareBusiness" class="share-btn"><i class="fa-solid fa-share-nodes"></i> Compartir</button>
            <a href="negocios.html" class="back-btn"><i class="fa-solid fa-arrow-left"></i> Volver a negocios</a>
        </div>
    `;

    document.getElementById("shareBusiness")?.addEventListener("click", shareBusiness);

    if (requestedAction === "whatsapp" && whatsapp) window.open(whatsapp, "_blank", "noopener");
    if (requestedAction === "location" && maps) window.open(maps, "_blank", "noopener");
}

async function shareBusiness() {
    const shareData = {
        title: document.title,
        text: "Conoce este negocio en neXsv",
        url: window.location.href.split("&action=")[0]
    };
    if (navigator.share) {
        try { await navigator.share(shareData); } catch (_) {}
        return;
    }
    try {
        await navigator.clipboard.writeText(shareData.url);
        alert("Enlace copiado.");
    } catch (_) {
        window.prompt("Copia este enlace:", shareData.url);
    }
}

async function loadAuthenticatedDetails() {
    const { data, error } = await BusinessService.getAuthenticatedBusinessDetail(businessId);
    if (error || !data) {
        console.error("Error cargando detalle del negocio:", error);
        return;
    }
    fullBusiness = data;
    renderAuthenticatedBusiness(data);
}

async function init() {
    const container = document.getElementById("contenido");
    if (!container) return;

    if (!businessId) {
        container.innerHTML = `<div class="state-card"><strong>Negocio no especificado.</strong><a href="negocios.html">Volver al directorio</a></div>`;
        return;
    }

    // Carga inmediata del contenido público: no esperamos a Supabase Auth.
    const { data, error } = await BusinessService.getPublicBusinessDirectory();
    if (error) {
        console.error("Error cargando directorio público:", error);
        container.innerHTML = `<div class="state-card"><strong>No fue posible cargar este negocio.</strong><a href="negocios.html">Volver al directorio</a></div>`;
        return;
    }

    publicBusiness = (data || []).find(item => item.id === businessId);
    if (!publicBusiness) {
        container.innerHTML = `<div class="state-card"><strong>Este negocio no está disponible.</strong><a href="negocios.html">Volver al directorio</a></div>`;
        return;
    }

    renderPublicBusiness(publicBusiness);

    // La comprobación de sesión ocurre después de pintar la página.
    const { data: sessionData } = await AuthService.getSession();
    if (sessionData?.session) {
        await loadAuthenticatedDetails();
    }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
else init();
