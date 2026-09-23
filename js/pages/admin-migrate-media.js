import { supabase } from "../core/supabase-client.js";

const MIGRATIONS = [
    {
        businessId: "3007d57a-d04e-48ee-a4d6-f434ce0ff0d0",
        name: "LMarketing",
        urls: [
            "https://res.cloudinary.com/dzbbnoxiw/image/upload/f_auto,q_auto/Diseño_sin_título_zkv43k",
            "https://res.cloudinary.com/dzbbnoxiw/image/upload/v1775238881/MKT1_jlcbgp.png",
            "https://res.cloudinary.com/dzbbnoxiw/image/upload/v1775238939/mkt2_wvs6f8.png"
        ]
    },
    {
        businessId: "afa06334-d6ee-417f-aef8-ca11cd11773c",
        name: "MovuX",
        urls: [
            "https://res.cloudinary.com/dnub0aq2j/image/upload/v1784347514/Logos_-_clientes_neXsv_5_nolw35.png",
            "https://res.cloudinary.com/dnub0aq2j/image/upload/WhatsApp_Image_2026-05-06_at_10.49.16_AM_jijcgb"
        ]
    }
];

const runButton = document.getElementById("run");
const sessionBox = document.getElementById("session");
const statusBox = document.getElementById("status");

function log(message, type = "") {
    const line = document.createElement("div");
    line.textContent = message;
    if (type) line.className = type;
    statusBox.appendChild(line);
}

function extensionFromType(type) {
    if (type === "image/png") return "png";
    if (type === "image/webp") return "webp";
    return "jpg";
}

async function migrateBusiness(item) {
    log("— " + item.name + " —");

    const { data: existing, error: existingError } = await supabase
        .from("business_media")
        .select("id, storage_path")
        .eq("business_id", item.businessId)
        .eq("tipo", "FOTO")
        .order("created_at", { ascending: true });

    if (existingError) throw existingError;

    for (let index = 0; index < item.urls.length; index += 1) {
        const sourceUrl = item.urls[index];
        const already = (existing || []).some(row =>
            row.storage_path === `migration/${item.businessId}/${String(index + 1).padStart(2, "0")}.jpg`
            || row.storage_path === `migration/${item.businessId}/${String(index + 1).padStart(2, "0")}.png`
            || row.storage_path === `migration/${item.businessId}/${String(index + 1).padStart(2, "0")}.webp`
        );

        if (already) {
            log("Foto " + (index + 1) + ": ya migrada, se conserva.");
            continue;
        }

        log("Foto " + (index + 1) + ": descargando desde Cloudinary…");

        const response = await fetch(sourceUrl, { mode: "cors", cache: "no-store" });
        if (!response.ok) throw new Error("Cloudinary respondió " + response.status);

        const blob = await response.blob();
        const mime = blob.type.startsWith("image/") ? blob.type : "image/jpeg";
        const extension = extensionFromType(mime);
        const storagePath = `migration/${item.businessId}/${String(index + 1).padStart(2, "0")}.${extension}`;

        log("Foto " + (index + 1) + ": subiendo a Supabase…");

        const { error: uploadError } = await supabase.storage
            .from("business-media")
            .upload(storagePath, blob, {
                contentType: mime,
                cacheControl: "31536000",
                upsert: false
            });

        if (uploadError) throw uploadError;

        const { error: rowError } = await supabase
            .from("business_media")
            .insert({
                business_id: item.businessId,
                owner_id: null,
                tipo: "FOTO",
                storage_path: storagePath,
                public_url: ""
            });

        if (rowError) throw rowError;

        log("Foto " + (index + 1) + ": ✓ migrada.", "ok");
    }
}

async function init() {
    const { data: userResult, error } = await supabase.auth.getUser();
    const user = userResult?.user;

    if (error || !user) {
        sessionBox.textContent = "Debes iniciar sesión en neXsv antes de usar esta herramienta.";
        sessionBox.className = "notice error";
        return;
    }

    sessionBox.innerHTML = "Sesión activa: <strong>" + (user.email || "usuario autenticado") + "</strong>";
    runButton.disabled = false;

    runButton.addEventListener("click", async () => {
        runButton.disabled = true;
        statusBox.textContent = "";

        try {
            for (const item of MIGRATIONS) {
                await migrateBusiness(item);
            }

            log("✓ Migración terminada. Ahora podemos verificar LMarketing y MovuX en la página pública.", "ok");
        } catch (error) {
            console.error(error);
            log("✗ La migración se detuvo: " + (error.message || error), "error");
            log("No se borró ningún archivo ni registro existente.", "error");
        } finally {
            runButton.disabled = false;
        }
    });
}

init();
