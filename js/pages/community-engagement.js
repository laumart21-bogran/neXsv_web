import { supabase } from "../core/supabase-client.js";

let currentUser = null;
let observer = null;

function publicationUrl(id) {
    return `https://verswqljdxiaveicdtfq.supabase.co/functions/v1/share-publication?id=${encodeURIComponent(id)}`;
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

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
    const words = String(text || "").split(/\\s+/);
    let line = "";
    let lines = 0;
    for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) {
            ctx.fillText(line, x, y + lines * lineHeight);
            lines++;
            line = word;
            if (lines >= maxLines) break;
        } else line = test;
    }
    if (line && lines < maxLines) ctx.fillText(line, x, y + lines * lineHeight);
}

async function buildStoryImage(card) {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo crear la imagen para compartir.");

    const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
    gradient.addColorStop(0, "#14284b");
    gradient.addColorStop(1, "#0d766f");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);

    ctx.fillStyle = "#f4cf52";
    ctx.beginPath();
    ctx.arc(920, 170, 230, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 64px Arial";
    ctx.fillText("neXsv", 76, 130);
    ctx.font = "600 26px Arial";
    ctx.fillStyle = "#dce8f5";
    ctx.fillText("UNA OPORTUNIDAD DE TU COMUNIDAD", 78, 205);

    const title = card.querySelector("h2")?.textContent?.trim() || "Una publicación de neXsv";
    const body = card.querySelector(".publication-body")?.textContent?.trim() || "Descubre esta publicación en nuestra comunidad.";
    const imageElement = card.querySelector(".publication-images img");
    let imageDrawn = false;
    if (imageElement?.src) {
        try {
            const response = await fetch(imageElement.src, { mode: "cors", credentials: "omit" });
            if (!response.ok) throw new Error("No se pudo recuperar la imagen.");
            const imageBitmap = await createImageBitmap(await response.blob());
            const box = { x: 76, y: 290, width: 928, height: 850 };
            const scale = Math.max(box.width / imageBitmap.width, box.height / imageBitmap.height);
            const width = imageBitmap.width * scale;
            const height = imageBitmap.height * scale;
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(box.x, box.y, box.width, box.height, 34);
            ctx.clip();
            ctx.drawImage(imageBitmap, box.x + (box.width - width) / 2, box.y + (box.height - height) / 2, width, height);
            ctx.restore();
            imageBitmap.close();
            imageDrawn = true;
        } catch (error) {
            console.warn("No se pudo incluir la imagen original en la tarjeta:", error);
        }
    }

    const titleY = imageDrawn ? 1240 : 480;
    ctx.fillStyle = "#f4cf52";
    ctx.font = "700 28px Arial";
    ctx.fillText("COMPARTIDO EN neXsv", 78, titleY);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 58px Arial";
    wrapCanvasText(ctx, title, 78, titleY + 92, 920, 72, 2);
    ctx.fillStyle = "#e6eef7";
    ctx.font = "400 34px Arial";
    wrapCanvasText(ctx, body, 78, titleY + 270, 920, 48, 4);

    ctx.fillStyle = "#f4cf52";
    ctx.beginPath();
    ctx.roundRect(78, 1660, 924, 112, 56);
    ctx.fill();
    ctx.fillStyle = "#14284b";
    ctx.font = "700 34px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Descúbrelo en neXsv", 540, 1730);
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "400 26px Arial";
    ctx.fillText("Una red privada de confianza y oportunidades", 78, 1830);

    const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("No se pudo exportar la imagen.")), "image/png"));
    return new File([blob], "nexsv-publicacion.png", { type: "image/png" });
}

async function copyPublicationLink(url) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        return true;
    }
    window.prompt("Copia el enlace de esta publicación:", url);
    return false;
}

