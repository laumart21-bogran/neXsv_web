import CommunityService from "../services/community.service.js";
import MessagingService from "../services/messaging.service.js";
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
let selectedFiles = [];
let editingPublicationId = null;

const TYPE_LABELS = { VENTA: "Vendo", INTERCAMBIO: "Intercambio", BUSCO: "Busco", REGALO: "Regalo", RECOMENDACION: "Recomiendo", OFERTA: "Ofrezco", EVENTO: "Evento" };

function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function initials(name = "Miembro") { return String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join("") || "M"; }
function formatDate(value) { const date = new Date(value); if (Number.isNaN(date.getTime())) return ""; return new Intl.DateTimeFormat("es-SV", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date); }
function showMessage(text, type = "") { publicationMessage.textContent = text || ""; publicationMessage.className = `form-message ${type}`.trim(); }
function showEditMessage(text, type = "") { editMessage.textContent = text || ""; editMessage.className = `form-message ${type}`.trim(); }

async function getAuthorProfile(userId) {
    const { data, error } = await supabase.from("profiles").select("nombre, apellido, foto").eq("auth_user_id", userId).maybeSingle();
    if (error || !data) return { name: "Miembro neXsv", photo: null };
    return { name: [data.nombre, data.apellido].filter(Boolean).join(" ").trim() || "Miembro neXsv", photo: data.foto || null };
}
async function enrichPublications(publications) { return Promise.all((publications || []).map(async p => ({ ...p, author: await getAuthorProfile(p.author_id) }))); }
function renderEmpty() { publicationList.innerHTML = `<div class="community-empty"><div class="community-empty-icon"><i class="fa-regular fa-comments"></i></div><h2>Aún no hay publicaciones</h2><p>Sé de las primeras personas en compartir algo con la comunidad.</p><button type="button" class="community-secondary-btn" id="emptyCreateBtn">Crear publicación</button></div>`; document.getElementById("emptyCreateBtn")?.addEventListener("click", openComposer); }
function renderError(error) { console.error("Error en Comunidad:", error); publicationList.innerHTML = `<div class="community-empty"><div class="community-empty-icon warning"><i class="fa-solid fa-triangle-exclamation"></i></div><h2>No pudimos cargar la comunidad</h2><p>${escapeHtml(error?.message || "Actualiza la página e inténtalo nuevamente.")}</p></div>`; }

function renderPublications(publications) {
    if (!publications.length) return renderEmpty();
    publicationList.innerHTML = publications.map(p => {
        const isMine = p.author_id === currentUser.id;
        const images = (p.images || []).map(image => `<img src="${escapeHtml(image.public_url)}" alt="Imagen de publicación" loading="lazy">`).join("");
        return `<article class="publication-card" data-publication-id="${escapeHtml(p.id)}">
            <div class="publication-author"><div class="author-avatar">${escapeHtml(initials(p.author.name))}</div><div class="author-info"><strong>${escapeHtml(p.author.name)}</strong><span>${escapeHtml(formatDate(p.created_at))}${p.updated_at && p.updated_at !== p.created_at ? " · Editada" : ""}</span></div><span class="publication-type">${escapeHtml(TYPE_LABELS[p.type] || p.type)}</span></div>
            ${p.title ? `<h2>${escapeHtml(p.title)}</h2>` : ""}
            <p class="publication-body">${escapeHtml(p.body)}</p>
            ${images ? `<div class="publication-images">${images}</div>` : ""}
            <div class="publication-actions">${isMine
                ? `<button type="button" class="edit-publication-btn" data-edit="${escapeHtml(p.id)}"><i class="fa-regular fa-pen-to-square"></i> Editar publicación</button>`
                : `<button class="interest-btn" type="button" data-interest="${escapeHtml(p.id)}" data-author="${escapeHtml(p.author_id)}"><i class="fa-regular fa-comment-dots"></i> Me interesa</button>`}</div>
        </article>`;
    }).join("");
    publicationList.querySelectorAll("[data-interest]").forEach(button => button.addEventListener("click", () => startConversation(button)));
    publicationList.querySelectorAll("[data-edit]").forEach(button => button.addEventListener("click", () => openEditPublication(button.dataset.edit)));
}

