import AuthSession from "../auth/auth.session.js";
import BusinessService from "../services/business.service.js";
import CommunityService from "../services/community.service.js";
import { supabase } from "../core/supabase-client.js";
import { APP_CONFIG } from "../core/config.js";

document.addEventListener("DOMContentLoaded", async () => {
    if (!AuthSession.isInitialized()) await AuthSession.initialize();
    if (!AuthSession.isAuthenticated()) { window.location.href = APP_CONFIG.routes.login; return; }
    const user = AuthSession.getCurrentUser();
    renderOwner(user);
    const { data: businesses, error } = await BusinessService.getBusinessesByOwner(user.id);
    if (error) { console.error("Error al cargar negocios:", error); renderError(); return; }
    renderSummary(businesses);
    renderBusinesses(businesses);
    await loadBusinessPublications(user.id);
    await loadCommunityPublications(user.id);
});

function renderOwner(user) {
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || "Miembro";
    const firstName = fullName.trim().split(" ")[0] || "Miembro";
    setText("businessOwnerName", fullName);
    setText("welcomeTitle", `¡Hola, ${firstName}!`);
}
function renderSummary(businesses) {
    setText("businessTotal", businesses.length);
    setText("businessReviewsSummary", "—");
}

async function loadBusinessPublications(ownerId) {
    const slider = document.getElementById("businessPublications");
    const empty = document.getElementById("businessPublicationsEmpty");
    if (!slider) return;
    const result = await CommunityService.getPublications({ type: "TODAS", limit: 30, authorId: ownerId });
    if (result.error) { slider.innerHTML = `<div class="business-empty-state"><i class="fa-solid fa-triangle-exclamation"></i><strong>No pudimos cargar tus publicaciones</strong><span>Intenta nuevamente en unos momentos.</span></div>`; return; }
    const publications = result.data || [];
    if (!publications.length) { slider.innerHTML = ""; empty?.classList.add("visible"); resetPublicationTotals(); return; }
    empty?.classList.remove("visible");
    slider.innerHTML = publications.map(publicationCard).join("");
    bindPublicationActions();
    await loadPublicationMetrics(publications.map(p => p.id));
}

function publicationCard(publication) {
    const image = publication.images?.[0]?.public_url || "";
    const title = publication.title?.trim() || typeLabel(publication.type);
    const url = `comunidad.html?publicacion=${encodeURIComponent(publication.id)}`;
    return `<article class="business-publication-card" data-publication-id="${escapeAttr(publication.id)}">
        <div class="business-publication-media">${image ? `<img src="${escapeAttr(image)}" alt="Imagen de la publicación">` : `<div class="business-publication-no-image"><i class="fa-solid fa-bullhorn"></i></div>`}</div>
        <div class="business-publication-content">
            <span class="business-publication-type">${escapeHtml(typeLabel(publication.type))}</span>
            <h3>${escapeHtml(title)}</h3>
            <p class="business-publication-body">${escapeHtml(publication.body || "")}</p>
            <span class="business-publication-date">${escapeHtml(formatDate(publication.created_at))}</span>
            <div class="business-publication-metrics">
                <div class="business-publication-metric"><i class="fa-regular fa-eye"></i><strong data-publication-metric="views">0</strong><span>Vistas</span></div>
                <div class="business-publication-metric"><i class="fa-regular fa-comments"></i><strong data-publication-metric="comments">0</strong><span>Comentarios</span></div>
                <div class="business-publication-metric"><i class="fa-regular fa-comment"></i><strong data-publication-metric="conversations">0</strong><span>Conversaciones</span></div>
            </div>
            <div class="business-publication-actions">
                <a class="business-view-publication" href="${url}">Ver publicación <i class="fa-solid fa-arrow-right"></i></a>
                <button class="business-share-publication" type="button" data-share-url="${escapeAttr(new URL(url, window.location.href).href)}"><i class="fa-solid fa-arrow-up-from-bracket"></i> Compartir</button>
            </div>
        </div>
    </article>`;
}

async function loadCommunityPublications(ownerId) {
    const slider = document.getElementById("communityPublications");
    const empty = document.getElementById("communityPublicationsEmpty");
    if (!slider) return;
    const result = await CommunityService.getPublications({ type: "TODAS", limit: 8, excludeAuthorId: ownerId });
    if (result.error) { slider.innerHTML = `<div class="business-empty-state"><i class="fa-solid fa-triangle-exclamation"></i><strong>No pudimos cargar la comunidad</strong><span>Intenta nuevamente en unos momentos.</span></div>`; return; }
    const publications = result.data || [];
    if (!publications.length) { slider.innerHTML = ""; empty?.classList.add("visible"); return; }
    empty?.classList.remove("visible");
    slider.innerHTML = publications.map(communityPublicationCard).join("");
}

