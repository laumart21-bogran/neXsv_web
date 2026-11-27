import CommunityService from "../services/community.service.js";
import MessagingService from "../services/messaging.service.js";
import BusinessService from "../services/business.service.js";
import BusinessMediaService from "../services/business-media.service.js";
import { supabase } from "../core/supabase-client.js";

const publicationList = document.getElementById("publicationList");
const composer = document.getElementById("publicationComposer");
const publicationForm = document.getElementById("publicationForm");
const newPublicationBtn = document.getElementById("newPublicationBtn");
const closeComposer = document.getElementById("closeComposer");
const publicationMessage = document.getElementById("publicationMessage");
const imagesInput = document.getElementById("publicationImages");
const addPhotosBtn = document.getElementById("addPhotosBtn");
const photoCount = document.getElementById("photoCount");
const photoPreview = document.getElementById("photoPreview");
const editModal = document.getElementById("editPublicationModal");
const editForm = document.getElementById("editPublicationForm");
const editTitle = document.getElementById("editPublicationTitle");
const editBody = document.getElementById("editPublicationBody");
const editMessage = document.getElementById("editPublicationMessage");

let currentUser = null;
let currentFilter = "TODAS";
let activeCommunityTopic = null;
let selectedFiles = [];
let editingPublicationId = null;
let editingPublicationBusinessId = null;
let deepLinkedPublicationId = null;
let activeBusinessId = null;
let activeBusiness = null;
let publicBusinessesById = new Map();

