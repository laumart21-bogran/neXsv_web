import { supabase } from "../core/supabase-client.js";

let currentUser = null;
let observer = null;

function publicationUrl(id) {
    return new URL(`comunidad.html?publicacion=${encodeURIComponent(id)}`, window.location.href).href;
}

async function getSaveState(ids) {
    if (!ids.length) return new Map();
    const { data, error } = await supabase.rpc("get_my_community_publication_save_state", { p_publication_ids: ids });
    if (error) {
        console.warn("No se pudo cargar el estado de guardados:", error);
        return new Map();
    }
    return new Map((data || []).map(row => [row.publication_id, Boolean(row.saved)]));
}

function addActions(card, saved = false) {
    const actions = card.querySelector(".publication-actions");
    if (!actions || actions.querySelector("[data-engagement-action]")) return;
    const id = card.dataset.publicationId;
    if (!id) return;

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "publication-engagement-btn save-publication-btn";
    saveButton.dataset.engagementAction = "save";
    saveButton.dataset.publicationId = id;
    saveButton.innerHTML = `<span class="nexsv-save-icon" aria-hidden="true"><i class="fa-solid fa-thumbtack"></i></span> ${saved ? "Guardado" : "Guardar"}`;
    saveButton.classList.toggle("is-saved", saved);

    const shareButton = document.createElement("button");
    shareButton.type = "button";
    shareButton.className = "publication-engagement-btn share-publication-btn";
    shareButton.dataset.engagementAction = "share";
    shareButton.dataset.publicationId = id;
    shareButton.innerHTML = `<i class="fa-solid fa-arrow-up-from-bracket" aria-hidden="true"></i> Compartir`;

    actions.append(saveButton, shareButton);
}

async function enhanceCards() {
    if (!currentUser) return;
    const cards = [...document.querySelectorAll("#publicationList [data-publication-id]")]
        .filter(card => !card.querySelector("[data-engagement-action]"));
    if (!cards.length) return;

    const state = await getSaveState(cards.map(card => card.dataset.publicationId));
    cards.forEach(card => addActions(card, state.get(card.dataset.publicationId) === true));
}

async function toggleSave(button) {
    const id = button.dataset.publicationId;
    if (!id) return;
    button.disabled = true;
    const { data, error } = await supabase.rpc("toggle_community_publication_save", { p_publication_id: id });
    button.disabled = false;
    if (error) {
        console.error("No se pudo guardar la publicación:", error);
        return;
    }
    const saved = Boolean(data);
    button.classList.toggle("is-saved", saved);
    button.innerHTML = `<span class="nexsv-save-icon" aria-hidden="true"><i class="fa-solid fa-thumbtack"></i></span> ${saved ? "Guardado" : "Guardar"}`;
}

async function sharePublication(button) {
    const id = button.dataset.publicationId;
    if (!id) return;
    const url = publicationUrl(id);
    let shared = false;
    try {
        if (navigator.share) {
            await navigator.share({ title: "Publicación en neXsv", text: "Mira esta publicación en neXsv.", url });
            shared = true;
        } else if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(url);
            shared = true;
        } else {
            shared = window.prompt("Copia este enlace:", url) !== null;
        }
    } catch (error) {
        if (error?.name !== "AbortError") console.warn("No se pudo compartir la publicación:", error);
    }
    if (!shared) return;
    const { error } = await supabase.rpc("record_community_publication_share", { p_publication_id: id });
    if (error) console.warn("No se pudo registrar el compartido:", error);
    const original = button.innerHTML;
    button.innerHTML = `<i class="fa-solid fa-check" aria-hidden="true"></i> Compartido`;
    setTimeout(() => { if (button.isConnected) button.innerHTML = original; }, 1600);
}

function bindDelegatedActions() {
    document.addEventListener("click", event => {
        const saveButton = event.target.closest('[data-engagement-action="save"]');
        if (saveButton) {
            event.preventDefault();
            event.stopPropagation();
            toggleSave(saveButton);
            return;
        }
        const shareButton = event.target.closest('[data-engagement-action="share"]');
        if (shareButton) {
            event.preventDefault();
            event.stopPropagation();
            sharePublication(shareButton);
        }
    });
}

async function initialize() {
    const { data: { user } } = await supabase.auth.getUser();
    currentUser = user;
    if (!currentUser) return;
    bindDelegatedActions();
    const target = document.getElementById("publicationList");
    if (!target) return;
    observer = new MutationObserver(() => enhanceCards());
    observer.observe(target, { childList: true, subtree: true });
    await enhanceCards();
}

document.addEventListener("DOMContentLoaded", initialize);
window.addEventListener("beforeunload", () => observer?.disconnect());
