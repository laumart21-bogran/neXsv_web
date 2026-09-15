import BusinessService from "../services/business.service.js";

const state = {
    businesses: [],
    category: "Todos",
    search: ""
};

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function renderBusinesses() {
    const container = document.getElementById("contenedor");
    if (!container) return;

    const search = state.search.trim().toLowerCase();
    const filtered = state.businesses.filter((business) => {
        const matchesCategory =
            state.category === "Todos" ||
            String(business.categoria || "").toLowerCase() === state.category.toLowerCase();

        const haystack = [
            business.nombre,
            business.categoria,
            business.descripcion
        ].join(" ").toLowerCase();

        return matchesCategory && (!search || haystack.includes(search));
    });

    if (!filtered.length) {
        container.innerHTML = `
            <div class="directory-empty" role="status">
                <strong>No encontramos negocios con esos criterios.</strong>
                <span>Prueba con otra búsqueda o categoría.</span>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map((business) => {
        const name = escapeHtml(business.nombre || "Negocio");
        const category = escapeHtml(business.categoria || "Negocio");
        const description = escapeHtml(business.descripcion || "Conoce este negocio dentro de la comunidad neXsv.");
        const logo = String(business.logo || "").trim();

        return `
            <article class="card nex-public-business-card">
                <div class="logo-frame">
                    ${logo
                        ? `<img src="${escapeHtml(logo)}" alt="Logo de ${name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.hidden=false;">`
                        : ""}
                    <div class="nex-business-logo-fallback" ${logo ? "hidden" : ""} aria-hidden="true">
                        <i class="fa-solid fa-store"></i>
                    </div>
                </div>
                <div class="card-content">
                    <span class="badge">${category}</span>
                    <h3>${name}</h3>
                    <p>${description}</p>
                    <div class="nex-public-business-note">
                        <i class="fa-solid fa-circle-check"></i>
                        Negocio publicado en neXsv
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

function setCategory(category, button) {
    state.category = category;
    document.querySelectorAll(".categorias button").forEach((item) => item.classList.remove("activo"));
    if (button) button.classList.add("activo");
    renderBusinesses();
}

function searchBusinesses() {
    const input = document.getElementById("buscador");
    state.search = input?.value || "";
    renderBusinesses();
}

window.filtrar = setCategory;
window.buscar = searchBusinesses;

function injectDirectoryStyles() {
    if (document.getElementById("nex-public-business-directory-styles")) return;

    const style = document.createElement("style");
    style.id = "nex-public-business-directory-styles";
    style.textContent = `
        .nex-public-business-card .card-content{position:relative;}
        .nex-public-business-card .badge{z-index:2;}
        .nex-public-business-card .card-content h3{margin-top:4px;}
        .nex-business-logo-fallback{display:flex;align-items:center;justify-content:center;width:92px;height:92px;border-radius:24px;background:#eef3ff;color:#3155B6;font-size:32px;}
        .nex-public-business-note{display:flex;align-items:center;gap:7px;margin-top:auto;padding-top:18px;color:#18A978;font-size:12px;font-weight:700;}
        .nex-public-business-note i{font-size:13px;}
        .directory-empty{grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:180px;padding:32px;border:1px solid #e3e8f0;border-radius:22px;background:#fff;text-align:center;color:#64748B;}
        .directory-empty strong{color:#233A72;font-size:16px;}
        .directory-empty span{font-size:14px;}
        @media(max-width:768px){.nex-public-business-card .logo-frame{height:190px;}.nex-public-business-card .card-content h3{font-size:22px;}}
    `;
    document.head.appendChild(style);
}

async function initPublicBusinessDirectory() {
    const container = document.getElementById("contenedor");
    if (!container) return;

    injectDirectoryStyles();
    container.innerHTML = `
        <div class="directory-empty" role="status">
            <strong>Cargando negocios publicados…</strong>
            <span>Estamos consultando el directorio de neXsv.</span>
        </div>
    `;

    const { data, error } = await BusinessService.getPublicBusinessDirectory();

    if (error) {
        console.error("Error cargando el directorio público de negocios:", error);
        container.innerHTML = `
            <div class="directory-empty" role="alert">
                <strong>No pudimos cargar los negocios.</strong>
                <span>Intenta nuevamente en unos momentos.</span>
            </div>
        `;
        return;
    }

    state.businesses = Array.isArray(data) ? data : [];
    renderBusinesses();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPublicBusinessDirectory, { once: true });
} else {
    initPublicBusinessDirectory();
}
