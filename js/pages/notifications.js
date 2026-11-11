import { supabase } from "../core/supabase-client.js";

let currentUser = null;
let refreshTimer = null;
let channel = null;

function escapeHtml(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function destination(item) {
    if (item.conversation_id) return `mensajes.html?conversation=${encodeURIComponent(item.conversation_id)}`;
    if (item.publication_id) return `comunidad.html?publicacion=${encodeURIComponent(item.publication_id)}`;
    return "comunidad.html";
}
function ensureCommunityPopover() {
    const button = document.getElementById("communityNotificationBtn");
    if (!button) return null;
    let popover = document.getElementById("communityNotificationPopover");
    if (!popover) {
        popover = document.createElement("section");
        popover.id = "communityNotificationPopover";
        popover.className = "nex-notification-popover";
        popover.hidden = true;
        popover.innerHTML = '<strong>Notificaciones</strong><div class="nex-notification-list" id="communityNotificationList"></div>';
        button.insertAdjacentElement("afterend", popover);
    }
    return popover;
}
function render(items) {
    const unread = items.filter(item => !item.read_at).length;
    ["notificationBadge", "communityNotificationBadge"].forEach(id => {
        const badge = document.getElementById(id);
        if (!badge) return;
        badge.textContent = unread > 99 ? "99+" : String(unread);
        badge.hidden = unread === 0;
    });
    ["notificationSummary", "communityNotificationSummary"].forEach(id => {
        const summary = document.getElementById(id);
        if (summary) summary.textContent = unread ? `Tienes ${unread} notificación(es) sin leer.` : "No tienes novedades.";
    });
    ["notificationList", "communityNotificationList"].forEach(id => {
        const list = document.getElementById(id);
        if (!list) return;
        list.innerHTML = items.length ? items.map(item => `
            <a class="nex-notification-item ${item.read_at ? "" : "is-unread"}" href="${destination(item)}" data-notification-id="${escapeHtml(item.id)}">
                <span class="nex-notification-dot" aria-hidden="true"></span>
                <span class="nex-notification-copy"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.body || "Tienes una nueva actividad en neXsv.")}</span><small>${new Intl.DateTimeFormat("es-SV", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}</small></span>
            </a>`).join("") : '<span class="nex-notification-empty">Todavía no tienes notificaciones.</span>';
    });
}
async function loadNotifications() {
    if (!currentUser) return;
    const { data, error } = await supabase.from("notifications")
        .select("id, notification_type, title, body, publication_id, conversation_id, created_at, read_at")
        .eq("recipient_id", currentUser.id).order("created_at", { ascending: false }).limit(20);
    if (error) {
        console.warn("No se pudieron cargar las notificaciones:", error);
        const summary = document.getElementById("notificationSummary");
        if (summary) summary.textContent = "No fue posible cargar las notificaciones.";
        return;
    }
    render(data || []);
}
function bindPopover(buttonId, popoverId) {
    const button = document.getElementById(buttonId);
    const popover = document.getElementById(popoverId);
    if (!button || !popover) return;
    button.addEventListener("click", event => {
        event.stopPropagation();
        popover.hidden = !popover.hidden;
        if (!popover.hidden) loadNotifications();
    });
    popover.addEventListener("click", async event => {
        event.stopPropagation();
        const item = event.target.closest("[data-notification-id]");
        if (!item) return;
        event.preventDefault();
        const targetUrl = item.href;
        const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() })
            .eq("id", item.dataset.notificationId).eq("recipient_id", currentUser.id);
        if (error) console.warn("No se pudo marcar la notificación como leída:", error);
        window.location.assign(targetUrl);
    });
}
async function initialize() {
    const { data: { user } } = await supabase.auth.getUser();
    currentUser = user;
    if (!currentUser) return;
    ensureCommunityPopover();
    bindPopover("notificationBtn", "notificationPopover");
    bindPopover("communityNotificationBtn", "communityNotificationPopover");
    document.addEventListener("click", () => {
        ["notificationPopover", "communityNotificationPopover"].forEach(id => {
            const popover = document.getElementById(id);
            if (popover) popover.hidden = true;
        });
    });
    await loadNotifications();
    try {
        channel = supabase.channel(`member-notifications-${currentUser.id}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `recipient_id=eq.${currentUser.id}` }, loadNotifications)
            .subscribe();
    } catch (error) { console.warn("No se pudo activar la actualización en tiempo real:", error); }
    refreshTimer = window.setInterval(loadNotifications, 60000);
}
document.addEventListener("DOMContentLoaded", initialize);
window.addEventListener("beforeunload", () => {
    if (refreshTimer) window.clearInterval(refreshTimer);
    if (channel) supabase.removeChannel(channel);
});
