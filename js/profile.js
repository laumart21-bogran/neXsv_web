import { supabase } from "./core/supabase-client.js";
import profileService from "./services/profile.service.js";

let currentUser = null;
let currentProfile = null;

function initials(name = "Miembro") {
    return String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "M";
}

function setAvatar(photo, name) {
    const pairs = [["topAvatarImage", "topAvatarInitials"], ["sidebarAvatarImage", "sidebarAvatarInitials"]];
    pairs.forEach(([imageId, initialsId]) => {
        const image = document.getElementById(imageId);
        const fallback = document.getElementById(initialsId);
        if (photo) {
            if (image) { image.src = photo; image.style.display = "block"; }
            if (fallback) fallback.style.display = "none";
        } else {
            if (image) image.style.display = "none";
            if (fallback) { fallback.textContent = initials(name); fallback.style.display = "block"; }
        }
    });
    const profileImage = document.getElementById("profilePreview");
    const profileInitials = document.getElementById("profileInitials");
    if (profileImage && profileInitials) {
        if (photo) { profileImage.src = photo; profileImage.style.display = "block"; profileInitials.style.display = "none"; }
        else { profileImage.style.display = "none"; profileInitials.textContent = initials(name); profileInitials.style.display = "grid"; }
    }
}

function updateProgress(profile) {
    const fields = [profile?.nombre, profile?.apellido, profile?.telefono, profile?.ciudad, profile?.colegio, profile?.foto];
    const completed = fields.filter(value => String(value ?? "").trim()).length;
    const percent = Math.round((completed / fields.length) * 100);
    const fill = document.getElementById("profileProgressFill");
    const value = document.getElementById("profileProgressValue");
    const title = document.getElementById("profileProgressTitle");
    const text = document.getElementById("profileProgressText");
    if (fill) fill.style.width = `${percent}%`;
    if (value) value.textContent = `${percent}%`;
    if (percent === 100) {
        if (title) title.textContent = "Perfil completo ✓";
        if (text) text.textContent = "Tu información está completa para tu experiencia en neXsv.";
    } else {
        if (title) title.textContent = "Completa tu perfil";
        if (text) text.textContent = `Has completado el ${percent}% de tu perfil.`;
    }
}

function initializeMoreMenu() {
    const toggle = document.querySelector(".menu-more-toggle");
    const menu = document.getElementById("memberMoreMenu");
    const label = toggle?.querySelector("span");
    if (!toggle || !menu) return;
    toggle.addEventListener("click", () => {
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!expanded));
        menu.hidden = expanded;
        if (label) label.textContent = expanded ? "Mi actividad" : "Ocultar actividad";
        const icon = toggle.querySelector("i");
        if (icon) { icon.classList.toggle("fa-chevron-down", expanded); icon.classList.toggle("fa-chevron-up", !expanded); }
    });
}

function bindBusinessVisibility() {
    const link = document.getElementById("sidebarMyBusinesses");
    if (!link || !currentUser) return;
    profileService.getProfile(currentUser.id).then(() => supabase.from("businesses").select("id", { count: "exact", head: true }).eq("owner_id", currentUser.id)).then(({ count, error }) => {
        if (!error) link.hidden = !(Number(count) > 0);
    }).catch(() => { link.hidden = true; });
}

async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    currentUser = user;
    if (!user) { window.location.href = "acceso/login-usuario.html"; return; }

    let { data: perfil, error } = await profileService.getProfile(user.id);
    if (error) {
        const nuevo = await profileService.createProfile({ authUserId: user.id, nombre: "", apellido: "" });
        perfil = nuevo.data;
    }
    currentProfile = perfil || {};

    const nombreCompleto = `${currentProfile.nombre ?? ""} ${currentProfile.apellido ?? ""}`.trim() || user.user_metadata?.full_name || user.user_metadata?.name || "Miembro";
    document.getElementById("nombre").value = nombreCompleto;
    document.getElementById("correo").value = user.email ?? "";
    document.getElementById("telefono").value = currentProfile.telefono ?? "";
    document.getElementById("ciudad").value = currentProfile.ciudad ?? "";
    document.getElementById("colegio").value = currentProfile.colegio ?? "";
    document.getElementById("topUserName").textContent = nombreCompleto;
    document.getElementById("memberName").textContent = nombreCompleto;
    document.getElementById("memberEmail").textContent = user.email ?? "";
    setAvatar(currentProfile.foto, nombreCompleto);
    updateProgress(currentProfile);
    bindBusinessVisibility();
}

document.addEventListener("DOMContentLoaded", async () => {
    initializeMoreMenu();
    await loadProfile();

    document.getElementById("profileForm")?.addEventListener("submit", async event => {
        event.preventDefault();
        const message = document.getElementById("profileMessage");
        const nombreCompleto = document.getElementById("nombre").value.trim();
        const partes = nombreCompleto.split(/\s+/).filter(Boolean);
        const nombre = partes.shift() ?? "";
        const apellido = partes.join(" ");
        const telefono = document.getElementById("telefono").value.trim();
        const ciudad = document.getElementById("ciudad").value.trim();
        const colegio = document.getElementById("colegio").value;
        const resultado = await profileService.updateProfile(currentUser.id, { nombre, apellido, telefono, ciudad, colegio });
        if (resultado.error) {
            if (message) message.textContent = "No se pudieron guardar los cambios.";
            return;
        }
        currentProfile = { ...currentProfile, ...resultado.data };
        const nombreActualizado = `${nombre} ${apellido}`.trim() || "Miembro";
        document.getElementById("topUserName").textContent = nombreActualizado;
        document.getElementById("memberName").textContent = nombreActualizado;
        setAvatar(currentProfile.foto, nombreActualizado);
        updateProgress(currentProfile);
        if (message) message.textContent = "Cambios guardados.";
        setTimeout(() => { if (message) message.textContent = ""; }, 2500);
    });

    const changePhotoBtn = document.getElementById("changePhotoBtn");
    const profileImage = document.getElementById("profileImage");
    changePhotoBtn?.addEventListener("click", () => profileImage?.click());
    profileImage?.addEventListener("change", async () => {
        const file = profileImage.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alert("La fotografía no puede superar 5 MB."); return; }
        try {
            const url = await profileService.uploadProfilePhoto(currentUser.id, file);
            currentProfile.foto = url;
            const nombre = `${currentProfile.nombre ?? ""} ${currentProfile.apellido ?? ""}`.trim() || "Miembro";
            setAvatar(url, nombre);
            updateProgress(currentProfile);
        } catch (error) {
            console.error("Error al subir fotografía:", error);
            alert("No se pudo subir la fotografía.");
        }
    });
});
