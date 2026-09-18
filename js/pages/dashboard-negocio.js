import AuthSession from "../auth/auth.session.js";
import BusinessService from "../services/business.service.js";
import BusinessMediaService from "../services/business-media.service.js";
import CommunityService from "../services/community.service.js";
import ProfileService from "../services/profile.service.js";
import { supabase } from "../core/supabase-client.js";
import { APP_CONFIG } from "../core/config.js";

let currentBusiness = null;
let currentUser = null;
let selectedMediaType = "FOTO";


document.addEventListener("DOMContentLoaded", async () => {
    if (!AuthSession.isInitialized()) await AuthSession.initialize();
    if (!AuthSession.isAuthenticated()) { window.location.href = APP_CONFIG.routes.login; return; }

    currentUser = AuthSession.getCurrentUser();
    renderOwner(currentUser);
    bindHorizontalSliders();
    bindSummarySlider();
    await loadOwnerProfile();

    const { data: businesses, error } = await BusinessService.getBusinessesByOwner(currentUser.id);
    if (error) { console.error("Error al cargar negocios:", error); renderError(); return; }

    renderSummary(businesses);
    renderBusinesses(businesses);
    initializeBusinessSelector(businesses);
    bindBusinessMediaControls();
    await loadCommunityPublications(currentUser.id);
});

function renderOwner(user) {
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || "Miembro";
    const firstName = fullName.trim().split(" ")[0] || "Miembro";
    setText("businessOwnerName", fullName);
    setDashboardHeaderAvatar(null, fullName);
}

async function loadOwnerProfile() {
    if (!currentUser) return;
    const result = await ProfileService.getProfile(currentUser.id);
    if (result?.error || !result?.data) return;
    const profile = result.data;
    const fullName = `${profile.nombre || ""} ${profile.apellido || ""}`.trim() || currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || "Miembro";
    setText("businessOwnerName", fullName);
    setDashboardHeaderAvatar(profile.foto, fullName);
    setBusinessSidebarPhoto(profile.foto, fullName);
}

function setDashboardHeaderAvatar(photo, name) {
    const header = document.getElementById("headerAvatar");
    const initials = document.getElementById("headerAvatarInitials");
    const value = initialsFromName(name);
    const oldImage = header?.querySelector("img");
    oldImage?.remove();
    if (photo && header) {
        const img = document.createElement("img");
        img.src = photo;
        img.alt = "Foto de perfil";
        header.prepend(img);
        if (initials) initials.style.display = "none";
    } else if (initials) {
        initials.textContent = value;
        initials.style.display = "inline";
    }
}

function setBusinessSidebarPhoto(photo, name) {
    const container = document.querySelector(".business-sidebar-icon");
    if (!container) return;
    if (photo) {
        container.innerHTML = `<img src="${escapeAttr(photo)}" alt="Foto de perfil de ${escapeAttr(name)}">`;
        container.classList.add("has-profile-photo");
    } else {
        container.innerHTML = `<i class="fa-solid fa-store"></i>`;
        container.classList.remove("has-profile-photo");
    }
}

function initialsFromName(name = "Miembro") {
    return String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "M";
}

function renderSummary(businesses) {
    setText("businessTotal", businesses.length);
    setText("businessSavesSummary", 0);
    setText("businessSharesSummary", 0);
    setText("businessCommentsSummary", 0);
    updateSummaryHint();
}

function bindSummarySlider() {
    const viewport = document.querySelector(".business-summary-viewport");
    const track = document.getElementById("businessSummaryTrack");
    const previous = document.getElementById("businessSummaryPrev");
    const next = document.getElementById("businessSummaryNext");
    if (!viewport || !track || !previous || !next) return;

    const scrollPage = direction => viewport.scrollBy({ left: direction * viewport.clientWidth, behavior: "smooth" });
    previous.addEventListener("click", () => scrollPage(-1));
    next.addEventListener("click", () => scrollPage(1));
    viewport.addEventListener("scroll", updateSummaryHint, { passive: true });
    window.addEventListener("resize", updateSummaryHint);
    updateSummaryHint();
}

