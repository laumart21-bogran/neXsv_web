import AuthSession from "../auth/auth.session.js";
import ProfileService from "../services/profile.service.js";
import BusinessService from "../services/business.service.js";
import CommunityService from "../services/community.service.js";
import { supabase } from "../core/supabase-client.js";
import { APP_CONFIG } from "../core/config.js";

let currentUser = null;
let dashboardChannel = null;
let memberBusinesses = [];

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

function updateProfileProgress(profile) {
    const fields = [profile?.nombre, profile?.apellido, profile?.telefono, profile?.ciudad, profile?.colegio, profile?.foto];
    const completed = fields.filter(value => String(value ?? "").trim()).length;
    const percent = Math.round((completed / fields.length) * 100);
    const card = document.getElementById("profileProgress");
    const fill = document.getElementById("profileProgressFill");
    const value = document.getElementById("profileProgressValue");
    const title = document.getElementById("profileProgressTitle");
    const text = document.getElementById("profileProgressText");
    const link = document.getElementById("profileProgressLink");
    if (!card || !fill || !value) return;
    fill.style.width = `${percent}%`;
    value.textContent = `${percent}%`;
    if (percent >= 100) {
        card.classList.add("complete");
        if (title) title.textContent = "Perfil completo";
        if (text) text.textContent = "Tu información está lista para acompañarte dentro de neXsv.";
        if (link) { link.textContent = "Ver mi perfil "; link.insertAdjacentHTML("beforeend", '<i class="fa-solid fa-arrow-right"></i>'); }
    } else {
        card.classList.remove("complete");
        if (title) title.textContent = "Completa tu perfil";
        if (text) text.textContent = `Has completado el ${percent}% de tu perfil. Agrega algunos datos para aprovechar mejor neXsv.`;
        if (link) { link.textContent = "Completar perfil "; link.insertAdjacentHTML("beforeend", '<i class="fa-solid fa-arrow-right"></i>'); }
    }
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
        if (label) label.textContent = expanded ? "Mi actividad" : "Ocultar actividad";
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

async function loadBusinesses() {
    const { data, error } = await BusinessService.getBusinessesByOwner(currentUser.id);
    if (error) { console.warn("No pudimos cargar los negocios del miembro:", error); return; }
    memberBusinesses = data || [];
    initializeBusinessPublishSelector(memberBusinesses);
    const sidebarLink = document.getElementById("sidebarMyBusinesses");
    const spaceAction = document.getElementById("spaceBusinessAction");
    const spaceTitle = document.getElementById("spaceBusinessTitle");
    const spaceText = document.getElementById("spaceBusinessText");
    if (!spaceAction) return;
    if (memberBusinesses.length) {
        if (sidebarLink) sidebarLink.hidden = false;
        spaceAction.href = `dashboard-negocio.html?business=${encodeURIComponent(memberBusinesses[0].id)}`;
        if (spaceTitle) spaceTitle.textContent = "Mis negocios";
        if (spaceText) spaceText.textContent = memberBusinesses.length === 1 ? "Administra tu negocio dentro de neXsv." : `Administra tus ${memberBusinesses.length} negocios dentro de neXsv.`;
    } else {
        if (sidebarLink) sidebarLink.hidden = true;
        spaceAction.href = "incorporar-negocio.html";
        if (spaceTitle) spaceTitle.textContent = "¿Tienes un negocio?";
        if (spaceText) spaceText.textContent = "Si tienes un negocio, adminístralo en neXsv.";
    }
}

function initializeBusinessPublishSelector(businesses) {
    const selector = document.getElementById("dashboardPublicationBusiness");
    if (!selector) return;
    const currentValue = selector.value;
    selector.innerHTML = `<option value="">Publicación personal</option>${businesses.map(business => `<option value="${escapeHtml(business.id)}">${escapeHtml(business.nombre || "Mi negocio")}</option>`).join("")}`;
    if (currentValue && businesses.some(business => business.id === currentValue)) selector.value = currentValue;
}

function publicationCard(publication, compact = false, showMetrics = false) {
    const image = publication.images?.[0]?.public_url;
    const metrics = showMetrics ? `<div class="dashboard-publication-metrics"><span><i class="fa-regular fa-eye"></i> <b data-metric="views">—</b> vistas</span><a href="comunidad.html?publicacion=${encodeURIComponent(publication.id)}#comentarios"><i class="fa-regular fa-message"></i> <b data-metric="comments">—</b> comentarios</a><a href="mensajes.html?publication=${encodeURIComponent(publication.id)}"><i class="fa-regular fa-comments"></i> <b data-metric="conversations">—</b> conversaciones</a></div>` : "";
    return `<article class="dashboard-publication-card ${compact ? "compact" : ""}" data-publication-id="${escapeHtml(publication.id)}">${image ? `<img src="${escapeHtml(image)}" alt="Imagen de publicación" loading="lazy">` : `<div class="dashboard-publication-placeholder"><i class="fa-regular fa-image"></i></div>`}<div class="dashboard-publication-copy"><span class="dashboard-publication-type">${escapeHtml(TYPE_LABELS[publication.type] || publication.type)}</span>${publication.title ? `<strong>${escapeHtml(publication.title)}</strong>` : ""}<p>${escapeHtml(publication.body)}</p><small>${escapeHtml(formatDate(publication.created_at))}</small>${metrics}</div></article>`;
}

function recommendedBusinessCard(business) {
    const name = business.nombre || "Negocio";
    const initialsText = initials(name);
    const logo = business.logo ? `<img src="${escapeHtml(business.logo)}" alt="Logo de ${escapeHtml(name)}" loading="lazy">` : `<span>${escapeHtml(initialsText)}</span>`;
    return `<a class="recommended-business-card" href="negocio.html?id=${encodeURIComponent(business.id)}"><div class="recommended-business-logo">${logo}</div><strong>${escapeHtml(name)}</strong><small>${escapeHtml(business.categoria || "Negocio")}</small></a>`;
}

async function loadRecommendedBusinesses() {
    const container = document.getElementById("recommendedBusinesses");
    if (!container) return;
    const { data, error } = await BusinessService.getPublicBusinessDirectory();
    if (error) { container.innerHTML = `<div class="feed-placeholder">No pudimos cargar los negocios recomendados.</div>`; return; }
    const businesses = (data || []).slice(0, 6);
    container.innerHTML = businesses.length ? businesses.map(recommendedBusinessCard).join("") : `<div class="feed-placeholder">Aún no hay negocios publicados.</div>`;
}

async function loadDashboardCommunity() {
    const result = await CommunityService.getPublications({ type: "TODAS", limit: 3 });
    if (result.error) return;
    const publications = result.data || [];
    const recent = publications.filter(p => Date.now() - new Date(p.created_at).getTime() <= 7 * 86400000).length;
    setText("recentCount", recent);
    const mineResult = await supabase.from("community_publications").select("id,author_id,business_id,type,title,body,created_at,updated_at").eq("author_id", currentUser.id).eq("status", "PUBLICADA").order("created_at", { ascending: false }).limit(3);
    const mine = mineResult.data || [];
    setText("myPublicationCount", mine.length);
    const mineContainer = document.getElementById("myPublications");
    if (mineContainer) mineContainer.innerHTML = mine.length ? mine.map(p => publicationCard(p, false, true)).join("") : `<div class="feed-placeholder">Aún no has publicado nada. Comparte algo con tu comunidad.</div>`;
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
        const businessSelector = document.getElementById("dashboardPublicationBusiness");
        const message = document.getElementById("dashboardPublicationMessage");
        const button = document.getElementById("dashboardPublishBtn");
        const body = bodyInput?.value.trim() || "";
        if (!body) { if (message) message.textContent = "Escribe algo antes de publicar."; return; }
        button.disabled = true; button.textContent = "Publicando...";
        const { error } = await CommunityService.createPublication({ type: selectedType, title: titleInput?.value.trim() || "", body, businessId: businessSelector?.value || null });
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
    setText("topUserName", nombreCompleto); setText("topUserRole", "Miembro"); setText("memberName", nombreCompleto); setText("welcomeTitle", `¡Hola, ${nombre.split(" ")[0]}!`);
    const verified = Boolean(currentUser.email_confirmed_at);
    const verifiedBadge = document.getElementById("memberVerifiedBadge");
    if (verifiedBadge) verifiedBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${verified ? "Miembro verificado" : "Miembro neXsv"}`;
    renderAvatar(perfil?.foto, nombreCompleto);
    updateProfileProgress(perfil || {});

    await Promise.all([refreshUnreadCount(), loadBusinesses(), loadRecommendedBusinesses(), loadDashboardCommunity()]);
    subscribeDashboardRealtime();
}

document.addEventListener("DOMContentLoaded", initialize);