function communityPublicationCard(publication) {
    const image = publication.images?.[0]?.public_url || "";
    const title = publication.title?.trim() || typeLabel(publication.type);
    const url = `comunidad.html?publicacion=${encodeURIComponent(publication.id)}`;
    return `<article class="business-publication-card business-community-publication-card">
        <div class="business-publication-media">${image ? `<img src="${escapeAttr(image)}" alt="Imagen de la publicación">` : `<div class="business-publication-no-image"><i class="fa-solid fa-users"></i></div>`}</div>
        <div class="business-publication-content">
            <span class="business-publication-type">${escapeHtml(typeLabel(publication.type))}</span>
            <h3>${escapeHtml(title)}</h3>
            <p class="business-publication-body">${escapeHtml(publication.body || "")}</p>
            <span class="business-publication-date">${escapeHtml(formatDate(publication.created_at))}</span>
            <div class="business-publication-actions"><a class="business-view-publication" href="${url}">Ver publicación <i class="fa-solid fa-arrow-right"></i></a></div>
        </div>
    </article>`;
}

async function loadPublicationMetrics(publicationIds) {
    const { data, error } = await supabase.rpc("get_my_community_publication_metrics");
    if (error) { console.warn("No se pudieron cargar las métricas de publicaciones:", error); return; }
    const selected = new Set(publicationIds);
    const metrics = (data || []).filter(item => selected.has(item.publication_id));
    const totals = metrics.reduce((a, item) => ({ views: a.views + Number(item.views || 0), comments: a.comments + Number(item.comments || 0), conversations: a.conversations + Number(item.conversations || 0) }), { views: 0, comments: 0, conversations: 0 });
    metrics.forEach(item => {
        const card = document.querySelector(`[data-publication-id="${CSS.escape(item.publication_id)}"]`);
        if (!card) return;
        setMetric(card, "views", item.views); setMetric(card, "comments", item.comments); setMetric(card, "conversations", item.conversations);
    });
    setText("businessViews", totals.views); setText("businessViewsSummary", totals.views);
    setText("businessComments", totals.comments);
    setText("businessConversations", totals.conversations); setText("businessConversationsSummary", totals.conversations); setText("businessConversationsOpportunity", totals.conversations);
    setText("businessInterests", "—"); setText("businessInterestsResult", "—");
    await loadMessageTotal(publicationIds);
}

async function loadMessageTotal(publicationIds) {
    if (!publicationIds.length) { setText("businessMessages", 0); return; }
    const { data: conversations, error: conversationError } = await supabase.from("conversations").select("id").in("origin_publication_id", publicationIds);
    if (conversationError) { setText("businessMessages", "—"); console.warn("No se pudo calcular el total de mensajes:", conversationError); return; }
    if (!conversations?.length) { setText("businessMessages", 0); return; }
    const { data: messages, error: messageError } = await supabase.from("messages").select("id").in("conversation_id", conversations.map(c => c.id));
    if (messageError) { setText("businessMessages", "—"); console.warn("No se pudo calcular el total de mensajes:", messageError); return; }
    setText("businessMessages", messages?.length || 0);
}

function bindPublicationActions() {
    document.querySelectorAll(".business-share-publication").forEach(button => button.addEventListener("click", async () => {
        const url = button.dataset.shareUrl;
        try {
            if (navigator.share) { await navigator.share({ title: "Publicación en neXsv", url }); return; }
            await navigator.clipboard.writeText(url);
            const original = button.innerHTML; button.innerHTML = `<i class="fa-solid fa-check"></i> Enlace copiado`;
            setTimeout(() => { button.innerHTML = original; }, 1800);
        } catch (error) { if (error?.name !== "AbortError") console.warn("No se pudo compartir la publicación:", error); }
    }));
}
function resetPublicationTotals() { setText("businessViews", 0); setText("businessViewsSummary", 0); setText("businessComments", 0); setText("businessConversations", 0); setText("businessConversationsSummary", 0); setText("businessConversationsOpportunity", 0); setText("businessMessages", 0); setText("businessInterests", "—"); setText("businessInterestsResult", "—"); }
function setMetric(card, metric, value) { card.querySelector(`[data-publication-metric="${metric}"]`)?.replaceChildren(document.createTextNode(String(Number(value || 0)))); }

