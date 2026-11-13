import { supabase } from "../core/supabase-client.js";
import { APP_CONFIG } from "../core/config.js";

const DISMISSED = "nexsv-push-invite-dismissed";

function decodeKey(value) {
    const pad = "=".repeat((4 - value.length % 4) % 4);
    return Uint8Array.from(atob((value + pad).replaceAll("-", "+").replaceAll("_", "/")), c => c.charCodeAt(0));
}

async function pushRequest(accessToken, payload) {
    const { projectUrl, publishableKey } = APP_CONFIG.push || {};
    if (!projectUrl || !publishableKey) throw new Error("La conexión de notificaciones no está configurada.");
    const response = await fetch(`${projectUrl}/functions/v1/manage-push-subscription`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
            "apikey": publishableKey
        },
        body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `No se pudo completar la solicitud (${response.status}).`);
    return result;
}

function createInvite(permission) {
    const anchor = document.querySelector(".community-feed-column .community-intro")
        || document.querySelector(".dashboard-content .dashboard-header");
    if (!anchor) return null;

    const el = document.createElement("section");
    el.id = "nexsvPushInvite";
    el.className = "nexsv-push-invite";
    const buttonLabel = permission === "granted" ? "Completar activación" : "Activar notificaciones";
    el.innerHTML = `<span class="nexsv-push-invite-icon"><i class="fa-regular fa-bell"></i></span>
      <div class="nexsv-push-invite-copy">
        <strong>Mantente conectado con tu comunidad</strong>
        <p>No te pierdas mensajes y novedades importantes de neXsv.</p>
        <small id="nexsvPushStatus" role="status"></small>
      </div>
      <div class="nexsv-push-invite-actions">
        <button type="button" id="nexsvPushEnable">${buttonLabel}</button>
        <button type="button" id="nexsvPushLater">Ahora no</button>
      </div>`;
    anchor.insertAdjacentElement("afterend", el);
    return el;
}

async function activate(el, button, accessToken) {
    const status = el.querySelector("#nexsvPushStatus");
    button.disabled = true;
    try {
        let permission = Notification.permission;
        if (permission === "default") permission = await Notification.requestPermission();
        if (permission !== "granted") {
            throw new Error(permission === "denied"
                ? "El permiso está bloqueado en Chrome. Puedes habilitarlo desde la configuración del sitio."
                : "No se activaron las notificaciones.");
        }

        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: decodeKey(APP_CONFIG.push.vapidPublicKey)
            });
        }

        await pushRequest(accessToken, { action: "save", subscription: subscription.toJSON() });
        status.textContent = "¡Listo! Este dispositivo quedó registrado.";
        button.textContent = "Notificaciones activadas";
        window.setTimeout(() => el.remove(), 3000);
    } catch (error) {
        console.error("Error activando push:", error);
        status.textContent = error.message || "No fue posible completar la activación. Inténtalo nuevamente.";
        button.disabled = false;
    }
}

async function init() {
    const push = APP_CONFIG.push || {};
    if (!push.vapidPublicKey || !push.projectUrl || !push.publishableKey ||
        !("Notification" in window) || !("serviceWorker" in navigator) ||
        !("PushManager" in window) || Notification.permission === "denied" ||
        localStorage.getItem(DISMISSED) === "1") return;

    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user || !session.access_token) return;

    let registered = false;
    if (Notification.permission === "granted") {
        try {
            const result = await pushRequest(session.access_token, { action: "status" });
            registered = result.registered === true;
        } catch (err) {
            console.warn("No se pudo consultar el estado de Push:", err);
        }
    }
    if (registered) return;

    const el = createInvite(Notification.permission);
    if (!el) return;
    const button = el.querySelector("#nexsvPushEnable");
    button.addEventListener("click", () => activate(el, button, session.access_token));
    el.querySelector("#nexsvPushLater").addEventListener("click", () => {
        localStorage.setItem(DISMISSED, "1");
        el.remove();
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
    init();
}