async function loadPublications() {
    publicationList.innerHTML = `<div class="community-loading"><i class="fa-solid fa-circle-notch fa-spin"></i><span>Cargando comunidad...</span></div>`;
    const { data, error } = await CommunityService.getPublications({ type: currentFilter });
    if (error) return renderError(error);
    renderPublications(await enrichPublications(data));
}

async function startConversation(button) {
    const publicationId = button.dataset.interest;
    const authorId = button.dataset.author;
    if (!publicationId || !authorId || authorId === currentUser.id) return;
    button.disabled = true;
    const original = button.innerHTML;
    button.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Abriendo...`;
    try {
        const { data: conversationId, error: conversationError } = await MessagingService.getOrCreateDirectConversation(authorId);
        if (conversationError || !conversationId) throw conversationError || new Error("No fue posible iniciar la conversación.");
        const { error: originError } = await CommunityService.setConversationOrigin(conversationId, publicationId);
        if (originError) console.warn("No se pudo asociar el origen de la publicación:", originError);
        window.location.href = `mensajes.html?conversation=${encodeURIComponent(conversationId)}`;
    } catch (error) {
        console.error("Error iniciando conversación:", error);
        const card = button.closest(".publication-card");
        let feedback = card?.querySelector(".interest-feedback");
        if (!feedback && card) { feedback = document.createElement("div"); feedback.className = "interest-feedback error"; card.querySelector(".publication-actions")?.prepend(feedback); }
        if (feedback) feedback.textContent = "No pudimos abrir la conversación. Inténtalo nuevamente.";
        button.disabled = false;
        button.innerHTML = original;
    }
}

function openComposer() { composer.hidden = false; showMessage(); document.getElementById("publicationBody")?.focus(); composer.scrollIntoView({ behavior: "smooth", block: "center" }); }
function clearSelectedFiles() { selectedFiles = []; if (imagesInput) imagesInput.value = ""; renderPhotoPreview(); }
function closePublicationComposer() { composer.hidden = true; showMessage(); clearSelectedFiles(); }
function renderPhotoPreview() { photoCount.textContent = selectedFiles.length ? `${selectedFiles.length} foto${selectedFiles.length === 1 ? "" : "s"} seleccionada${selectedFiles.length === 1 ? "" : "s"}` : "Ninguna foto seleccionada"; photoPreview.innerHTML = ""; selectedFiles.forEach((file, index) => { const url = URL.createObjectURL(file); const item = document.createElement("div"); item.className = "photo-preview-item"; item.innerHTML = `<img src="${url}" alt="Vista previa ${index + 1}"><button type="button" aria-label="Quitar foto"><i class="fa-solid fa-xmark"></i></button>`; item.querySelector("button").addEventListener("click", () => { selectedFiles.splice(index, 1); renderPhotoPreview(); }); photoPreview.appendChild(item); }); }

async function openEditPublication(publicationId) {
    const { data, error } = await CommunityService.getPublicationById(publicationId);
    if (error || !data || data.author_id !== currentUser.id) { alert("No fue posible abrir la publicación para editar."); return; }
    editingPublicationId = publicationId;
    editForm.querySelector(`input[value="${CSS.escape(data.type)}"]`).checked = true;
    document.querySelectorAll("#editTypeOptions .type-option").forEach(option => option.classList.toggle("active", option.querySelector("input")?.checked));
    editTitle.value = data.title || "";
    editBody.value = data.body || "";
    showEditMessage(data.images?.length ? "Las fotos actuales se conservarán." : "");
    editModal.hidden = false;
    editBody.focus();
}
function closeEditPublication() { editingPublicationId = null; editModal.hidden = true; showEditMessage(); }

addPhotosBtn?.addEventListener("click", () => imagesInput?.click());
imagesInput?.addEventListener("change", () => { const incoming = Array.from(imagesInput.files || []); const validation = CommunityService.validateImages([...selectedFiles, ...incoming]); if (!validation.valid) { showMessage(validation.error, "error"); imagesInput.value = ""; return; } selectedFiles = validation.files; showMessage(); renderPhotoPreview(); imagesInput.value = ""; });
newPublicationBtn?.addEventListener("click", openComposer);
closeComposer?.addEventListener("click", closePublicationComposer);
document.querySelectorAll(".type-option input").forEach(input => input.addEventListener("change", () => document.querySelectorAll(".type-option").forEach(o => o.classList.toggle("active", o.querySelector("input")?.checked))));
document.querySelectorAll("#editTypeOptions .type-option input").forEach(input => input.addEventListener("change", () => document.querySelectorAll("#editTypeOptions .type-option").forEach(o => o.classList.toggle("active", o.querySelector("input")?.checked))));
document.querySelectorAll(".filter-btn").forEach(button => button.addEventListener("click", async () => { currentFilter = button.dataset.filter || "TODAS"; document.querySelectorAll(".filter-btn").forEach(item => item.classList.toggle("active", item === button)); await loadPublications(); }));
document.querySelectorAll("[data-close-edit]").forEach(element => element.addEventListener("click", closeEditPublication));

publicationForm?.addEventListener("submit", async event => {
    event.preventDefault(); showMessage();
    const type = publicationForm.querySelector("input[name='type']:checked")?.value;
    const title = document.getElementById("publicationTitle")?.value.trim() || "";
    const body = document.getElementById("publicationBody")?.value.trim() || "";
    const submitButton = publicationForm.querySelector("button[type='submit']");
    const validation = CommunityService.validateImages(selectedFiles);
    if (!type || !body) { showMessage("Escribe algo para poder publicar.", "error"); return; }
    if (!validation.valid) { showMessage(validation.error, "error"); return; }
    if (!currentUser) { showMessage("Tu sesión no está disponible. Recarga la página e inténtalo nuevamente.", "error"); return; }
    submitButton.disabled = true; submitButton.textContent = "Publicando...";
    const { data: publication, error } = await CommunityService.createPublication({ type, title, body });
    if (error) { submitButton.disabled = false; submitButton.textContent = "Publicar"; showMessage(error.message || "No fue posible publicar.", "error"); return; }
    if (selectedFiles.length) { const { error: imageError } = await CommunityService.uploadPublicationImages(publication.id, selectedFiles); if (imageError) { await CommunityService.deletePublication(publication.id); submitButton.disabled = false; submitButton.textContent = "Publicar"; showMessage(`No se pudo guardar la publicación con sus fotos. ${imageError.message || "Inténtalo nuevamente."}`, "error"); return; } }
    submitButton.disabled = false; submitButton.textContent = "Publicar"; publicationForm.reset(); clearSelectedFiles(); document.querySelectorAll(".type-option").forEach(o => o.classList.toggle("active", o.querySelector("input")?.checked)); closePublicationComposer(); await loadPublications();
});

editForm?.addEventListener("submit", async event => {
    event.preventDefault();
    if (!editingPublicationId) return;
    showEditMessage();
    const type = editForm.querySelector("input[name='editType']:checked")?.value;
    const title = editTitle.value.trim();
    const body = editBody.value.trim();
    const submitButton = editForm.querySelector("button[type='submit']");
    if (!type || !body) { showEditMessage("Escribe algo para poder guardar los cambios.", "error"); return; }
    submitButton.disabled = true; submitButton.textContent = "Guardando...";
    const { error } = await CommunityService.updatePublication(editingPublicationId, { type, title, body });
    submitButton.disabled = false; submitButton.textContent = "Guardar cambios";
    if (error) { console.error("Error editando publicación:", error); showEditMessage(error.message || "No fue posible guardar los cambios.", "error"); return; }
    closeEditPublication();
    await loadPublications();
});

function applyUrlShortcut() { const params = new URLSearchParams(window.location.search); const type = params.get("type"); const create = params.get("create") === "1"; if (type && TYPE_LABELS[type]) { const input = document.querySelector(`.type-option input[value="${CSS.escape(type)}"]`); if (input) { input.checked = true; document.querySelectorAll(".type-option").forEach(o => o.classList.toggle("active", o.querySelector("input")?.checked)); } currentFilter = type; document.querySelectorAll(".filter-btn").forEach(o => o.classList.toggle("active", o.dataset.filter === type)); } if (create) setTimeout(openComposer, 100); }
async function initialize() { try { const { data, error } = await supabase.auth.getUser(); if (error) throw error; currentUser = data.user || null; if (!currentUser) { window.location.href = "login.html"; return; } applyUrlShortcut(); await loadPublications(); } catch (error) { renderError(error); } }

window.addEventListener("keydown", event => { if (event.key === "Escape" && !editModal.hidden) closeEditPublication(); });
initialize();