const TYPE_LABELS = { VENTA: "Vendo", INTERCAMBIO: "Intercambio", BUSCO: "Busco", REGALO: "Regalo", RECOMENDACION: "Recomiendo", OFERTA: "Ofrezco", EVENTO: "Evento" };
const WEEKLY_QUESTIONS = [
    "¿Qué academia de natación recomiendan para niños?",
    "¿Qué actividad extracurricular ha disfrutado más tu familia?",
    "¿Qué lugar recomiendan para celebrar un cumpleaños infantil?",
    "¿Qué servicio de apoyo escolar les ha funcionado mejor?",
    "¿Qué restaurante familiar recomendarían para salir con niños?",
    "¿Qué deporte o actividad ha motivado más a sus hijos?",
    "¿Qué curso o taller les gustaría encontrar cerca de su colegio?",
    "¿Qué consejo les ha facilitado organizar las mañanas escolares?",
    "¿Qué lugar recomiendan para una salida familiar de fin de semana?",
    "¿Qué servicio para el hogar les ha dado una buena experiencia?",
    "¿Qué libro o recurso educativo recomiendan para niños?",
    "¿Qué actividad ayuda más a sus hijos a desarrollar nuevas habilidades?"
];
let activeWeeklyQuestion = "";
function chooseWeeklyQuestion() {
    let previousQuestion = "";
    try { previousQuestion = localStorage.getItem("nexsv_last_weekly_question") || ""; } catch (_) {}
    const options = WEEKLY_QUESTIONS.filter(question => question !== previousQuestion);
    activeWeeklyQuestion = options[Math.floor(Math.random() * options.length)] || WEEKLY_QUESTIONS[0];
    try { localStorage.setItem("nexsv_last_weekly_question", activeWeeklyQuestion); } catch (_) {}
    const heading = document.getElementById("weeklyQuestionText");
    if (heading) heading.textContent = activeWeeklyQuestion;
}
function shuffleItems(items) {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function initials(name = "Miembro") { return String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join("") || "M"; }
function formatDate(value) { const date = new Date(value); if (Number.isNaN(date.getTime())) return ""; return new Intl.DateTimeFormat("es-SV", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date); }
function showMessage(text, type = "") { publicationMessage.textContent = text || ""; publicationMessage.className = `form-message ${type}`.trim(); }
function showEditMessage(text, type = "") { editMessage.textContent = text || ""; editMessage.className = `form-message ${type}`.trim(); }

function updateRecommendationBusinessField() {
    const type = publicationForm?.querySelector("input[name='type']:checked")?.value;
    const wrapper = document.getElementById("recommendationBusinessField");
    const input = document.getElementById("recommendationBusinessName");
    const visible = type === "RECOMENDACION" && !activeBusinessId;
    if (wrapper) wrapper.hidden = !visible;
    if (input) input.required = visible;
}
function showRecommendationInvite(businessName) {
    const modal = document.getElementById("recommendationInviteModal");
    const name = document.getElementById("recommendationInviteBusinessName");
    const link = document.getElementById("recommendationInviteWhatsapp");
    if (!modal || !link) return;
    const cleanName = String(businessName || "").trim();
    if (name) name.textContent = cleanName;
    const message = `¡Hola! 😊 Les cuento que recomendé a ${cleanName} en neXsv. Es una red privada de familias de comunidades educativas donde compartimos recomendaciones y descubrimos negocios y servicios de confianza. Me pareció que podría interesarles formar parte. Si quieren conocer cómo funciona, pueden visitar https://nexsv.com. ¡Un saludo!`;
    link.href = `https://wa.me/?text=${encodeURIComponent(message)}`;
    modal.hidden = false;
    modal.querySelector("[data-close-recommendation-invite]")?.focus();
}
function closeRecommendationInvite() {
    const modal = document.getElementById("recommendationInviteModal");
    if (modal) modal.hidden = true;
}

async function getAuthorProfile(userId) {
    return await CommunityService.getPublicAuthorProfile(userId);
}

async function enrichPublications(publications) {
    return Promise.all((publications || []).map(async p => {
        // Las recomendaciones vinculadas a un negocio conservan como autor a la persona que las escribió.
        if (p.business_id && p.type !== "RECOMENDACION") {
            const business = publicBusinessesById.get(p.business_id);
            if (business) {
                return {
                    ...p,
                    author: {
                        name: business.nombre || "Negocio",
                        photo: business.logo || null
                    }
                };
            }
        }
        return {
            ...p,
            author: await getAuthorProfile(p.author_id)
        };
    }));
}
function avatarHtml(profile, className = "author-avatar") { return `<div class="${className}">${profile?.photo ? `<img src="${escapeHtml(profile.photo)}" alt="Foto de perfil" loading="lazy">` : `<span>${escapeHtml(initials(profile?.name))}</span>`}</div>`; }

async function loadHistoricalReviewPublications(publications) {
    if (currentFilter !== "TODAS" && currentFilter !== "RECOMENDACION") return publications;
    const businesses = [...publicBusinessesById.values()];
    if (!businesses.length) return publications;
    const results = await Promise.all(businesses.map(async business => {
        const result = await BusinessService.getPublicBusinessReviews(business.id);
        return (result.data || []).map(review => ({ business, review }));
    }));
    const existing = new Set((publications || [])
        .filter(item => item.type === "RECOMENDACION" && item.business_id)
        .map(item => `${item.business_id}|${String(item.body || "").split(/\\n|[\\r\\n]/).slice(1).join(" ").trim().toLocaleLowerCase()}`));
    const historical = [];
    results.flat().forEach(({ business, review }) => {
        const comment = String(review.comentario || "").trim();
        if (!comment) return;
        const key = `${business.id}|${comment.toLocaleLowerCase()}`;
        if (existing.has(key)) return;
        existing.add(key);
        const rating = Math.max(1, Math.min(5, Number(review.estrellas) || 1));
        historical.push({
            id: `legacy-review-${review.id}`,
            author_id: null,
            author: { name: String(review.nombre || "").trim() || "Miembro de la comunidad", photo: null },
            business_id: business.id,
            type: "RECOMENDACION",
            title: `Experiencia en ${business.nombre || "este negocio"}`,
            body: `${"★".repeat(rating)}${"☆".repeat(5 - rating)}\\n${comment}`,
            status: "PUBLICADA",
            created_at: review.created_at,
            updated_at: review.created_at,
            images: [],
            commentCount: 0,
            isLegacyReview: true
        });
    });
    return [...(publications || []), ...historical].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}


let businessRailIndex = 0;
let businessRailTimer = null;

function businessLogoHtml(business, className = "") {
    if (business?.logo) return `<img class="${className}" src="${escapeHtml(business.logo)}" alt="Logo de ${escapeHtml(business.nombre || "negocio")}" loading="lazy">`;
    return `<span class="community-business-logo-fallback ${escapeHtml(className || "")}">${escapeHtml(initials(business?.nombre || "N"))}</span>`;
}

function renderBusinessRail() {
    const rail = document.getElementById("communityBusinessRail");
    if (!rail) return;
    const businesses = [...publicBusinessesById.values()];
    if (!businesses.length) {
        rail.innerHTML = `<div class="community-business-card"><div class="community-business-copy"><strong>Aún estamos incorporando negocios</strong><span>Pronto encontrarás más negocios de tu comunidad.</span></div></div>`;
        return;
    }
    businessRailIndex = Math.max(0, Math.min(businessRailIndex, Math.max(0, businesses.length - 3)));
    const visible = businesses.length <= 3 ? businesses : businesses.slice(businessRailIndex, businessRailIndex + 3);
    rail.innerHTML = visible.map(business => `
        <article class="community-business-card" data-business-card="${escapeHtml(business.id)}">
            <div class="community-business-card-main">
                ${businessLogoHtml(business, "community-business-logo")}
                <div class="community-business-copy">
                    <strong>${escapeHtml(business.nombre || "Negocio")}</strong>
                    <span>${escapeHtml(business.categoria || "Negocio de la comunidad")}</span>
                </div>
            </div>
            <div class="community-business-proof" data-business-proof="${escapeHtml(business.id)}">
                <span class="community-proof-loading">Consultando reseñas…</span>
            </div>
            <a class="community-business-link" href="negocio.html?id=${encodeURIComponent(business.id)}">Ver perfil <i class="fa-solid fa-arrow-right"></i></a>
        </article>`).join("");

    visible.forEach(async business => {
        const target = rail.querySelector(`[data-business-proof="${CSS.escape(String(business.id))}"]`);
        if (!target) return;
        const [reviewResult, publicationResult] = await Promise.all([
            BusinessService.getPublicBusinessReviews(business.id),
            CommunityService.getPublications({ businessId: business.id, limit: 100 })
        ]);
        if (!target.isConnected) return;
        const reviewError = reviewResult.error;
        const reviews = reviewResult.data || [];
        const publicationError = publicationResult.error;
        const publicationCount = (publicationResult.data || []).length;
        const ratingHtml = !reviewError && reviews.length
            ? (() => {
                const average = reviews.reduce((sum, review) => sum + Number(review.estrellas || 0), 0) / reviews.length;
                return `<span class="community-proof-stars" aria-label="Calificación ${average.toFixed(1)} de 5">★ ${average.toFixed(1)}</span><span class="community-proof-count">${reviews.length} ${reviews.length === 1 ? "reseña" : "reseñas"}</span>`;
            })()
            : `<span class="community-proof-muted">${reviewError ? "Calificación no disponible" : "Sin reseñas"}</span>`;
        const publicationHtml = !publicationError
            ? `<span class="community-proof-count">${publicationCount} ${publicationCount === 1 ? "publicación" : "publicaciones"}</span>`
            : "";
        target.innerHTML = ratingHtml + publicationHtml;
    });
}

function stepBusinessRail(direction) {
    const businesses = [...publicBusinessesById.values()];
    if (businesses.length <= 3) return;
    const max = businesses.length - 3;
    businessRailIndex += direction;
    if (businessRailIndex > max) businessRailIndex = 0;
    if (businessRailIndex < 0) businessRailIndex = max;
    renderBusinessRail();
}

function startBusinessRail() {
    if (businessRailTimer) clearInterval(businessRailTimer);
    const businesses = [...publicBusinessesById.values()];
    if (businesses.length <= 3) return;
    businessRailTimer = setInterval(() => stepBusinessRail(1), 5200);
}

function renderHeaderAvatar() {
    const target = document.getElementById("communityHeaderAvatar");
    if (!target || !currentUser) return;
    getAuthorProfile(currentUser.id).then(profile => {
        target.innerHTML = profile?.photo
            ? `<img src="${escapeHtml(profile.photo)}" alt="Foto de perfil">`
            : `<span>${escapeHtml(initials(profile?.name))}</span>`;
    }).catch(() => {});
}

function renderFeaturedBusiness() {
    const container = document.getElementById("featuredBusinessCard");
    if (!container) return;
    const business = shuffleItems([...publicBusinessesById.values()])[0];
    if (!business) {
        container.innerHTML = `<div class="side-card-title"><i class="fa-solid fa-store"></i><strong>Negocio destacado</strong></div><p class="side-card-muted">Pronto habrá negocios destacados de tu comunidad.</p>`;
        return;
    }
    container.innerHTML = `
      <div class="side-card-title"><i class="fa-solid fa-store"></i><strong>Negocio destacado en neXsv</strong></div>
      ${businessLogoHtml(business, "featured-logo")}
      <span class="featured-badge">En neXsv</span>
      <h3>${escapeHtml(business.nombre || "Negocio")}</h3>
      <p>${escapeHtml(business.descripcion || business.categoria || "Negocio de tu comunidad")}</p>
      <a class="featured-action" href="negocio.html?id=${encodeURIComponent(business.id)}">Conoce su tarjeta <i class="fa-solid fa-arrow-right"></i></a>`;
}

function renderRecommendedBusinesses() {
    const container = document.getElementById("communityRecommendedBusinesses");
    if (!container) return;
    const featuredHref = document.querySelector("#featuredBusinessCard a.featured-action")?.getAttribute("href") || "";
    const featuredId = new URLSearchParams(featuredHref.split("?")[1] || "").get("id");
    const businesses = shuffleItems([...publicBusinessesById.values()].filter(business => business.id !== featuredId)).slice(0, 3);
    if (!businesses.length) {
        container.innerHTML = `<p class="side-card-muted">Estamos incorporando más negocios para ti.</p>`;
        return;
    }
    container.innerHTML = businesses.map(business => `
      <div class="recommended-business-row">
        ${businessLogoHtml(business, "mini-business-logo")}
        <div class="recommended-business-copy"><strong>${escapeHtml(business.nombre || "Negocio")}</strong><span>${escapeHtml(business.categoria || "Negocio")}</span></div>
        <a href="negocio.html?id=${encodeURIComponent(business.id)}">Explorar</a>
      </div>`).join("");
}

function renderCommunitySidebars(publications) {
    renderFeaturedBusiness();
    renderRecommendedBusinesses();
    const container = document.getElementById("communityUsersList");
    if (!container) return;
    const seen = new Set();
    const users = [];
    (publications || []).forEach(p => {
        if (p.business_id || !p.author || seen.has(p.author_id)) return;
        seen.add(p.author_id);
        users.push(p);
    });
    container.innerHTML = users.slice(0, 3).map(p => `
      <div class="community-user-row">
        <div class="mini-avatar">${p.author?.photo ? `<img src="${escapeHtml(p.author.photo)}" alt="">` : escapeHtml(initials(p.author?.name))}</div>
        <div class="community-user-copy"><strong>${escapeHtml(p.author?.name || "Miembro neXsv")}</strong><span>Parte de la comunidad</span></div>
        <button type="button" data-jump-publication="${escapeHtml(p.id)}">Ver</button>
      </div>`).join("") || `<p class="side-card-muted">Cuando haya más publicaciones, aquí verás personas de tu comunidad.</p>`;
}

function renderEmpty() { publicationList.innerHTML = `<div class="community-empty"><div class="community-empty-icon"><i class="fa-regular fa-comments"></i></div><h2>Aún no hay publicaciones</h2><p>Sé de las primeras personas en compartir algo con la comunidad.</p><button type="button" class="community-secondary-btn" id="emptyCreateBtn">Crear publicación</button></div>`; document.getElementById("emptyCreateBtn")?.addEventListener("click", openComposer); }
function renderError(error) { console.error("Error en Comunidad:", error); publicationList.innerHTML = `<div class="community-empty"><div class="community-empty-icon warning"><i class="fa-solid fa-triangle-exclamation"></i></div><h2>No pudimos cargar la comunidad</h2><p>${escapeHtml(error?.message || "Actualiza la página e inténtalo nuevamente.")}</p></div>`; }

function renderFeedBusinessCard(business) {
    if (!business) return "";
    const description = business.descripcion || business.categoria || "Conoce más sobre este negocio de la comunidad.";
    return `<article class="community-feed-business" data-feed-business="${escapeHtml(business.id)}"><div class="community-feed-business-kicker"><i class="fa-solid fa-store"></i> Descubre en neXsv</div><div class="community-feed-business-main">${businessLogoHtml(business, "community-feed-business-logo")}<div><h3>${escapeHtml(business.nombre || "Negocio de la comunidad")}</h3><span>${escapeHtml(business.categoria || "Negocio")}</span></div></div><p>${escapeHtml(description)}</p><a href="negocio.html?id=${encodeURIComponent(business.id)}">Conoce este negocio <i class="fa-solid fa-arrow-right"></i></a></article>`;
}

function buildCommunityFeedSequence(publications) {
    if (currentFilter !== "TODAS") return publications.map(publication => ({ kind: "publication", publication }));
    const recommendations = publications.filter(item => item.type === "RECOMENDACION");
    const general = publications.filter(item => item.type !== "RECOMENDACION");
    const businesses = shuffleItems([...publicBusinessesById.values()]);
    const sequence = [];
    let recommendationIndex = 0, generalIndex = 0, businessIndex = 0;
    while (recommendationIndex < recommendations.length || generalIndex < general.length || businessIndex < businesses.length) {
        let first = 0;
        while (first < 2 && recommendationIndex < recommendations.length) {
            sequence.push({ kind: "publication", publication: recommendations[recommendationIndex++] });
            first++;
        }
        if (first === 0) {
            while (first < 2 && generalIndex < general.length) {
                sequence.push({ kind: "publication", publication: general[generalIndex++] });
                first++;
            }
        }
        if (businessIndex < businesses.length) sequence.push({ kind: "business", business: businesses[businessIndex++] });
        if (generalIndex < general.length) sequence.push({ kind: "publication", publication: general[generalIndex++] });
    }
    return sequence;
}

function renderPublications(publications) {
    renderCommunitySidebars(publications);
    if (!publications.length) return renderEmpty();
    const renderPublication = p => {
        const isMine = !p.isLegacyReview && p.author_id === currentUser.id;
        const canManage = isMine;
        const images = (p.images || []).map(image => `<img src="${escapeHtml(image.public_url)}" alt="Imagen de publicación" loading="lazy">`).join("");
        const commentCount = Number(p.commentCount || 0);
        const isRecommendation = p.type === "RECOMENDACION";
        const business = p.business_id ? publicBusinessesById.get(p.business_id) : null;
        // Solo las recomendaciones vinculadas a un negocio (reseñas) usan la tarjeta editorial especial.
        const isBusinessRecommendation = isRecommendation && Boolean(business);
        const recommendationParts = isBusinessRecommendation ? String(p.body || "").split(/\\n|[\r\n]/, 2) : [];
        const recommendationStars = isBusinessRecommendation ? (recommendationParts[0] || "").trim() : "";
        const recommendationRating = isBusinessRecommendation ? Math.max(1, Math.min(5, (recommendationStars.match(/★/g) || []).length)) : 0;
        const recommendationLabel = ({5:"¡Súper recomendado!",4:"¡Recomendado!",3:"Medianamente recomendado",2:"Poco recomendado",1:"No recomendado"})[recommendationRating] || "Recomendación";
        const recommendationText = isBusinessRecommendation ? (recommendationParts.length > 1 ? recommendationParts[1] : p.body || "") : p.body;
        const businessPhoto = isBusinessRecommendation ? (business?.referencePhoto || "") : "";
        const businessLink = business ? `<a class="publication-business-link${isBusinessRecommendation ? " recommendation-business-link" : ""}" href="negocio.html?id=${encodeURIComponent(business.id)}"><span class="recommendation-business-info">${businessLogoHtml(business, "publication-business-logo")}<span class="recommendation-business-copy"><strong>${escapeHtml(business.nombre || "Negocio")}</strong><small>${escapeHtml(business.categoria || "Negocio de la comunidad")}</small></span><em>Ver negocio <i class="fa-solid fa-arrow-right"></i></em></span>${businessPhoto ? `<img class="recommendation-business-photo" src="${escapeHtml(businessPhoto)}" alt="Fotografía de ${escapeHtml(business.nombre || "negocio")}" loading="lazy">` : ""}</a>` : "";
        return `<article class="publication-card${isBusinessRecommendation ? " publication-card-recommendation" : ""}" data-publication-id="${escapeHtml(p.id)}">
            <div class="publication-author">
                ${avatarHtml(p.author)}
                <div class="author-info">
                    <strong>${escapeHtml(p.author.name)}</strong>
                    <span>${p.isLegacyReview ? "Reseña histórica · " : "Miembro de neXsv · "}${escapeHtml(formatDate(p.created_at))}${!p.isLegacyReview && p.updated_at && p.updated_at !== p.created_at ? " · Editada" : ""}</span>
                </div>
                <span class="publication-type">${isRecommendation ? '<i class="fa-regular fa-heart"></i> Recomendación' : escapeHtml(TYPE_LABELS[p.type] || p.type)}</span>
            </div>
            ${isBusinessRecommendation ? `<h2 class="recommendation-rating-title">${recommendationLabel}</h2><div class="recommendation-review-copy"><div class="recommendation-rating-line"><span class="recommendation-stars" aria-label="${recommendationRating} de 5 estrellas">${escapeHtml(recommendationStars)}</span><span class="recommendation-rating-number">${recommendationRating} de 5</span></div><p>${escapeHtml(recommendationText)}</p></div>` : (p.title ? `<h2>${escapeHtml(p.title)}</h2>` : "")}
            ${!isBusinessRecommendation ? `<p class="publication-body">${escapeHtml(p.body)}</p>` : ""}
            ${businessLink}
            ${images ? `<div class="publication-images">${images}</div>` : ""}
            <div class="publication-actions">
                ${p.isLegacyReview ? `<span class="legacy-review-label"><i class="fa-regular fa-clock"></i> Reseña anterior a la comunidad</span>` : (canManage
                    ? `<button type="button" class="edit-publication-btn" data-edit="${escapeHtml(p.id)}"><i class="fa-regular fa-pen-to-square"></i> Editar</button><button type="button" class="delete-publication-btn" data-delete="${escapeHtml(p.id)}"><i class="fa-regular fa-trash-can"></i> Eliminar</button>`
                    : `<button class="interest-btn" type="button" data-interest="${escapeHtml(p.id)}" data-author="${escapeHtml(p.author_id)}"><i class="fa-regular fa-handshake"></i> Me interesa</button>`)}
                ${!p.isLegacyReview ? `<button class="comment-toggle-btn${commentCount ? " has-comments" : ""}" type="button" data-comments="${escapeHtml(p.id)}"><i class="fa-regular fa-comment"></i> ${commentCount ? commentCount : "Comentar"}</button>` : ""}
            </div>
            <div class="publication-comments" id="comments-${escapeHtml(p.id)}" hidden>
                <div class="comments-header"><div><strong>Comentarios</strong><span>Pregunta, comenta o comparte tu experiencia con tu comunidad.</span></div></div>
                <div class="comments-list" data-comments-list="${escapeHtml(p.id)}"><div class="comments-loading">Cargando comentarios...</div></div>
                <form class="comment-form" data-comment-form="${escapeHtml(p.id)}"><textarea maxlength="1000" rows="2" placeholder="Escribe un comentario..." required></textarea><button type="submit" class="comment-send-btn"><i class="fa-solid fa-paper-plane"></i><span>Comentar</span></button></form>
            </div>
        </article>`;
    };
    const feedSequence = buildCommunityFeedSequence(publications);
    publicationList.innerHTML = feedSequence.map(item => item.kind === "business" ? renderFeedBusinessCard(item.business) : renderPublication(item.publication)).join("");

    publicationList.querySelectorAll("[data-interest]").forEach(button => button.addEventListener("click", () => startConversation(button)));
    publicationList.querySelectorAll("[data-edit]").forEach(button => button.addEventListener("click", () => openEditPublication(button.dataset.edit)));
    publicationList.querySelectorAll("[data-delete]").forEach(button => button.addEventListener("click", () => deletePublication(button.dataset.delete)));
    publicationList.querySelectorAll("[data-comments]").forEach(button => button.addEventListener("click", () => toggleComments(button)));
    publicationList.querySelectorAll("[data-comment-form]").forEach(form => form.addEventListener("submit", submitComment));
    document.querySelectorAll("[data-jump-publication]").forEach(button => button.addEventListener("click", () => {
        const card = document.querySelector(`[data-publication-id="${CSS.escape(button.dataset.jumpPublication)}"]`);
        card?.scrollIntoView({ behavior: "smooth", block: "center" });
    }));
    if (deepLinkedPublicationId) focusDeepLinkedPublication();
}

async function loadPublications() {
    publicationList.innerHTML = `<div class="community-loading"><i class="fa-solid fa-circle-notch fa-spin"></i><span>Cargando comunidad...</span></div>`;
    // El filtro temático se aplica sobre el contenido ya publicado; no altera datos ni consultas de escritura.
    const { data, error } = await CommunityService.getPublications({ type: currentFilter, limit: 100 });
    if (error) return renderError(error);
    let publications = await enrichPublications(data);
    if (activeCommunityTopic) {
        const terms = {
            salud: ["salud","médic","medic","doctor","clínic","clinic","dent","terapia","bienestar","psicolog"],
            ninos: ["niñ","niñ","infantil","niños","niñas","academia","natación","natacion","cumpleaños","juego","campamento","deporte"],
            educacion: ["educación","educacion","colegio","escuela","academia","clase","tutor","curso","idioma","inglés","ingles","aprendizaje"],
            restaurantes: ["restaurante","comida","cafeter","café","cafe","pizza","postre","menú","menu","cocina","alimento"]
        }[activeCommunityTopic] || [];
        publications = publications.filter(p => {
            const haystack = [p.title,p.body,p.author?.name].join(" ").toLocaleLowerCase("es");
            return terms.some(term => haystack.includes(term));
        });
    }
    const { data: commentCounts, error: commentCountError } = await CommunityService.getCommentCounts(publications.map(p => p.id));
    if (commentCountError) console.warn("No se pudieron cargar los conteos de comentarios:", commentCountError);
    publications.forEach(p => { p.commentCount = Number(commentCounts?.[p.id] || 0); });
    const feedPublications = await loadHistoricalReviewPublications(publications);
    if (activeCommunityTopic && !publications.length) {
        const labels = {salud:"Salud y bienestar",ninos:"Actividades para niños",educacion:"Educación y academias",restaurantes:"Restaurantes y sabores"};
        publicationList.innerHTML = `<div class="community-topic-empty"><strong>Aún no encontramos publicaciones sobre ${labels[activeCommunityTopic]}.</strong><p>Prueba otro tema o comparte la primera experiencia.</p><button type="button" id="emptyTopicClear">Ver todas las publicaciones</button></div>`;
        document.getElementById("emptyTopicClear")?.addEventListener("click", clearCommunityTopic);
        return;
    }
    renderPublications(feedPublications);
}

async function startConversation(button) {
    const publicationId = button.dataset.interest; const authorId = button.dataset.author;
    if (!publicationId || !authorId || authorId === currentUser.id) return;
    button.disabled = true; const original = button.innerHTML; button.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Abriendo...`;
    try { const { data: conversationId, error: conversationError } = await MessagingService.getOrCreateDirectConversation(authorId); if (conversationError || !conversationId) throw conversationError || new Error("No fue posible iniciar la conversación."); const { error: originError } = await CommunityService.setConversationOrigin(conversationId, publicationId); if (originError) console.warn("No se pudo asociar el origen de la publicación:", originError); window.location.href = `mensajes.html?conversation=${encodeURIComponent(conversationId)}`; }
    catch (error) { console.error("Error iniciando conversación:", error); const card = button.closest(".publication-card"); let feedback = card?.querySelector(".interest-feedback"); if (!feedback && card) { feedback = document.createElement("div"); feedback.className = "interest-feedback error"; card.querySelector(".publication-actions")?.prepend(feedback); } if (feedback) feedback.textContent = "No pudimos abrir la conversación. Inténtalo nuevamente."; button.disabled = false; button.innerHTML = original; }
}

async function loadCommentsInto(publicationId) { const container = document.getElementById(`comments-${publicationId}`); const list = container?.querySelector("[data-comments-list]"); if (!list) return; const { data, error } = await CommunityService.getComments(publicationId); if (error) { console.error("Error cargando comentarios de la publicación:", error); list.innerHTML = `<div class="comments-empty">No pudimos cargar los comentarios. Revisa la conexión con Supabase.</div>`; return; } if (!data.length) list.innerHTML = `<div class="comments-empty">Aún no hay comentarios. Sé la primera persona en participar.</div>`; else { const enriched = await Promise.all(data.map(async comment => ({ ...comment, author: await getAuthorProfile(comment.author_id) }))); list.innerHTML = enriched.map(comment => `<div class="comment-item">${avatarHtml(comment.author, "comment-avatar")}<div class="comment-content"><div class="comment-author-row"><strong>${escapeHtml(comment.author.name)}</strong><span>${escapeHtml(formatDate(comment.created_at))}</span></div><p>${escapeHtml(comment.body)}</p></div></div>`).join(""); } container.dataset.loaded = "1"; }
async function toggleComments(button) { const publicationId = button.dataset.comments; const container = document.getElementById(`comments-${publicationId}`); if (!container) return; const opening = container.hidden; container.hidden = !opening; button.classList.toggle("active", opening); if (opening && container.dataset.loaded !== "1") await loadCommentsInto(publicationId); }
async function submitComment(event) { event.preventDefault(); const form = event.currentTarget; const publicationId = form.dataset.commentForm; const textarea = form.querySelector("textarea"); const button = form.querySelector("button"); const body = textarea.value.trim(); if (!body) return; button.disabled = true; button.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Enviando...`; const { error } = await CommunityService.addComment(publicationId, body); button.disabled = false; button.innerHTML = `<i class="fa-solid fa-paper-plane"></i><span>Comentar</span>`; if (error) { alert(error.message || "No fue posible publicar el comentario."); return; } textarea.value = ""; const container = document.getElementById(`comments-${publicationId}`); if (container) { container.dataset.loaded = ""; await loadCommentsInto(publicationId); } const toggleButton = document.querySelector(`[data-comments="${CSS.escape(publicationId)}"]`); if (toggleButton) { const current = toggleButton.textContent.trim(); const currentMatch = current.match(/\((\d+)\)/); const nextCount = currentMatch ? Number(currentMatch[1]) + 1 : 1; toggleButton.innerHTML = `<i class="fa-regular fa-comments"></i> Comentarios (${nextCount})`; toggleButton.classList.add("has-comments"); toggleButton.classList.add("active"); }
}
function openComposer() { composer.hidden = false; showMessage(); document.getElementById("publicationBody")?.focus(); composer.scrollIntoView({ behavior: "smooth", block: "center" }); }
function clearSelectedFiles() { selectedFiles = []; if (imagesInput) imagesInput.value = ""; renderPhotoPreview(); }
function closePublicationComposer() { composer.hidden = true; showMessage(); clearSelectedFiles(); }
function renderPhotoPreview() { photoCount.textContent = selectedFiles.length ? `${selectedFiles.length} foto${selectedFiles.length === 1 ? "" : "s"} seleccionada${selectedFiles.length === 1 ? "" : "s"}` : "Ninguna foto seleccionada"; photoPreview.innerHTML = ""; selectedFiles.forEach((file, index) => { const url = URL.createObjectURL(file); const item = document.createElement("div"); item.className = "photo-preview-item"; item.innerHTML = `<img src="${url}" alt="Vista previa ${index + 1}"><button type="button" aria-label="Quitar foto"><i class="fa-solid fa-xmark"></i></button>`; item.querySelector("button").addEventListener("click", () => { selectedFiles.splice(index, 1); renderPhotoPreview(); }); photoPreview.appendChild(item); }); }

async function openEditPublication(publicationId) { const { data, error } = await CommunityService.getPublicationById(publicationId); if (error || !data || data.author_id !== currentUser.id) { alert("No fue posible abrir la publicación para editar."); return; } editingPublicationId = publicationId; editingPublicationBusinessId = data.business_id || null; const typeInput = editForm.querySelector(`input[value="${CSS.escape(data.type)}"]`); if (typeInput) typeInput.checked = true; document.querySelectorAll("#editTypeOptions .type-option").forEach(option => option.classList.toggle("active", option.querySelector("input")?.checked)); editTitle.value = data.title || ""; editBody.value = data.body || ""; showEditMessage(data.images?.length ? "Las fotos actuales se conservarán." : ""); editModal.hidden = false; editBody.focus(); }
function closeEditPublication() { editingPublicationId = null; editingPublicationBusinessId = null; editModal.hidden = true; showEditMessage(); }

function focusDeepLinkedPublication() {
    const card = document.querySelector(`[data-publication-id="${CSS.escape(deepLinkedPublicationId)}"]`);
    if (!card) return;
    card.classList.add("deep-link-highlight");
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    const commentsButton = card.querySelector("[data-comments]");
    if (window.location.hash === "#comentarios" && commentsButton) setTimeout(() => commentsButton.click(), 250);
    supabase.rpc("record_community_publication_view", { p_publication_id: deepLinkedPublicationId }).catch(() => {});
    setTimeout(() => card.classList.remove("deep-link-highlight"), 2800);
}

document.querySelectorAll("[data-business-slide]").forEach(button => button.addEventListener("click", () => stepBusinessRail(button.dataset.businessSlide === "next" ? 1 : -1)));
document.querySelectorAll("[data-side-filter]").forEach(button => button.addEventListener("click", async () => {
    currentFilter = button.dataset.sideFilter || "TODAS";
    document.querySelectorAll(".filter-btn").forEach(item => item.classList.toggle("active", item.dataset.filter === currentFilter));
    await loadPublications();
    document.getElementById("publicationList")?.scrollIntoView({ behavior: "smooth", block: "start" });
}));
addPhotosBtn?.addEventListener("click", () => imagesInput?.click());
imagesInput?.addEventListener("change", () => { const incoming = Array.from(imagesInput.files || []); const validation = CommunityService.validateImages([...selectedFiles, ...incoming]); if (!validation.valid) { showMessage(validation.error, "error"); imagesInput.value = ""; return; } selectedFiles = validation.files; showMessage(); renderPhotoPreview(); imagesInput.value = ""; });
newPublicationBtn?.addEventListener("click", openComposer); closeComposer?.addEventListener("click", closePublicationComposer);

document.getElementById("weeklyQuestionBtn")?.addEventListener("click", () => {
    const recommendationType = publicationForm?.querySelector('input[name="type"][value="RECOMENDACION"]');
    if (recommendationType) {
        recommendationType.checked = true;
        recommendationType.dispatchEvent(new Event("change", { bubbles: true }));
    }
    const titleField = document.getElementById("publicationTitle");
    const bodyField = document.getElementById("publicationBody");
    if (titleField && !titleField.value.trim()) titleField.value = "Recomendación de la comunidad";
    if (bodyField && !bodyField.value.trim()) {
        bodyField.value = `En respuesta a la pregunta: ${activeWeeklyQuestion || "¿Qué recomiendas a otras familias?"}\n\n`;
    }
    updateRecommendationBusinessField();
    openComposer();
});

function clearCommunityTopic() {
    activeCommunityTopic = null;
    document.querySelectorAll("[data-community-topic]").forEach(button => button.classList.remove("active"));
    const clear = document.getElementById("clearCommunityTopic");
    if (clear) clear.hidden = true;
    loadPublications();
}
document.querySelectorAll("[data-community-topic]").forEach(button => {
    button.addEventListener("click", () => {
        activeCommunityTopic = button.dataset.communityTopic;
        document.querySelectorAll("[data-community-topic]").forEach(item => item.classList.toggle("active", item === button));
        const clear = document.getElementById("clearCommunityTopic");
        if (clear) clear.hidden = false;
        loadPublications();
        document.getElementById("publicationList")?.scrollIntoView({behavior:"smooth",block:"start"});
    });
});
document.getElementById("clearCommunityTopic")?.addEventListener("click", clearCommunityTopic);

function initializeCommunityBanner() {
    const banner = document.getElementById("communityHeroBanner");
    const title = document.getElementById("communityBannerTitle");
    const description = document.getElementById("communityBannerDescription");
    const link = document.getElementById("communityBannerLink");
    const dots = document.getElementById("communityBannerDots");
    if (!banner || !title || !description || !link || !dots) return;

    const slides = [
        {
            title: "Conecta con familias de tu comunidad",
            description: "Recomienda, pregunta, comparte y descubre grandes oportunidades.",
            label: "Explora negocios",
            href: "negocios.html",
            image: "/cover-index.jpg"
        },
        {
            title: "Más confianza. Más oportunidades.",
            description: "Descubre servicios y negocios que forman parte de tu comunidad.",
            label: "Descubre negocios",
            href: "negocios.html",
            image: "/cover-negocios.jpg"
        },
        {
            title: "Tu experiencia puede ayudar a otra familia",
            description: "Comparte recomendaciones y encuentra respuestas dentro de neXsv.",
            label: "Compartir en la comunidad",
            href: "comunidad.html?create=1",
            image: "cover-index.jpg"
        }
    ];
    let active = 0;
    let timer = null;

    const render = () => {
        const slide = slides[active];
        title.textContent = slide.title;
        description.textContent = slide.description;
        link.href = slide.href;
        link.innerHTML = `${escapeHtml(slide.label)} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>`;
        banner.style.backgroundImage = `linear-gradient(90deg,rgba(246,249,253,.82) 0%,rgba(246,249,253,.55) 43%,rgba(246,249,253,.08) 100%),url("${slide.image}")`;
        dots.querySelectorAll("button").forEach((dot, index) => {
            dot.classList.toggle("active", index === active);
            dot.setAttribute("aria-pressed", String(index === active));
        });
    };

    dots.innerHTML = slides.map((slide, index) =>
        `<button type="button" aria-label="Mostrar banner ${index + 1}" aria-pressed="${index === 0}" class="${index === 0 ? "active" : ""}" data-banner-index="${index}"></button>`
    ).join("");

    const show = (index) => {
        active = (index + slides.length) % slides.length;
        render();
    };
    document.getElementById("communityBannerPrev")?.addEventListener("click", () => show(active - 1));
    document.getElementById("communityBannerNext")?.addEventListener("click", () => show(active + 1));
    dots.addEventListener("click", event => {
        const dot = event.target.closest("[data-banner-index]");
        if (dot) show(Number(dot.dataset.bannerIndex));
    });
    const start = () => {
        if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
        if (timer) clearInterval(timer);
        timer = setInterval(() => show(active + 1), 8000);
    };
    banner.addEventListener("mouseenter", () => { if (timer) clearInterval(timer); });
    banner.addEventListener("mouseleave", start);
    render();
    start();
}

initializeCommunityBanner();
document.querySelectorAll(".type-option input").forEach(input => input.addEventListener("change", () => document.querySelectorAll(".type-option").forEach(o => o.classList.toggle("active", o.querySelector("input")?.checked))));
document.querySelectorAll("#typeOptions input[name='type']").forEach(input => input.addEventListener("change", updateRecommendationBusinessField));
document.getElementById("recommendationInviteClose")?.addEventListener("click", closeRecommendationInvite);
document.getElementById("recommendationInviteWhatsapp")?.addEventListener("click", closeRecommendationInvite);
document.querySelectorAll("[data-close-recommendation-invite]").forEach(element => element.addEventListener("click", closeRecommendationInvite));
document.getElementById("recommendationInviteModal")?.addEventListener("click", event => { if (event.target === event.currentTarget) closeRecommendationInvite(); });
document.querySelectorAll("#editTypeOptions .type-option input").forEach(input => input.addEventListener("change", () => document.querySelectorAll("#editTypeOptions .type-option").forEach(o => o.classList.toggle("active", o.querySelector("input")?.checked))));
document.querySelectorAll(".filter-btn").forEach(button => button.addEventListener("click", async () => { currentFilter = button.dataset.filter || "TODAS"; document.querySelectorAll(".filter-btn").forEach(item => item.classList.toggle("active", item === button)); await loadPublications(); }));
document.querySelectorAll("[data-close-edit]").forEach(element => element.addEventListener("click", closeEditPublication));

publicationForm?.addEventListener("submit", async event => {
    event.preventDefault();
    showMessage();
    const type = publicationForm.querySelector("input[name='type']:checked")?.value;
    const titleField = document.getElementById("publicationTitle");
    const bodyField = document.getElementById("publicationBody");
    const businessNameField = document.getElementById("recommendationBusinessName");
    const businessName = businessNameField?.value.trim() || "";
    let title = titleField?.value.trim() || "";
    const body = bodyField?.value.trim() || "";
    const isCommunityRecommendation = type === "RECOMENDACION" && !activeBusinessId;
    const submitButton = publicationForm.querySelector("button[type='submit']");
    const validation = CommunityService.validateImages(selectedFiles);
    if (!type || !body) { showMessage("Escribe algo para poder publicar.", "error"); return; }
    if (isCommunityRecommendation && !businessName) { showMessage("Escribe el nombre del negocio que estás recomendando.", "error"); businessNameField?.focus(); return; }
    if (!validation.valid) { showMessage(validation.error, "error"); return; }
    if (!currentUser) { showMessage("Tu sesión no está disponible. Recarga la página e inténtalo nuevamente.", "error"); return; }
    if (isCommunityRecommendation && (!title || title === "Recomendación de la comunidad")) title = `Recomendación: ${businessName}`;
    submitButton.disabled = true;
    submitButton.textContent = "Publicando...";
    const { data: publication, error } = await CommunityService.createPublication({ type, title, body, businessId: activeBusinessId });
    if (error) {
        submitButton.disabled = false; submitButton.textContent = "Publicar";
        showMessage(error.message || "No fue posible publicar.", "error"); return;
    }
    if (selectedFiles.length) {
        const { error: imageError } = await CommunityService.uploadPublicationImages(publication.id, selectedFiles);
        if (imageError) {
            await CommunityService.deletePublication(publication.id);
            submitButton.disabled = false; submitButton.textContent = "Publicar";
            showMessage(`No se pudo guardar la publicación con sus fotos. ${imageError.message || "Inténtalo nuevamente."}`, "error"); return;
        }
    }
    submitButton.disabled = false;
    submitButton.textContent = "Publicar";
    publicationForm.reset();
    clearSelectedFiles();
    document.querySelectorAll(".type-option").forEach(o => o.classList.toggle("active", o.querySelector("input")?.checked));
    updateRecommendationBusinessField();
    closePublicationComposer();
    await loadPublications();
    if (isCommunityRecommendation) showRecommendationInvite(businessName);
});

editForm?.addEventListener("submit", async event => { event.preventDefault(); if (!editingPublicationId) return; showEditMessage(); const type = editForm.querySelector("input[name='editType']:checked")?.value; const title = editTitle.value.trim(); const body = editBody.value.trim(); const submitButton = editForm.querySelector("button[type='submit']"); if (!type || !body) { showEditMessage("Escribe algo para poder guardar los cambios.", "error"); return; } submitButton.disabled = true; submitButton.textContent = "Guardando..."; const { error } = await CommunityService.updatePublication(editingPublicationId, { type, title, body, businessId: editingPublicationBusinessId }); submitButton.disabled = false; submitButton.textContent = "Guardar cambios"; if (error) { console.error("Error editando publicación:", error); showEditMessage(error.message || "No fue posible guardar los cambios.", "error"); return; } closeEditPublication(); await loadPublications(); });

async function deletePublication(publicationId) {
    const card = document.querySelector(`[data-publication-id="${CSS.escape(publicationId)}"]`);
    if (!card) return;
    const publication = await CommunityService.getPublicationById(publicationId);
    if (publication.error || !publication.data || publication.data.author_id !== currentUser.id) {
        alert("No tienes permiso para eliminar esta publicación.");
        return;
    }
    if (!confirm("¿Quieres eliminar esta publicación? Dejará de mostrarse en la comunidad.")) return;
    const button = card.querySelector("[data-delete]");
    if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Eliminando...';
    }
    const { error } = await CommunityService.deletePublication(publicationId);
    if (error) {
        if (button) {
            button.disabled = false;
            button.innerHTML = '<i class="fa-regular fa-trash-can"></i> Eliminar';
        }
        alert(error.message || "No fue posible eliminar la publicación.");
        return;
    }
    await loadPublications();
}

