import BusinessService from "../services/business.service.js";
import AuthService from "../auth/auth.service.js";

const state = { businesses: [], category: "Todos", search: "" };

const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

const normalize = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

function businessUrl(id, action = "") {
    const url = `negocio.html?id=${encodeURIComponent(id)}`;
    return action ? `${url}&action=${encodeURIComponent(action)}` : url;
}

function loginUrl(id, action) {
    return `acceso/login-usuario.html?return=${encodeURIComponent(businessUrl(id, action))}`;
}

function matches(business) {
    const categoryMatch = normalize(state.category) === "todos" || normalize(business.categoria) === normalize(state.category);
    const term = state.search.trim().toLowerCase();
    const searchMatch = !term || [business.nombre, business.categoria, business.descripcion]
        .join(" ")
        .toLowerCase()
        .includes(term);
    return categoryMatch && searchMatch;
}

function render() {
    const container = document.getElementById("contenedor");
    if (!container) return;

    const visible = state.businesses.filter(matches);
    if (!visible.length) {
        container.innerHTML = `<div class="directory-empty"><strong>No encontramos negocios con esos criterios.</strong><span>Prueba con otra búsqueda o categoría.</span></div>`;
        return;
    }

    container.innerHTML = visible.map((business) => {
        const id = escapeHtml(business.id);
        const name = escapeHtml(business.nombre || "Negocio");
        const category = escapeHtml(business.categoria || "Negocio");
        const description = escapeHtml(business.descripcion || "Conoce este negocio dentro de la comunidad neXsv.");
        const logo = String(business.logo || "").trim();

        return `<article class="card nex-business-card" data-business-id="${id}">
            <div class="logo-frame">
                ${logo ? `<img src="${escapeHtml(logo)}" alt="Logo de ${name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.hidden=false;">` : ""}
                <div class="business-logo-fallback" ${logo ? "hidden" : ""}><i class="fa-solid fa-store"></i></div>
                <span class="featured-badge"><i class="fa-solid fa-star"></i> Publicado</span>
            </div>
            <div class="card-content">
                <span class="business-category">${category}</span>
                <h3>${name}</h3>
                <div class="verified-badge"><i class="fa-solid fa-check"></i> Verificado en neXsv</div>
                <p>${description}</p>
                <div class="business-actions">
                    <button type="button" data-action="whatsapp" data-id="${id}" class="btn btn-w">WhatsApp</button>
                    <button type="button" data-action="detail" data-id="${id}" class="btn btn-v">Ver más</button>
                    <button type="button" data-action="share" data-id="${id}" class="btn btn-share">Compartir</button>
                </div>
                <button type="button" data-action="location" data-id="${id}" class="btn-map"><i class="fa-solid fa-location-dot"></i> Cómo llegar</button>
            </div>
        </article>`;
    }).join("");
}

function setCategory(category, button) {
    state.category = category || "Todos";
    document.querySelectorAll(".categoria-btn[data-category]").forEach((item) => item.classList.remove("activo"));
    if (button) button.classList.add("activo");
    render();
}

function toggleMoreCategories() {
    const more = document.getElementById("masCategorias");
    const button = document.getElementById("btnMasCategorias");
    if (!more) return;
    more.classList.toggle("mostrar");
    if (button) button.classList.toggle("activo", more.classList.contains("mostrar"));
}

async function authenticated() {
    const { data } = await AuthService.getSession();
    return Boolean(data?.session);
}

async function shareBusiness(id) {
    const url = new URL(businessUrl(id), window.location.href).href;
    const data = { title: "Negocio en neXsv", text: "Conoce este negocio dentro de neXsv.", url };
    if (navigator.share) {
        try { await navigator.share(data); } catch (_) {}
        return;
    }
    try {
        await navigator.clipboard.writeText(url);
        alert("Enlace del negocio copiado.");
    } catch (_) {
        window.prompt("Copia este enlace:", url);
    }
}

async function handleAction(action, id) {
    if (!id) return;
    if (action === "share") {
        await shareBusiness(id);
        return;
    }
    if (!(await authenticated())) {
        window.location.href = loginUrl(id, action);
        return;
    }
    window.location.href = businessUrl(id, action === "detail" ? "" : action);
}

function bindEvents() {
    const input = document.getElementById("buscador");
    if (input) input.addEventListener("input", () => {
        state.search = input.value;
        render();
    });

    document.querySelectorAll(".categoria-btn[data-category]").forEach((button) => {
        button.addEventListener("click", () => setCategory(button.dataset.category, button));
    });

    document.getElementById("btnMasCategorias")?.addEventListener("click", toggleMoreCategories);

    const container = document.getElementById("contenedor");
    if (container) container.addEventListener("click", (event) => {
        const button = event.target.closest("[data-action]");
        if (!button) return;
        handleAction(button.dataset.action, button.dataset.id);
    });
}

async function init() {
    const container = document.getElementById("contenedor");
    if (!container) return;

    container.innerHTML = `<div class="directory-empty"><strong>Cargando negocios publicados…</strong><span>Estamos consultando el directorio de neXsv.</span></div>`;

    const { data, error } = await BusinessService.getPublicBusinessDirectory();
    if (error) {
        console.error("Error cargando el directorio público de negocios:", error);
        container.innerHTML = `<div class="directory-empty"><strong>No pudimos cargar los negocios.</strong><span>Intenta nuevamente en unos momentos.</span></div>`;
        return;
    }

    state.businesses = Array.isArray(data) ? data : [];
    bindEvents();
    render();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
else init();