function updateSummaryHint() {
    const viewport = document.querySelector(".business-summary-viewport");
    const track = document.getElementById("businessSummaryTrack");
    const previous = document.getElementById("businessSummaryPrev");
    const next = document.getElementById("businessSummaryNext");
    const hint = document.getElementById("businessSummaryHint");
    if (!viewport || !track) return;

    const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const current = Math.max(0, viewport.scrollLeft);
    if (previous) previous.disabled = current <= 4;
    if (next) next.disabled = current >= max - 4;

    if (hint) {
        if (max <= 4) hint.textContent = "1–6 de 6";
        else if (current < max / 2) hint.textContent = "1–3 de 6";
        else hint.textContent = "4–6 de 6";
    }
}

function bindHorizontalSliders() {
    document.querySelectorAll("[data-slider-target]").forEach(button => {
        button.addEventListener("click", () => {
            const target = document.getElementById(button.dataset.sliderTarget);
            if (!target) return;
            const direction = button.dataset.sliderDirection === "prev" ? -1 : 1;
            target.scrollBy({ left: direction * Math.max(target.clientWidth * 0.9, 300), behavior: "smooth" });
        });
    });
}

function initializeBusinessSelector(businesses) {
    const row = document.getElementById("businessSelectorRow");
    const trigger = document.getElementById("businessSelectorTrigger");
    const triggerName = document.getElementById("businessSelectorTriggerName");
    const menu = document.getElementById("businessSelectorMenu");
    if (!row || !trigger || !triggerName || !menu || !businesses.length) return;

    row.hidden = false;
    const storedId = sessionStorage.getItem("nexsv_selected_business_id");
    const selected = businesses.find(business => business.id === storedId) || businesses[0];

    const renderMenu = () => {
        menu.innerHTML = businesses.map(business => {
            const logo = business.logo || "";
            const selectedClass = business.id === currentBusiness?.id ? " selected" : "";
            return `<button type="button" class="business-selector-option${selectedClass}" role="option" data-business-id="${escapeAttr(business.id)}">
                <span class="business-selector-option-logo">${logo ? `<img src="${escapeAttr(logo)}" alt="">` : '<i class="fa-solid fa-store"></i>'}</span>
                <span>${escapeHtml(business.nombre || "Mi negocio")}</span>
                ${business.id === currentBusiness?.id ? '<i class="fa-solid fa-check business-selector-check"></i>' : ""}
            </button>`;
        }).join("");

        menu.querySelectorAll(".business-selector-option").forEach(option => {
            option.addEventListener("click", async () => {
                const business = businesses.find(item => item.id === option.dataset.businessId);
                if (!business) return;
                currentBusiness = business;
                sessionStorage.setItem("nexsv_selected_business_id", business.id);
                updateSelectedBusinessLabels(business);
                closeBusinessSelector();
                renderMenu();
                await loadSelectedBusiness(business);
            });
        });
    };

    const openBusinessSelector = () => {
        menu.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
    };
    const closeBusinessSelector = () => {
        menu.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
    };

    trigger.addEventListener("click", event => {
        event.stopPropagation();
        menu.hidden ? openBusinessSelector() : closeBusinessSelector();
    });
    document.addEventListener("click", event => {
        if (!row.contains(event.target)) closeBusinessSelector();
    });

    currentBusiness = selected;
    sessionStorage.setItem("nexsv_selected_business_id", selected.id);
    updateSelectedBusinessLabels(selected);
    renderMenu();
    loadSelectedBusiness(selected);
}