async function loadBusinessContext() {
    const params = new URLSearchParams(window.location.search);
    activeBusinessId = params.get("business") || null;
    if (!activeBusinessId) return true;
    const result = await BusinessService.getBusinessById(activeBusinessId);
    if (result.error || !result.data) throw result.error || new Error("No se encontró el negocio.");
    activeBusiness = result.data;
    const ownerCheck = await BusinessService.isBusinessOwner(activeBusinessId);
    if (ownerCheck.error || !ownerCheck.data) throw new Error("Este negocio no pertenece a tu cuenta.");
    const context = document.getElementById("businessPublicationContext");
    if (context) {
        context.textContent = "Publicando como " + (activeBusiness.nombre || "Negocio");
        context.hidden = false;
    }
    if (newPublicationBtn) newPublicationBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Publicar como ' + escapeHtml(activeBusiness.nombre || "Negocio");
    return true;
}

function applyUrlShortcut() { const params = new URLSearchParams(window.location.search); const type = params.get("type"); const create = params.get("create") === "1"; deepLinkedPublicationId = params.get("publicacion"); if (type && TYPE_LABELS[type]) { const input = document.querySelector(`.type-option input[value="${CSS.escape(type)}"]`); if (input) { input.checked = true; document.querySelectorAll(".type-option").forEach(o => o.classList.toggle("active", o.querySelector("input")?.checked)); } currentFilter = type; document.querySelectorAll(".filter-btn").forEach(o => o.classList.toggle("active", o.dataset.filter === type)); } if (create) setTimeout(openComposer, 100); }
async function initialize() { try { chooseWeeklyQuestion(); const { data, error } = await supabase.auth.getSession(); if (error) throw error; currentUser = data.session?.user || null; if (!currentUser) { const returnTo = window.location.pathname + window.location.search; window.location.href = "/acceso/login-usuario.html?return=" + encodeURIComponent(returnTo); return; } await loadBusinessContext(); const publicBusinessesResult = await BusinessService.getPublicBusinessDirectory(); if (!publicBusinessesResult.error) {
            const businesses = publicBusinessesResult.data || [];
            await Promise.all(businesses.map(async business => {
                const mediaResult = await BusinessMediaService.getPublicBusinessMedia(business.id);
                business.referencePhoto = (mediaResult.data || []).find(item => item.url)?.url || "";
            }));
            publicBusinessesById = new Map(businesses.map(business => [business.id, business]));
        } renderBusinessRail(); startBusinessRail(); renderHeaderAvatar(); applyUrlShortcut(); await loadPublications(); } catch (error) { renderError(error); } }
window.addEventListener("keydown", event => { if (event.key === "Escape" && !editModal.hidden) closeEditPublication(); });
initialize();
