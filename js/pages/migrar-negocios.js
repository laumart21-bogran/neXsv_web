import AuthService from "../auth/auth.service.js";
import { supabase } from "../core/supabase-client.js";

const LEGACY_URL = "https://script.google.com/macros/s/AKfycbzBJjz-YlrDG6qQQNiPzixOhaKwgtLux29H3T_9gcvvIJeHKaYhT-nsWwwKu7jcdUd/exec";
const CHUNK_SIZE = 25;
const JSONP_TIMEOUT = 30000;

const button = document.getElementById("btnMigrar");
const status = document.getElementById("estado");

function setStatus(message, type = "") {
    status.textContent = message;
    status.className = type;
}

function loadLegacyBusinesses() {
    return new Promise((resolve, reject) => {
        const callbackName = `nexsvLegacyCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const script = document.createElement("script");
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error("Tiempo de espera agotado al consultar la fuente histórica."));
        }, JSONP_TIMEOUT);

        function cleanup() {
            clearTimeout(timeout);
            delete window[callbackName];
            script.remove();
        }

        window[callbackName] = (payload) => {
            cleanup();
            resolve(payload);
        };

        script.onerror = () => {
            cleanup();
            reject(new Error("No se pudo cargar la fuente histórica de negocios."));
        };

        script.src = `${LEGACY_URL}?callback=${encodeURIComponent(callbackName)}`;
        document.head.appendChild(script);
    });
}

async function migrate() {
    button.disabled = true;
    setStatus("1/3 Verificando sesión de administrador…");

    const { data: sessionData, error: sessionError } = await AuthService.getSession();
    if (sessionError || !sessionData?.session) {
        setStatus("Debes iniciar sesión con una cuenta administradora de neXsv.", "error");
        button.disabled = false;
        return;
    }

    setStatus("2/3 Leyendo negocios de la fuente histórica…");

    let payload;
    try {
        payload = await loadLegacyBusinesses();
    } catch (error) {
        console.error("Error leyendo fuente histórica:", error);
        setStatus(
            "No se pudo conectar con la fuente histórica de negocios. Revisa que la implementación del Apps Script esté activa.",
            "error"
        );
        button.disabled = false;
        return;
    }

    const businesses = Array.isArray(payload?.negocios) ? payload.negocios : [];

    if (payload?.error) {
        console.error("Error de Apps Script:", payload);
        setStatus(`La fuente histórica reportó un error: ${payload.error}`, "error");
        button.disabled = false;
        return;
    }

    if (!businesses.length) {
        setStatus("La fuente histórica no devolvió negocios. No se modificó Supabase.", "error");
        button.disabled = false;
        return;
    }

    setStatus(`3/3 Migrando ${businesses.length} negocios a Supabase…`);

    let inserted = 0;
    let skipped = 0;

    for (let i = 0; i < businesses.length; i += CHUNK_SIZE) {
        const chunk = businesses.slice(i, i + CHUNK_SIZE);
        const { data, error } = await supabase.rpc("migrate_legacy_businesses", {
            p_businesses: chunk
        });

        if (error) {
            console.error("Error en migración:", error);
            setStatus(
                `La migración se detuvo en el bloque ${Math.floor(i / CHUNK_SIZE) + 1}.\n\n${error.message}\n\nLos bloques anteriores sí quedaron guardados.`,
                "error"
            );
            button.disabled = false;
            return;
        }

        inserted += Number(data?.inserted || 0);
        skipped += Number(data?.skipped || 0);

        setStatus(`Migrando… ${Math.min(i + CHUNK_SIZE, businesses.length)} de ${businesses.length}`);
    }

    setStatus(
        `Migración terminada.\n\nNuevos negocios incorporados: ${inserted}\nYa existentes / omitidos: ${skipped}\n\nAhora puedes volver al directorio de negocios.`,
        "ok"
    );
}

button?.addEventListener("click", migrate);
