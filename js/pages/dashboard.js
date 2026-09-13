import AuthSession from "../auth/auth.session.js";
import ProfileService from "../services/profile.service.js";
import BusinessService from "../services/business.service.js";
import CommunityService from "../services/community.service.js";
import { supabase } from "../core/supabase-client.js";
import { APP_CONFIG } from "../core/config.js";

let currentUser = null;
let dashboardChannel = null;

const TYPE_LABELS = { VENTA: "Vendo", INTERCAMBIO: "Intercambio", BUSCO: "Busco", REGALO: "Regalo", RECOMENDACION: "Recomiendo", OFERTA: "Ofrezco", EVENTO: "Evento" };

function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function initials(name = "Miembro") { return String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join("") || "M"; }
function formatDate(value) { const date = new Date(value); if (Number.isNaN(date.getTime())) return ""; return new Intl.DateTimeFormat("es-SV", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date); }
function setText(id, value) { const element = document.getElementById(id); if (element) element.textContent = value ?? ""; }

function renderAvatar(photo, nombre) {
    const pairs = [["topAvatarImage", "topAvatarInitials"], ["sidebarAvatarImage", "sidebarAvatarInitials"]];
    pairs.forEach(([imageId, initialsId]) => {
        const image = document.getElementById(imageId);
        const fallback = document.getElementById(initialsId);
        if (photo) { if (image) { image.src = photo; image.style.display = "block"; } if (fallback) fallback.style.display = "none"; }
        else { if (image) image.style.display = "none"; if (fallback) { fallback.textContent = initials(nombre); fallback.style.display = "block"; } }
    });
}

function initializeMoreMenu() {
    const toggle = document.querySelector(".menu-more-toggle");
    const menu = document.getElementById("memberMoreMenu");
    const label = toggle?.querySelector("span");
    if (!toggle || !menu) return;
    toggle.addEventListener("click", () => {
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!expanded));
        menu.hidden = expanded;
        if (label) label.textContent = expanded ? "Ver más" : "Ver menos";
        const icon = toggle.querySelector("i");
        if (icon) { icon.classList.toggle("fa-chevron-down", expanded); icon.classList.toggle("fa-chevron-up", !expanded); }
    });
}

function initializeNotificationPopover() {
    const button = document.getElementById("notificationBtn");
    const popover = document.getElementById("notificationPopover");
    if (!button || !popover) return;
    button.addEventListener("click", event => { event.stopPropagation(); popover.hidden = !popover.hidden; });
    popover.addEventListener("click", event => event.stopPropagation());
    document.addEventListener("click", () => { popover.hidden = true; });
}

async function refreshUnreadCount() {
    const { data, error } = await supabase.rpc("get_my_unread_message_count");
    if (error) { console.warn("No se pudo actualizar el contador de mensajes:", error); return 0; }
    const count = Number(data || 0);
    const badge = document.getElementById("messageBadge");
    const notificationBadge = document.getElementById("notificationBadge");
    [badge, notificationBadge].forEach(element => { if (!element) return; element.textContent = count > 99 ? "99+" : String(count); element.hidden = count === 0; });
    setText("unreadCount", count);
    setText("notificationSummary", count ? `Tienes ${count} mensaje${count === 1 ? "" : "s"} sin leer.` : "No tienes mensajes nuevos.");
    return count;
}