function updateSelectedBusinessLabels(business) {
    const name = business.nombre || "Mi negocio";
    const category = business.categoria || "Negocio";
    const description = business.descripcion || "Gestiona la presencia de este negocio en neXsv.";

    setText("businessSwitcherName", name);

    // La bienvenida pertenece al negocio activo: un solo punto de actualización.
    setText("businessWelcomeKicker", `Espacio de ${name}`);
    setText("welcomeTitle", `Bienvenido al espacio de ${name}`);

    setText("businessMediaBusinessName", name);
    setText("businessSidebarName", name);
    setText("businessSidebarCategory", category);
    setText("businessSidebarDescription", description);

    setBusinessIdentityImage("businessSwitcherIcon", business.logo);
    setBusinessIdentityImage("businessSidebarIcon", business.logo);
}

function setBusinessIdentityImage(id, logo) {
    const container = document.getElementById(id);
    if (!container) return;

    container.innerHTML = logo
        ? `<img src="${escapeAttr(logo)}" alt="Logo del negocio">`
        : '<i class="fa-solid fa-store"></i>';

    container.classList.toggle("has-business-logo", Boolean(logo));
    container.classList.toggle("has-profile-photo", false);
}

async function loadSelectedBusiness(business) {
    const empty = document.getElementById("businessPublicationsEmpty");
    if (empty) empty.classList.remove("visible");
    await Promise.all([loadBusinessPublications(business.id), loadBusinessMedia(business.id)]);
}

async function loadBusinessPublications(businessId) {
    const slider = document.getElementById("businessPublications");
    const empty = document.getElementById("businessPublicationsEmpty");
    if (!slider) return;

    slider.innerHTML = `<div class="business-empty-state"><i class="fa-solid fa-spinner fa-spin"></i><strong>Cargando publicaciones</strong><span>Estamos actualizando los resultados de este negocio.</span></div>`;
    const result = await CommunityService.getPublications({ type: "TODAS", limit: 8, businessId });
    if (result.error) {
        slider.innerHTML = `<div class="business-empty-state"><i class="fa-solid fa-triangle-exclamation"></i><strong>No pudimos cargar tus publicaciones</strong><span>Intenta nuevamente en unos momentos.</span></div>`;
        return;
    }

    const publications = result.data || [];
    if (!publications.length) {
        slider.innerHTML = "";
        empty?.classList.add("visible");
        resetPublicationTotals();
        return;
    }

    empty?.classList.remove("visible");
    slider.innerHTML = publications.map(publicationCard).join("");
    bindPublicationActions();
    await loadPublicationMetrics(publications.map(p => p.id));
}

function publicationCard(publication) {
    const image = publication.images?.[0]?.public_url || "";
    const title = publication.title?.trim() || typeLabel(publication.type);
    const url = `comunidad.html?publicacion=${encodeURIComponent(publication.id)}`;
    return `<article class="business-publication-card" data-publication-id="${escapeAttr(publication.id)}"><div class="business-publication-media">${image ? `<img src="${escapeAttr(image)}" alt="Imagen de la publicación">` : `<div class="business-publication-no-image"><i class="fa-solid fa-bullhorn"></i></div>`}</div><div class="business-publication-content"><span class="business-publication-type">${escapeHtml(typeLabel(publication.type))}</span><h3>${escapeHtml(title)}</h3><p class="business-publication-body">${escapeHtml(publication.body || "")}</p><span class="business-publication-date">${escapeHtml(formatDate(publication.created_at))}</span><div class="business-publication-metrics"><div class="business-publication-metric"><i class="fa-regular fa-eye"></i><strong data-publication-metric="views">0</strong><span>Vistas</span></div><div class="business-publication-metric"><i class="fa-regular fa-comments"></i><strong data-publication-metric="comments">0</strong><span>Comentarios</span></div><div class="business-publication-metric"><i class="fa-regular fa-comment"></i><strong data-publication-metric="conversations">0</strong><span>Conversaciones</span></div><div class="business-publication-metric"><i class="fa-regular fa-share-from-square"></i><strong data-publication-metric="shares">0</strong><span>Compartidos</span></div><div class="business-publication-metric"><i class="fa-regular fa-bookmark"></i><strong data-publication-metric="saves">0</strong><span>Guardados</span></div></div><div class="business-publication-actions"><a class="business-view-publication" href="${url}">Ver publicación <i class="fa-solid fa-arrow-right"></i></a><button class="business-share-publication" type="button" data-share-url="${escapeAttr(new URL(url, window.location.href).href)}"><i class="fa-regular fa-share-from-square"></i> Compartir</button></div></div></article>`;
}

