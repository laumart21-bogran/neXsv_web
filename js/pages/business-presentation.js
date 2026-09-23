import BusinessService from "../services/business.service.js";
import BusinessMediaService from "../services/business-media.service.js";
import { supabase } from "../core/supabase-client.js";

let currentBusiness = null;
let currentUser = null;

document.addEventListener("DOMContentLoaded", async () => {
    const businessId = sessionStorage.getItem("nexsv_selected_business_id");
    if (!businessId) return;

    const { data: userResult } = await supabase.auth.getUser();
    currentUser = userResult?.user || null;
    if (!currentUser) return;

    const result = await BusinessService.getBusinessById(businessId);
    if (result.error || !result.data || result.data.owner_id !== currentUser.id) return;

    currentBusiness = result.data;
    bindPresentationControls();
    await loadPresentation();
});

function bindPresentationControls() {
    document.getElementById("presentationLogoInput")?.addEventListener("change", async event => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        await replaceLogo(file);
    });

    document.querySelectorAll("[data-slot]").forEach(input => {
        input.addEventListener("change", async event => {
            const file = event.target.files?.[0];
            const slot = Number(event.target.dataset.slot);
            event.target.value = "";
            if (!file) return;
            await replaceGalleryImage(slot, file);
        });
    });
}

async function loadPresentation() {
    if (!currentBusiness) return;

    renderLogo(currentBusiness.logo);

    const mediaResult = await BusinessMediaService.getPresentationMedia(currentBusiness.id);
    if (mediaResult.error) {
        setStatus("No pudimos cargar las imágenes complementarias.", "error");
        return;
    }

    const bySlot = new Map((mediaResult.data || []).map(item => [Number(item.slot), item]));
    renderSlot(2, bySlot.get(2)?.url || "");
    renderSlot(3, bySlot.get(3)?.url || "");
}

async function replaceLogo(file) {
    if (!validateImage(file)) return;
    setStatus("Guardando el logotipo…");

    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = currentUser.id + "/" + currentBusiness.id + "/presentation-logo-" + crypto.randomUUID() + "." + extension;

    const { error: uploadError } = await supabase.storage
        .from("business-logos")
        .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
        setStatus("No se pudo guardar el logotipo. Verifica la configuración de imágenes del negocio.", "error");
        return;
    }

    const publicUrl = supabase.storage.from("business-logos").getPublicUrl(path).data.publicUrl;
    const result = await BusinessService.updateBusiness(currentBusiness.id, { logo: publicUrl });

    if (result.error) {
        await supabase.storage.from("business-logos").remove([path]);
        setStatus(result.error.message || "No se pudo actualizar el logotipo.", "error");
        return;
    }

    currentBusiness = result.data;
    renderLogo(publicUrl);
    setStatus("Logotipo actualizado. Ya se reflejará en la presentación pública.", "success");
    updateMiniCard();
}

async function replaceGalleryImage(slot, file) {
    if (!validateImage(file)) return;
    setStatus("Guardando la imagen complementaria…");

    const result = await BusinessMediaService.replacePresentationImage(currentBusiness.id, slot, file);
    if (result.error) {
        setStatus(result.error.message || "No se pudo guardar la imagen.", "error");
        return;
    }

    renderSlot(slot, result.data?.url || "");
    setStatus("Imagen actualizada. Ya se reflejará en la presentación pública.", "success");
}

function renderLogo(url) {
    renderMedia("presentationSlot1Preview", url, "fa-solid fa-building");
    renderMedia("presentationMiniCover", url, "fa-solid fa-store");
}

function renderSlot(slot, url) {
    renderMedia("presentationSlot" + slot + "Preview", url, "fa-regular fa-image");
}

function renderMedia(id, url, iconClass) {
    const element = document.getElementById(id);
    if (!element) return;
    element.innerHTML = url
        ? '<img src="' + escapeAttr(url) + '" alt="Imagen de presentación del negocio">'
        : '<i class="' + iconClass + '"></i>';
}

function updateMiniCard() {
    const name = document.getElementById("presentationMiniName");
    if (name) name.textContent = currentBusiness?.nombre || "Tu negocio";
}

function validateImage(file) {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
        setStatus("Solo se permiten imágenes JPG, PNG o WEBP.", "error");
        return false;
    }
    if (file.size > 5 * 1024 * 1024) {
        setStatus("La imagen no puede superar 5 MB.", "error");
        return false;
    }
    return true;
}

function setStatus(message, type = "") {
    const element = document.getElementById("businessPresentationStatus");
    if (!element) return;
    element.textContent = message;
    element.className = "business-presentation-status " + type;
}

function escapeAttr(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
