import { supabase } from "../core/supabase-client.js";
import { APP_CONFIG } from "../core/config.js";
import AuthSession from "../auth/auth.session.js";

// "Ahora no" solo pausa el aviso durante esta pestaña; no bloquea futuras visitas.
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
    if (!anchor || document.getElementById("nexsvPushInvite")) return null;

    const el = document.createElement("section");
    el.id = "nexsvPushInvite";
    el.className = "nexsv-push-invite";
    const buttonLabel = permission === "granted"
        ? "Completar activación"
        : permission === "denied" ? "Ver instrucciones" : "Activar notificaciones";
    const initialStatus = permission === "denied"
        ? "Las notificaciones están bloqueadas para este sitio. Habilítalas en los permisos de Chrome y vuelve a intentarlo."
        : "";
    el.innerHTML = `<span class="nexsv-push-invite-icon"><i class="fa-regular fa-bell"></i></span>
      <div class="nexsv-push-invite-copy">
        <strong>Mantente conectado con tu comunidad</strong>
        <p>No te pierdas mensajes y novedades importantes de neXsv.</p>
        <small id="nexsvPushStatus" role="status">${initialStatus}</small>
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
    if (Notification.permission === "denied") {
        status.textContent = "Chrome tiene bloqueado el permiso. Abre los permisos del sitio, cambia Notificaciones a Permitir y vuelve a pulsar aquí.";
        return;
    }

    button.disabled = true;
    try {
        let permission = Notification.permission;
        if (permission === "default") permission = await Notification.requestPermission();
        if (permission !== "granted") {
            throw new Error("No se concedió el permiso de notificaciones. Puedes intentarlo nuevamente cuando quieras.");
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

// Reutiliza el gestor de sesión que inicializa el resto de neXsv.
async function getSessionWhenReady() {
    try {
        if (!AuthSession.isInitialized()) {
            await AuthSession.initialize();
        }

        let session = AuthSession.getSession();
        if (session?.user && session.access_token) return session;

        // Respaldo: consulta directamente el mismo cliente compartido.
        const { data, error } = await supabase.auth.getSession();
        if (error) console.warn("Push: error consultando la sesión:", error);
        session = data?.session || null;
        if (session?.user && session.access_token) return session;

        console.info("Push: no se encontró una sesión autenticada en AuthSession ni en Supabase.");
        return null;
    } catch (error) {
        console.error("Push: no se pudo inicializar la sesión:", error);
        return null;
    }
}

async function init() {
    const push = APP_CONFIG.push || {};
    if (!push.vapidPublicKey || !push.projectUrl || !push.publishableKey ||
        !("Notification" in window) || !("serviceWorker" in navigator) ||
        !("PushManager" in window) || sessionStorage.getItem(DISMISSED) === "1") return;

    const session = await getSessionWhenReady();
    if (!session?.user || !session.access_token) {
        console.info("Push: aviso no mostrado porque no se encontró una sesión autenticada.");
        return;
    }

    let registered = false;
    if (Notification.permission === "granted") {
        try {
            const result = await pushRequest(session.access_token, { action: "status" });
            registered = result.registered === true;
        } catch (err) {
            console.warn("No se pudo consultar el estado de Push; se mostrará la invitación:", err);
        }
    }
    if (registered) {
        console.info("Push: este usuario ya tiene un dispositivo registrado.");
        return;
    }

    const el = createInvite(Notification.permission);
    if (!el) {
        console.warn("Push: no se encontró un espacio de la página donde insertar el aviso.");
        return;
    }
    const button = el.querySelector("#nexsvPushEnable");
    button.addEventListener("click", () => activate(el, button, session.access_token));
    el.querySelector("#nexsvPushLater").addEventListener("click", () => {
        sessionStorage.setItem(DISMISSED, "1");
        el.remove();
    });
    console.info("Push: invitación mostrada. Permiso actual:", Notification.permission);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
    init();
}