async function loadCommunityPublications(ownerId) {
    const slider = document.getElementById("communityPublications");
    const empty = document.getElementById("communityPublicationsEmpty");
    if (!slider) return;

    const result = await CommunityService.getPublications({ type: "TODAS", limit: 8, excludeAuthorId: ownerId });
    if (result.error) {
        slider.innerHTML = `<div class="business-empty-state"><i class="fa-solid fa-triangle-exclamation"></i><strong>No pudimos cargar la comunidad</strong><span>Intenta nuevamente en unos momentos.</span></div>`;
        return;
    }

    const publications = result.data || [];
    if (!publications.length) { slider.innerHTML = ""; empty?.classList.add("visible"); return; }
    empty?.classList.remove("visible");
    slider.innerHTML = publications.map(communityPublicationCard).join("");
}

function communityPublicationCard(publication) {
    const image = publication.images?.[0]?.public_url || "";
    const title = publication.title?.trim() || typeLabel(publication.type);
    const url = `comunidad.html?publicacion=${encodeURIComponent(publication.id)}`;
    return `<article class="business-publication-card business-community-publication-card"><div class="business-publication-media">${image ? `<img src="${escapeAttr(image)}" alt="Imagen de la publicación">` : `<div class="business-publication-no-image"><i class="fa-solid fa-users"></i></div>`}</div><div class="business-publication-content"><span class="business-publication-type">${escapeHtml(typeLabel(publication.type))}</span><h3>${escapeHtml(title)}</h3><p class="business-publication-body">${escapeHtml(publication.body || "")}</p><span class="business-publication-date">${escapeHtml(formatDate(publication.created_at))}</span><div class="business-publication-actions"><a class="business-view-publication" href="${url}">Ver publicación <i class="fa-solid fa-arrow-right"></i></a></div></div></article>`;
}

async function loadPublicationMetrics(publicationIds) {
    const { data, error } = await supabase.rpc("get_my_community_publication_metrics");
    if (error) { console.warn("No se pudieron cargar las métricas de publicaciones:", error); return; }

    const { data: engagementData, error: engagementError } = await supabase.rpc("get_my_community_publication_engagement_metrics");
    if (engagementError) console.warn("No se pudieron cargar compartidos y guardados:", engagementError);

    const selected = new Set(publicationIds);
    const metrics = (data || []).filter(item => selected.has(item.publication_id));
    const engagement = new Map((engagementData || []).map(item => [item.publication_id, item]));
    const totals = metrics.reduce((a, item) => ({ views: a.views + Number(item.views || 0), comments: a.comments + Number(item.comments || 0), conversations: a.conversations + Number(item.conversations || 0) }), { views: 0, comments: 0, conversations: 0 });

    let shares = 0;
    let saves = 0;
    metrics.forEach(item => {
        const card = document.querySelector(`[data-publication-id="${CSS.escape(item.publication_id)}"]`);
        const extra = engagement.get(item.publication_id) || {};
        shares += Number(extra.shares || 0);
        saves += Number(extra.saves || 0);
        if (!card) return;
        setMetric(card, "views", item.views);
        setMetric(card, "comments", item.comments);
        setMetric(card, "conversations", item.conversations);
        setMetric(card, "shares", extra.shares);
        setMetric(card, "saves", extra.saves);
    });

    setText("businessViews", totals.views);
    setText("businessViewsSummary", totals.views);
    setText("businessComments", totals.comments);
    setText("businessCommentsSummary", totals.comments);
    setText("businessConversations", totals.conversations);
    setText("businessConversationsSummary", totals.conversations);
    setText("businessConversationsOpportunity", totals.conversations);
    setText("businessShares", shares);
    setText("businessSharesSummary", shares);
    setText("businessSaves", saves);
    setText("businessSavesSummary", saves);
    setText("businessInterests", "—");
    setText("businessInterestsResult", "—");

    const rate = totals.views ? Math.round((totals.conversations / totals.views) * 1000) / 10 : 0;
    setText("businessConversationRate", `${rate}%`);
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
            const original = button.innerHTML;
            button.innerHTML = `<i class="fa-solid fa-check"></i> Enlace copiado`;
            setTimeout(() => { button.innerHTML = original; }, 1800);
        } catch (error) {
            if (error?.name !== "AbortError") console.warn("No se pudo compartir la publicación:", error);
        }
    }));
}