function showShareOptions({ url, title, storyFile, button, id }) {
    document.getElementById("nexsvShareDialog")?.remove();
    const dialog = document.createElement("div");
    dialog.id = "nexsvShareDialog";
    dialog.className = "nexsv-share-overlay";
    dialog.innerHTML = `
      <section class="nexsv-share-card" role="dialog" aria-modal="true" aria-labelledby="nexsvShareTitle">
        <div class="nexsv-share-mark"><i class="fa-solid fa-share-nodes" aria-hidden="true"></i></div>
        <h2 id="nexsvShareTitle">Compartir publicación</h2>
        <p>Elige cómo quieres compartir este contenido.</p>
        <button type="button" class="nexsv-share-action nexsv-share-action-primary" data-share-image>
          <i class="fa-regular fa-image" aria-hidden="true"></i><span>Compartir imagen para historias</span>
        </button>
        <button type="button" class="nexsv-share-action" data-share-link>
          <i class="fa-solid fa-link" aria-hidden="true"></i><span>Compartir enlace</span>
        </button>
        <button type="button" class="nexsv-share-action" data-copy-link>
          <i class="fa-regular fa-copy" aria-hidden="true"></i><span>Copiar enlace</span>
        </button>
        <p class="nexsv-share-feedback" role="status" aria-live="polite"></p>
        <button type="button" class="nexsv-share-cancel" data-close>Cancelar</button>
      </section>`;
    document.body.appendChild(dialog);
    const close = () => dialog.remove();
    const feedback = dialog.querySelector(".nexsv-share-feedback");
    dialog.querySelector("[data-close]").addEventListener("click", close);
    dialog.addEventListener("click", event => { if (event.target === dialog) close(); });

    dialog.querySelector("[data-share-image]").addEventListener("click", async () => {
        try {
            if (!storyFile) throw new Error("No se pudo preparar la imagen. Intenta copiar el enlace.");
            if (!navigator.share || !navigator.canShare?.({ files: [storyFile] })) {
                const objectUrl = URL.createObjectURL(storyFile);
                const a = document.createElement("a");
                a.href = objectUrl;
                a.download = storyFile.name;
                a.click();
                setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
                feedback.textContent = "Imagen descargada. Adjunta el archivo en tu historia o estado.";
                return;
            }
            await navigator.share({ files: [storyFile], title });
            close();
            recordShare(id, button);
        } catch (error) {
            if (error?.name !== "AbortError") feedback.textContent = "No se pudo compartir la imagen. Puedes descargarla e intentarlo de nuevo.";
        }
    });

    dialog.querySelector("[data-share-link]").addEventListener("click", async () => {
        const shareButton = dialog.querySelector("[data-share-link]");
        shareButton.disabled = true;
        try {
            if (navigator.share) {
                await navigator.share({ url });
                close();
                recordShare(id, button);
            } else {
                const copied = await copyPublicationLink(url);
                feedback.textContent = copied ? "Enlace copiado. Pégalo en el chat o red social." : "Copia el enlace del cuadro para compartirlo.";
            }
        } catch (error) {
            if (error?.name === "AbortError") return;
            try {
                await copyPublicationLink(url);
                feedback.textContent = "No se abrió el menú de compartir. Copiamos el enlace para que puedas pegarlo.";
            } catch {
                feedback.textContent = "No se pudo abrir el menú ni copiar el enlace. Intenta con «Copiar enlace».";
            }
        } finally {
            shareButton.disabled = false;
        }
    });

    dialog.querySelector("[data-copy-link]").addEventListener("click", async event => {
        const copyButton = event.currentTarget;
        copyButton.disabled = true;
        try {
            const copied = await copyPublicationLink(url);
            feedback.textContent = copied
                ? "¡Enlace copiado! Ahora pégalo en WhatsApp o en la red social que prefieras."
                : "Selecciona y copia el enlace del cuadro que aparece.";
            copyButton.querySelector("span").textContent = copied ? "¡Enlace copiado!" : "Selecciona el enlace";
            if (copied) recordShare(id, button);
        } catch {
            feedback.textContent = "No se pudo copiar automáticamente. Mantén pulsado el enlace para copiarlo.";
            window.prompt("Copia el enlace de esta publicación:", url);
        } finally {
            copyButton.disabled = false;
        }
    });
}
async function recordShare(id, button) {
    const { error } = await supabase.rpc("record_community_publication_share", { p_publication_id: id });
    if (error) console.warn("No se pudo registrar el compartido:", error);
    const original = button.innerHTML;
    button.innerHTML = `<i class="fa-solid fa-check" aria-hidden="true"></i> Compartido`;
    setTimeout(() => { if (button.isConnected) button.innerHTML = original; }, 1600);
}

async function sharePublication(button) {
    const id = button.dataset.publicationId;
    if (!id) return;
    const url = publicationUrl(id);
    const card = document.querySelector(`#publicationList [data-publication-id="${CSS.escape(id)}"]`);
    const title = card?.querySelector("h2")?.textContent?.trim() || "Publicación en neXsv";
    button.disabled = true;
    try {
        let storyFile = null;
        if (card) {
            try { storyFile = await buildStoryImage(card); }
            catch (error) { console.warn("No se pudo generar la imagen para historias:", error); }
        }
        showShareOptions({ url, title, storyFile, button, id });
    } finally {
        button.disabled = false;
    }
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
