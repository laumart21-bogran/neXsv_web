import { supabase } from "../core/supabase-client.js";

async function loadMyPublicationMetrics() {
    const { data, error } = await supabase.rpc("get_my_community_publication_metrics");
    if (error || !data?.length) return;
    const byId = new Map(data.map(item => [item.publication_id, item]));
    document.querySelectorAll("[data-publication-id]").forEach(card => {
        const metrics = byId.get(card.dataset.publicationId);
        if (!metrics) return;
        card.querySelector('[data-metric="views"]')?.replaceChildren(document.createTextNode(Number(metrics.views || 0)));
        card.querySelector('[data-metric="comments"]')?.replaceChildren(document.createTextNode(Number(metrics.comments || 0)));
        card.querySelector('[data-metric="conversations"]')?.replaceChildren(document.createTextNode(Number(metrics.conversations || 0)));
    });
}

async function recordVisiblePublicationViews() {
    const cards = document.querySelectorAll("[data-publication-id]");
    if (!cards.length) return;
    const observer = new IntersectionObserver(entries => {
        entries.filter(entry => entry.isIntersecting).forEach(entry => {
            const id = entry.target.dataset.publicationId;
            if (!id || entry.target.dataset.viewRecorded === "1") return;
            entry.target.dataset.viewRecorded = "1";
            supabase.rpc("record_community_publication_view", { p_publication_id: id }).catch(() => {});
        });
    }, { threshold: 0.55 });
    cards.forEach(card => observer.observe(card));
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(async () => {
        await loadMyPublicationMetrics();
        await recordVisiblePublicationViews();
    }, 800);
});
