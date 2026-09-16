import BusinessService from "../services/business.service.js";
import { supabase } from "../core/supabase-client.js";

let selectedBusiness = null;
let ownerId = null;

const fields = [
    ["businessEditName", "nombre"],
    ["businessEditCategory", "categoria"],
    ["businessEditStage", "etapa_negocio"],
    ["businessEditOffer", "tipo_oferta"],
    ["businessEditDescription", "descripcion"],
    ["businessEditDepartment", "departamento"],
    ["businessEditMunicipality", "municipio"],
    ["businessEditWhatsapp", "whatsapp"],
    ["businessEditEmail", "email"],
    ["businessEditMaps", "google_maps_url"],
    ["businessEditInstagram", "instagram"],
    ["businessEditFacebook", "facebook"],
    ["businessEditTikTok", "tiktok"],
    ["businessEditOtherSocial", "otra_red_social"],
    ["businessEditWebsite", "sitio_web"]
];

document.addEventListener("DOMContentLoaded", async () => {
    bindModal();
    await resolveSelectedBusiness();
});

async function resolveSelectedBusiness() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    ownerId = user.id;
    const businessId = sessionStorage.getItem("nexsv_selected_business_id");
    if (!businessId) return;
    const result = await BusinessService.getBusinessById(businessId);
    if (result.error || !result.data || result.data.owner_id !== user.id) return;
    selectedBusiness = result.data;
    document.getElementById("businessSidebarEdit")?.addEventListener("click", () => openEditor(selectedBusiness));
}

function bindModal() {
    const modal = document.getElementById("businessProfileModal");
    const close = document.getElementById("businessProfileModalClose");
    const cancel = document.getElementById("businessProfileCancel");
    const form = document.getElementById("businessProfileForm");
    const logoInput = document.getElementById("businessEditLogo");
    const preview = document.getElementById("businessEditLogoPreview");
    const remove = document.getElementById("businessEditLogoRemove");

    close?.addEventListener("click", closeEditor);
    cancel?.addEventListener("click", closeEditor);
    modal?.addEventListener("click", event => { if (event.target === modal) closeEditor(); });
    document.addEventListener("keydown", event => { if (event.key === "Escape" && !modal?.hidden) closeEditor(); });
    logoInput?.addEventListener("change", () => {
        const file = logoInput.files?.[0];
        if (!file) return;
        if (!validateLogo(file)) { logoInput.value = ""; return; }
        preview.src = URL.createObjectURL(file);
        preview.hidden = false;
        remove.hidden = false;
    });
    remove?.addEventListener("click", () => {
        logoInput.value = "";
        preview.src = "";
        preview.hidden = true;
        remove.hidden = true;
        logoInput.dataset.remove = "true";
    });
    form?.addEventListener("submit", saveBusiness);
}

function openEditor(business) {
    if (!business) return;
    selectedBusiness = business;
    const modal = document.getElementById("businessProfileModal");
    setText("businessProfileModalName", business.nombre || "Mi negocio");
    fields.forEach(([id, key]) => setInputValue(id, business[key] ?? ""));

    const logoInput = document.getElementById("businessEditLogo");
    const preview = document.getElementById("businessEditLogoPreview");
    const remove = document.getElementById("businessEditLogoRemove");
    if (logoInput) { logoInput.value = ""; delete logoInput.dataset.remove; }
    if (business.logo) { preview.src = business.logo; preview.hidden = false; remove.hidden = false; }
    else { preview.src = ""; preview.hidden = true; remove.hidden = true; }

    setText("businessProfileMessage", "");
    modal.hidden = false;
    document.body.classList.add("business-modal-open");
    document.getElementById("businessEditName")?.focus();
}

function closeEditor() {
    const modal = document.getElementById("businessProfileModal");
    if (modal) modal.hidden = true;
    document.body.classList.remove("business-modal-open");
}

async function saveBusiness(event) {
    event.preventDefault();
    if (!selectedBusiness || !ownerId) return;

    const form = event.currentTarget;
    const button = form.querySelector("button[type='submit']");
    const message = document.getElementById("businessProfileMessage");
    button.disabled = true;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando…';
    if (message) message.textContent = "";

    try {
        const data = {};
        fields.forEach(([id, key]) => {
            const value = document.getElementById(id)?.value.trim() || null;
            data[key] = value;
        });
        if (!data.nombre) throw new Error("El nombre del negocio es obligatorio.");
        if (!data.categoria) throw new Error("Selecciona una categoría.");

        const logoInput = document.getElementById("businessEditLogo");
        const file = logoInput?.files?.[0];
        if (file) data.logo = await uploadBusinessLogo(file);
        else if (logoInput?.dataset.remove === "true") data.logo = null;
        else data.logo = selectedBusiness.logo || null;

        const result = await BusinessService.updateBusiness(selectedBusiness.id, data);
        if (result.error) throw result.error;

        selectedBusiness = result.data;
        if (message) {
            message.className = "business-profile-message success";
            message.textContent = "Cambios guardados. Actualizando tu espacio…";
        }
        sessionStorage.setItem("nexsv_selected_business_id", selectedBusiness.id);
        setTimeout(() => window.location.reload(), 700);
    } catch (error) {
        console.error("Error al actualizar negocio:", error);
        if (message) {
            message.className = "business-profile-message error";
            message.textContent = error.message || "No fue posible guardar los cambios.";
        }
        button.disabled = false;
        button.innerHTML = '<i class="fa-solid fa-check"></i> Guardar cambios';
    }
}

async function uploadBusinessLogo(file) {
    if (!validateLogo(file)) throw new Error("El logo debe ser JPG, PNG o WEBP y no superar 5 MB.");
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${ownerId}/${selectedBusiness.id}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("business-logos").upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error("No se pudo subir el logo. Verifica que el almacenamiento de logos esté habilitado.");
    return supabase.storage.from("business-logos").getPublicUrl(path).data.publicUrl;
}

function validateLogo(file) {
    const valid = ["image/jpeg", "image/png", "image/webp"].includes(file.type) && file.size <= 5 * 1024 * 1024;
    if (!valid) alert("El logo debe ser JPG, PNG o WEBP y no superar 5 MB.");
    return valid;
}

function setInputValue(id, value) { const element = document.getElementById(id); if (element) element.value = value; }
function setText(id, value) { const element = document.getElementById(id); if (element) element.textContent = value; }