function renderBusinesses(businesses) {
    const container = document.getElementById("businessList");
    const toggle = document.getElementById("businessListToggle");
    if (!container) return;
    if (!businesses.length) { container.innerHTML = `<div class="business-empty-state"><i class="fa-solid fa-store"></i><strong>Aún no tienes un negocio registrado</strong><span>Incorpora tu primer negocio para comenzar.</span><a href="incorporar-negocio.html" class="business-primary-btn">Incorporar negocio</a></div>`; if (toggle) toggle.hidden = true; return; }
    container.innerHTML = businesses.map((business, index) => `<div class="business-list-entry ${index > 1 ? "business-list-extra" : ""}">${businessCard(business)}</div>`).join("");
    if (toggle) {
        const extra = businesses.length - 2;
        toggle.hidden = extra <= 0;
        toggle.dataset.expanded = "false";
        toggle.innerHTML = `<span>Ver ${extra} ${extra === 1 ? "negocio más" : "negocios más"}</span><i class="fa-solid fa-chevron-down"></i>`;
        toggle.onclick = () => {
            const expanded = toggle.dataset.expanded === "true";
            document.querySelectorAll(".business-list-extra").forEach(item => item.classList.toggle("visible", !expanded));
            toggle.dataset.expanded = expanded ? "false" : "true";
            toggle.innerHTML = expanded ? `<span>Ver ${extra} ${extra === 1 ? "negocio más" : "negocios más"}</span><i class="fa-solid fa-chevron-down"></i>` : `<span>Mostrar menos</span><i class="fa-solid fa-chevron-up"></i>`;
        };
    }
}
function businessCard(business) {
    const status = normalize(business.estado), isActive = status === "activo", isCorrection = status === "correccion";
    const statusLabel = isActive ? "Publicado" : isCorrection ? "Requiere corrección" : "En proceso";
    const statusClass = isActive ? "active" : isCorrection ? "correction" : "pending";
    const location = [business.municipio, business.departamento].filter(Boolean).join(", ") || "Ubicación pendiente";
    const expiration = business.fecha_vencimiento ? formatDate(business.fecha_vencimiento) : "Pendiente";
    return `<article class="business-item-card"><div class="business-item-main"><div class="business-item-logo">${business.logo ? `<img src="${escapeAttr(business.logo)}" alt="${escapeAttr(business.nombre || "Negocio")}">` : `<i class="fa-solid fa-store"></i>`}</div><div class="business-item-info"><div class="business-item-heading"><div><h3>${escapeHtml(business.nombre || "Mi negocio")}</h3><span>${escapeHtml(business.categoria || "Negocio")}</span></div><span class="business-status ${statusClass}"><i class="fa-solid fa-circle"></i>${statusLabel}</span></div><p><i class="fa-solid fa-location-dot"></i> ${escapeHtml(location)}</p>${isActive ? `<small class="business-validity"><i class="fa-regular fa-calendar"></i> Vigencia hasta ${expiration}</small>` : ""}</div></div><div class="business-item-actions"><a href="#" class="business-outline-btn">Editar información</a>${isActive ? `<a href="#publicaciones" class="business-primary-small">Ver publicaciones <i class="fa-solid fa-arrow-right"></i></a>` : `<span class="business-process-note">La publicación estará disponible al completar el proceso.</span>`}</div></article>`;
}
function renderError() { setText("businessTotal", "—"); setText("businessViewsSummary", "—"); setText("businessConversationsSummary", "—"); const container = document.getElementById("businessList"); if (container) container.innerHTML = `<div class="business-empty-state"><i class="fa-solid fa-triangle-exclamation"></i><strong>No pudimos cargar tus negocios</strong><span>Intenta nuevamente en unos momentos.</span></div>`; }
function typeLabel(type) { const labels = { VENTA: "Venta", SERVICIO: "Servicio", SOLICITUD: "Solicitud", RECOMENDACION: "Recomendación" }; return labels[normalize(type).toUpperCase()] || "Publicación"; }
function normalize(value) { return String(value || "").trim().toLowerCase(); }
function formatDate(value) { const date = new Date(value); if (Number.isNaN(date.getTime())) return "Fecha pendiente"; return new Intl.DateTimeFormat("es-SV", { day: "2-digit", month: "short", year: "numeric" }).format(date); }
function escapeHtml(value) { return String(value).replace(/[&<>\'\"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char])); }
function escapeAttr(value) { return escapeHtml(value); }
function setText(id, value) { const element = document.getElementById(id); if (element) element.textContent = value; }