function bindBusinessMediaControls() {
    const input = document.getElementById("businessMediaInput");
    const photoButton = document.getElementById("businessMediaPhoto");
    const promoButton = document.getElementById("businessMediaPromo");
    photoButton?.addEventListener("click", () => { selectedMediaType = "FOTO"; input?.click(); });
    promoButton?.addEventListener("click", () => { selectedMediaType = "PROMOCION"; input?.click(); });
    input?.addEventListener("change", async () => {
        const files = input.files;
        if (!files?.length || !currentBusiness) return;
        setMediaStatus("Subiendo material…");
        const result = await BusinessMediaService.uploadBusinessMedia(currentBusiness.id, files, selectedMediaType);
        input.value = "";
        if (result.error) { setMediaStatus(result.error.message || "No se pudo subir el material.", "error"); return; }
        setMediaStatus(`${result.data.length} imagen${result.data.length === 1 ? "" : "es"} agregada${result.data.length === 1 ? "" : "s"}.`, "ok");
        await loadBusinessMedia(currentBusiness.id);
    });
}

async function loadBusinessMedia(businessId) {
    const gallery = document.getElementById("businessMediaGallery");
    if (!gallery) return;
    gallery.innerHTML = `<div class="business-media-loading"><i class="fa-solid fa-spinner fa-spin"></i> Cargando…</div>`;
    const result = await BusinessMediaService.getBusinessMedia(businessId);
    if (result.error) { gallery.innerHTML = `<span class="business-media-empty">No se pudo cargar el material de este negocio.</span>`; console.warn("No se pudo cargar material del negocio:", result.error); return; }
    if (!result.data.length) { gallery.innerHTML = `<span class="business-media-empty">Todavía no hay fotos ni artes para este negocio.</span>`; return; }
    gallery.innerHTML = result.data.map(media => `<div class="business-media-item"><img src="${escapeAttr(media.url || "")}" alt="${media.tipo === "PROMOCION" ? "Arte promocional" : "Foto del negocio"}"><span class="business-media-kind">${media.tipo === "PROMOCION" ? "Arte" : "Foto"}</span><button type="button" class="business-media-delete" data-media-id="${escapeAttr(media.id)}" aria-label="Eliminar imagen"><i class="fa-regular fa-trash-can"></i></button></div>`).join("");
    gallery.querySelectorAll(".business-media-delete").forEach(button => button.addEventListener("click", async () => {
        const media = result.data.find(item => item.id === button.dataset.mediaId);
        if (!media || !confirm("¿Eliminar esta imagen del material del negocio?")) return;
        const deleted = await BusinessMediaService.deleteBusinessMedia(media);
        if (deleted.error) { setMediaStatus("No se pudo eliminar la imagen.", "error"); return; }
        await loadBusinessMedia(businessId);
        setMediaStatus("Imagen eliminada.", "ok");
    }));
}

function setMediaStatus(message, type = "") {
    const element = document.getElementById("businessMediaStatus");
    if (element) { element.textContent = message; element.className = `business-media-status ${type}`; }
}

function resetPublicationTotals() {
    setText("businessViews", 0); setText("businessViewsSummary", 0); setText("businessComments", 0); setText("businessCommentsSummary", 0); setText("businessConversations", 0); setText("businessConversationsSummary", 0); setText("businessConversationsOpportunity", 0); setText("businessMessages", 0); setText("businessShares", 0); setText("businessSharesSummary", 0); setText("businessSaves", 0); setText("businessSavesSummary", 0); setText("businessConversationRate", "0%"); setText("businessInterests", "—"); setText("businessInterestsResult", "—");
}