function subscribeDashboardRealtime() {
    if (dashboardChannel) supabase.removeChannel(dashboardChannel);
    dashboardChannel = supabase.channel(`dashboard-${currentUser.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async () => { await refreshUnreadCount(); })
        .subscribe();
}

function businessCard(business) {
    const status = String(business.estado || "").toUpperCase();
    const label = status === "ACTIVO" ? "Publicado" : status === "PENDIENTE" ? "En proceso" : (business.estado || "En proceso");
    return `<article class="business-slide"><div class="business-slide-icon"><i class="fa-solid fa-store"></i></div><div class="business-slide-info"><span class="business-slide-status">${escapeHtml(label)}</span><strong>${escapeHtml(business.nombre || "Mi negocio")}</strong><small>${escapeHtml(business.categoria || "Negocio")}${business.municipio ? ` · ${escapeHtml(business.municipio)}` : ""}</small></div><a href="dashboard-negocio.html" class="business-slide-link">Administrar <i class="fa-solid fa-arrow-right"></i></a></article>`;
}

async function loadBusinesses() {
    const slider = document.getElementById("businessSlider");
    if (!slider) return;
    const { data, error } = await BusinessService.getBusinessesByOwner(currentUser.id);
    if (error) { slider.innerHTML = `<div class="feed-placeholder">No pudimos cargar tus negocios.</div>`; return; }
    if (!data?.length) { slider.innerHTML = `<div class="business-slide empty"><div class="business-slide-icon"><i class="fa-solid fa-store"></i></div><div class="business-slide-info"><strong>Aún no tienes negocios registrados</strong><small>Cuando incorpores uno, aparecerá aquí.</small></div><a href="incorporar-negocio.html" class="business-slide-link">Incorporar <i class="fa-solid fa-arrow-right"></i></a></div>`; return; }
    slider.innerHTML = data.map(businessCard).join("");
    setupScroller("businessSlider", "businessPrev", "businessNext");
}

function publicationCard(publication, compact = false) {
    const image = publication.images?.[0]?.public_url;
    return `<article class="dashboard-publication-card ${compact ? "compact" : ""}">${image ? `<img src="${escapeHtml(image)}" alt="Imagen de publicación" loading="lazy">` : `<div class="dashboard-publication-placeholder"><i class="fa-regular fa-image"></i></div>`}<div class="dashboard-publication-copy"><span class="dashboard-publication-type">${escapeHtml(TYPE_LABELS[publication.type] || publication.type)}</span>${publication.title ? `<strong>${escapeHtml(publication.title)}</strong>` : ""}<p>${escapeHtml(publication.body)}</p><small>${escapeHtml(formatDate(publication.created_at))}</small></div></article>`;
}

async function loadDashboardCommunity() {
    const result = await CommunityService.getPublications({ type: "TODAS", limit: 3 });
    if (result.error) return;
    const publications = result.data || [];
    const recent = publications.filter(p => Date.now() - new Date(p.created_at).getTime() <= 7 * 86400000).length;
    setText("recentCount", recent);
    const highlights = document.getElementById("communityHighlights");
    if (highlights) highlights.innerHTML = publications.length ? publications.map(p => publicationCard(p, true)).join("") : `<div class="feed-placeholder">Todavía no hay publicaciones nuevas. Sé de las primeras personas en compartir algo.</div>`;
    const mineResult = await supabase.from("community_publications").select("id,author_id,type,title,body,created_at,updated_at").eq("author_id", currentUser.id).eq("status", "PUBLICADA").order("created_at", { ascending: false }).limit(3);
    const mine = mineResult.data || [];
    setText("myPublicationCount", mine.length);
    const mineContainer = document.getElementById("myPublications");
    if (mineContainer) mineContainer.innerHTML = mine.length ? mine.map(p => publicationCard(p)).join("") : `<div class="feed-placeholder">Aún no has publicado nada. Comparte algo con tu comunidad.</div>`;
    if (mine.length) setupScroller("myPublications", "myPubPrev", "myPubNext");
}

function setupScroller(containerId, prevId, nextId) {
    const container = document.getElementById(containerId);
    const prev = document.getElementById(prevId);
    const next = document.getElementById(nextId);
    if (!container || !prev || !next) return;
    const scroll = amount => container.scrollBy({ left: amount, behavior: "smooth" });
    prev.onclick = () => scroll(-Math.max(container.clientWidth * .75, 220));
    next.onclick = () => scroll(Math.max(container.clientWidth * .75, 220));
}

function initializeInlineComposer() {
    let selectedType = "VENTA";
    document.querySelectorAll("[data-compose-type]").forEach(button => button.addEventListener("click", () => {
        selectedType = button.dataset.composeType || "VENTA";
        document.querySelectorAll("[data-compose-type]").forEach(item => item.classList.toggle("active", item === button));
    }));
    document.getElementById("dashboardPublishBtn")?.addEventListener("click", async () => {
        const bodyInput = document.getElementById("dashboardPublicationBody");
        const titleInput = document.getElementById("dashboardPublicationTitle");
        const message = document.getElementById("dashboardPublicationMessage");
        const button = document.getElementById("dashboardPublishBtn");
        const body = bodyInput?.value.trim() || "";
        if (!body) { if (message) message.textContent = "Escribe algo antes de publicar."; return; }
        button.disabled = true; button.textContent = "Publicando...";
        const { error } = await CommunityService.createPublication({ type: selectedType, title: titleInput?.value.trim() || "", body });
        button.disabled = false; button.textContent = "Publicar";
        if (error) { if (message) message.textContent = error.message || "No fue posible publicar."; return; }
        bodyInput.value = ""; titleInput.value = ""; if (message) message.textContent = "¡Publicado!";
        await loadDashboardCommunity();
        setTimeout(() => { if (message) message.textContent = ""; }, 2500);
    });
}

async function initialize() {
    initializeMoreMenu();
    initializeNotificationPopover();
    initializeInlineComposer();
    if (!AuthSession.isInitialized()) await AuthSession.initialize();
    if (!AuthSession.isAuthenticated()) { window.location.href = APP_CONFIG.routes.login; return; }
    currentUser = AuthSession.getCurrentUser();
    const { data: perfil, error } = await ProfileService.getProfile(currentUser.id);
    if (error) console.error("Error al cargar el perfil:", error);

    const nombre = perfil?.nombre || currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || "Miembro";
    const apellido = perfil?.apellido || "";
    const nombreCompleto = `${nombre} ${apellido}`.trim();
    setText("topUserName", nombreCompleto); setText("topUserRole", "Miembro"); setText("memberName", nombreCompleto); setText("memberEmail", currentUser.email || ""); setText("welcomeTitle", `¡Hola, ${nombre.split(" ")[0]}!`);
    const verified = Boolean(currentUser.email_confirmed_at);
    const verifiedBadge = document.getElementById("memberVerifiedBadge");
    if (verifiedBadge) verifiedBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${verified ? "Miembro verificado" : "Miembro neXsv"}`;
    renderAvatar(perfil?.foto, nombreCompleto);

    await Promise.all([refreshUnreadCount(), loadBusinesses(), loadDashboardCommunity()]);
    subscribeDashboardRealtime();
}

document.addEventListener("DOMContentLoaded", initialize);
window.addEventListener("beforeunload", () => { if (dashboardChannel) supabase.removeChannel(dashboardChannel); });
