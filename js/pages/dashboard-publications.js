import CommunityService from "../services/community.service.js";
import { supabase } from "../core/supabase-client.js";

function enhancePublicationCards(cards) {
    cards.forEach(card => {
        if (card.dataset.publicationNavigation === "1") return;
        card.dataset.publicationNavigation = "1";
        card.classList.add("is-clickable");
        card.addEventListener("click", event => {
            if (event.target.closest("a,button")) return;
            const id = card.dataset.publicationId;
            if (id) window.location.href = `comunidad.html?publicacion=${encodeURIComponent(id)}`;
        });
    });
}

async function loadPublicationImages() {
    const container = document.getElementById("myPublications");
    if (!container) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const result = await CommunityService.getPublications({ authorId: user.id, limit: 3 });
    if (result.error) {
        console.warn("No se pudieron cargar las publicaciones de Mi espacio:", result.error);
        return;
    }
    const byId = new Map((result.data || []).map(publication => [publication.id, publication]));
    container.querySelectorAll("[data-publication-id]").forEach(card => {
        const publication = byId.get(card.dataset.publicationId);
        if (!publication) return;
        const image = publication.images?.[0]?.public_url;
        const currentImage = card.querySelector(".dashboard-publication-placeholder, img");
        if (image) {
            if (currentImage?.tagName === "IMG") {
                currentImage.src = image;
            } else if (currentImage) {
                const img = document.createElement("img");
                img.src = image;
                img.alt = "Imagen de publicación";
                img.loading = "lazy";
                currentImage.replaceWith(img);
            }
        }
    });
    enhancePublicationCards([...container.querySelectorAll("[data-publication-id]")]);
}

async function initializeBusinessVisibility() {
    const action = document.getElementById("spaceBusinessAction");
    if (!action) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { count, error } = await supabase.from("businesses").select("id", { count: "exact", head: true }).eq("owner_id", user.id);
    if (error) {
        action.hidden = true;
        return;
    }
    action.hidden = !(Number(count) > 0);
}

function initialize() {
    initializeBusinessVisibility();
    const container = document.getElementById("myPublications");
    if (!container) return;
    const observer = new MutationObserver(() => {
        const cards = [...container.querySelectorAll("[data-publication-id]")];
        if (!cards.length) return;
        enhancePublicationCards(cards);
        if (container.dataset.imagesLoaded !== "1") {
            container.dataset.imagesLoaded = "1";
            loadPublicationImages();
        }
    });
    observer.observe(container, { childList: true, subtree: true });
    const cards = [...container.querySelectorAll("[data-publication-id]")];
    if (cards.length) {
        enhancePublicationCards(cards);
        container.dataset.imagesLoaded = "1";
        loadPublicationImages();
    }
}

document.addEventListener("DOMContentLoaded", initialize);