function setMetric(card, metric, value) {
    card.querySelector(`[data-publication-metric="${metric}"]`)?.replaceChildren(document.createTextNode(String(Number(value || 0))));
}

function renderBusinesses(businesses) {
    const container = document.getElementById("businessList");
    const toggle = document.getElementById("businessListToggle");
    if (!container) return;
    if (!businesses.length) {
        container.innerHTML = `<div class="business-empty-state"><i class="fa-solid fa-store"></i><strong>Aún no tienes un negocio registrado</strong><span>Incorpora tu primer negocio para comenzar.</span><a href="incorporar-negocio.html" class="business-primary-btn">Incorporar negocio</a></div>`;
        if (toggle) toggle.hidden = true;
        return;
    }
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
    const status = normalize(business.estado);
    const isActive = status === "activo";
    const isCorrection = status === "correccion";
    const statusLabel = isActive ? "Publicado" : isCorrection ? "Requiere corrección" : "En proceso";
    const statusClass = isActive ? "active" : isCorrection ? "correction" : "pending";
    const location = [business.municipio, business.departamento].filter(Boolean).join(", ") || "Ubicación pendiente";
    const expiration = business.fecha_vencimiento ? formatDate(business.fecha_vencimiento) : "Pendiente";
    return `<article class="business-item-card"><div class="business-item-main"><div class="business-item-logo">${business.logo ? `<img src="${escapeAttr(business.logo)}" alt="${escapeAttr(business.nombre || "Negocio")}">` : `<i class="fa-solid fa-store"></i>`}</div><div class="business-item-info"><div class="business-item-heading"><div><h3>${escapeHtml(business.nombre || "Mi negocio")}</h3><span>${escapeHtml(business.categoria || "Negocio")}</span></div><span class="business-status ${statusClass}"><i class="fa-solid fa-circle"></i>${statusLabel}</span></div><p><i class="fa-solid fa-location-dot"></i> ${escapeHtml(location)}</p>${isActive ? `<small class="business-validity"><i class="fa-regular fa-calendar"></i> Vigencia hasta ${expiration}</small>` : ""}</div></div><div class="business-item-actions"><a href="#" class="business-outline-btn">Editar información</a>${isActive ? `<a href="#contenido-visual" class="business-primary-small">Ver publicaciones <i class="fa-solid fa-arrow-right"></i></a>` : `<span class="business-process-note">La publicación estará disponible al completar el proceso.</span>`}</div></article>`;
}

function renderError() {
    setText("businessTotal", "—"); setText("businessViewsSummary", "—"); setText("businessConversationsSummary", "—");
    const container = document.getElementById("businessList");
    if (container) container.innerHTML = `<div class="business-empty-state"><i class="fa-solid fa-triangle-exclamation"></i><strong>No pudimos cargar tus negocios</strong><span>Intenta nuevamente en unos momentos.</span></div>`;
}

function typeLabel(type) { const labels = { VENTA: "Venta", INTERCAMBIO: "Intercambio", BUSCO: "Busco", REGALO: "Regalo", RECOMENDACION: "Recomendación", OFERTA: "Oferta", EVENTO: "Evento" }; return labels[normalize(type).toUpperCase()] || "Publicación"; }
function normalize(value) { return String(value || "").trim().toLowerCase(); }
function formatDate(value) { const date = new Date(value); if (Number.isNaN(date.getTime())) return "Fecha pendiente"; return new Intl.DateTimeFormat("es-SV", { day: "2-digit", month: "short", year: "numeric" }).format(date); }
function escapeHtml(value) { return String(value).replace(/[&<>\'\"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char])); }
function escapeAttr(value) { return escapeHtml(value); }
function setText(id, value) { const element = document.getElementById(id); if (element) element.textContent = value; }
