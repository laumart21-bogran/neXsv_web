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

function normalizeCategory(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function renderBusinesses() {
    const container = document.getElementById("contenedor");
    if (!container) return;

    const search = state.search.trim().toLowerCase();
    const selectedCategory = normalizeCategory(state.category);

    const filtered = state.businesses.filter((business) => {
        const matchesCategory =
            selectedCategory === "todos" ||
            normalizeCategory(business.categoria) === selectedCategory;

        const haystack = [business.nombre, business.categoria, business.descripcion]
            .join(" ")
            .toLowerCase();

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
        const id = escapeHtml(business.id || "");
        const name = escapeHtml(business.nombre || "Negocio");
        const description = escapeHtml(
            business.descripcion || "Conoce este negocio dentro de la comunidad neXsv."
        );
        const logo = String(business.logo || "").trim();

        return `
            <article class="card nex-public-business-card" data-business-id="${id}">
                <div class="logo-frame">
                    ${logo
                        ? `<img src="${escapeHtml(logo)}" alt="Logo de ${name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.hidden=false;">`
                        : ""}
                    <div class="nex-business-logo-fallback" ${logo ? "hidden" : ""} aria-hidden="true">
                        <i class="fa-solid fa-store"></i>
                    </div>
                    <span class="featured-badge"><i class="fa-solid fa-star"></i> Publicado</span>
                </div>

                <div class="card-content">
                    <h3>${name}</h3>

                    <div class="verified-badge">
                        <i class="fa-solid fa-check"></i> Verificado en neXsv
                    </div>

                    <p>${description}</p>

                    <div class="nex-public-business-actions">
                        <button type="button" class="btn btn-w nex-gated-action" data-gated-action="whatsapp" data-business-id="${id}">
                            WhatsApp
                        </button>
                        <button type="button" class="btn btn-v nex-gated-action" data-gated-action="detail" data-business-id="${id}">
                            Ver más
                        </button>
                        <button type="button" class="btn btn-share nex-gated-action" data-gated-action="share" data-business-id="${id}">
                            Compartir
                        </button>
                    </div>

                    <button type="button" class="btn-map nex-gated-action" data-gated-action="location" data-business-id="${id}">
                        <i class="fa-solid fa-location-dot"></i> Cómo llegar
                    </button>
                </div>
            </article>
        `;
    }).join("");
}

function setCategory(category, button) {
    state.category = category || "Todos";

    document.querySelectorAll(".categorias button").forEach((item) => {
        item.classList.remove("activo");
    });

    if (button) button.classList.add("activo");

    renderBusinesses();
}

function searchBusinesses() {
    const input = document.getElementById("buscador");
    state.search = input?.value || "";
    renderBusinesses();
}

function toggleMoreCategories(button) {
    const more = document.getElementById("masCategorias");
    if (!more) return;

    const isOpen = more.classList.toggle("mostrar");
    if (button) {
        button.classList.toggle("activo", isOpen);
    }
}

// Compatibilidad con cualquier llamada externa existente.
window.filtrar = setCategory;
window.buscar = searchBusinesses;
window.mostrarMas = toggleMoreCategories;

function bindDirectoryControls() {
    document.querySelectorAll(".categorias button").forEach((button) => {
        if (button.dataset.directoryBound === "true") return;
        button.dataset.directoryBound = "true";

        // Evitamos que los onclick antiguos de negocios.html llamen a otra lógica.
        button.removeAttribute("onclick");

        const text = button.textContent.trim();

        if (/^Todos$/i.test(text)) {
            button.addEventListener("click", (event) => {
                event.preventDefault();
                setCategory("Todos", button);
            });
            return;
        }

        if (/Más categorías/i.test(text)) {
            button.addEventListener("click", (event) => {
                event.preventDefault();
                toggleMoreCategories(button);
            });
            return;
        }

        const categoryMatch = text
            .replace(/^[^A-Za-zÁÉÍÓÚÜÑ]+/i, "")
            .trim();

        if (categoryMatch) {
            button.addEventListener("click", (event) => {
                event.preventDefault();
                setCategory(categoryMatch, button);
            });
        }
    });

    const input = document.getElementById("buscador");
    if (input && input.dataset.directoryBound !== "true") {
        input.dataset.directoryBound = "true";
        input.removeAttribute("onkeyup");
        input.addEventListener("input", searchBusinesses);
    }
}

function injectDirectoryStyles() {
    if (document.getElementById("nex-public-business-directory-styles")) return;

    const style = document.createElement("style");
    style.id = "nex-public-business-directory-styles";
    style.textContent = `
        .nex-public-business-card .logo-frame{position:relative;}
        .nex-public-business-card .featured-badge{z-index:2;}
        .nex-public-business-card .card-content h3{margin-top:0;}
        .nex-public-business-card .card-content p{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
        .nex-public-business-card .verified-badge{margin-bottom:12px;}
        .nex-public-business-actions{display:flex;gap:12px;margin-top:auto;flex-wrap:wrap;padding-top:20px;}
        .nex-public-business-actions .btn{border:0;}
        .nex-public-business-card .btn-map{border:0;outline:0;box-shadow:none;}
        .nex-gated-action{cursor:pointer;}
        .nex-business-logo-fallback{display:flex;align-items:center;justify-content:center;width:92px;height:92px;border-radius:24px;background:#eef3ff;color:#3155B6;font-size:32px;}
        .directory-empty{grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:180px;padding:32px;border:1px solid #e3e8f0;border-radius:22px;background:#fff;text-align:center;color:#64748B;}
        .directory-empty strong{color:#233A72;font-size:16px;}
        .directory-empty span{font-size:14px;}
        @media(max-width:768px){
            .nex-public-business-card .logo-frame{height:190px;}
            .nex-public-business-card .card-content h3{font-size:22px;}
            .nex-public-business-actions{gap:9px;}
        }
    `;
    document.head.appendChild(style);
}

async function initPublicBusinessDirectory() {
    const container = document.getElementById("contenedor");
    if (!container) return;

    injectDirectoryStyles();
    bindDirectoryControls();

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
