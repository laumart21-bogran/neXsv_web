import { supabase } from "../core/supabase-client.js";

let metricsRefreshTimer = null;
let metricsChannel = null;

async function loadMyPublicationMetrics() {
    const { data, error } = await supabase.rpc("get_my_community_publication_metrics");
    if (error) {
        console.warn("No se pudieron cargar las métricas de publicaciones. Verifica que 009_community_metrics.sql esté aplicado en Supabase:", error);
        return false;
    }
    const byId = new Map((data || []).map(item => [item.publication_id, item]));
    document.querySelectorAll("[data-publication-id]").forEach(card => {
        const metrics = byId.get(card.dataset.publicationId);
        if (!metrics) return;
        card.querySelector('[data-metric="views"]')?.replaceChildren(document.createTextNode(Number(metrics.views || 0)));
        card.querySelector('[data-metric="comments"]')?.replaceChildren(document.createTextNode(Number(metrics.comments || 0)));
        card.querySelector('[data-metric="conversations"]')?.replaceChildren(document.createTextNode(Number(metrics.conversations || 0)));
    });
    return true;
}

async function recordVisiblePublicationViews() {
    const cards = document.querySelectorAll("[data-publication-id]");
    if (!cards.length) return;
    const ids = [...cards]
        .filter(card => card.dataset.viewRecorded !== "1")
        .filter(card => card.dataset.publicationId)
        .filter(card => card.getBoundingClientRect().width > 0 && card.getBoundingClientRect().height > 0)
        .map(card => {
            card.dataset.viewRecorded = "1";
            return card.dataset.publicationId;
        });
    if (!ids.length) return;
    await Promise.all(ids.map(async id => {
        const { error } = await supabase.rpc("record_community_publication_view", { p_publication_id: id });
        if (error) console.warn("No se pudo registrar la vista de la publicación:", error);
    }));
    await loadMyPublicationMetrics();
}

async function refreshMetrics() {
    if (metricsRefreshTimer) clearTimeout(metricsRefreshTimer);
    metricsRefreshTimer = setTimeout(async () => {
        await loadMyPublicationMetrics();
        await recordVisiblePublicationViews();
    }, 150);
}

function observePublicationCards() {
    const container = document.getElementById("myPublications");
    if (!container) return;
    const observer = new MutationObserver(() => refreshMetrics());
    observer.observe(container, { childList: true, subtree: true });
    refreshMetrics();
}

function subscribeMetricChanges() {
    if (metricsChannel) supabase.removeChannel(metricsChannel);
    metricsChannel = supabase.channel("my-community-publication-metrics")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_publication_comments" }, () => refreshMetrics())
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversations" }, () => refreshMetrics())
        .subscribe();
}

document.addEventListener("DOMContentLoaded", () => {
    observePublicationCards();
    subscribeMetricChanges();
});

window.addEventListener("beforeunload", () => {
    if (metricsChannel) supabase.removeChannel(metricsChannel);
    if (metricsRefreshTimer) clearTimeout(metricsRefreshTimer);
});
