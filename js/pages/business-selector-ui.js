document.addEventListener("DOMContentLoaded", () => {
    const row = document.getElementById("businessSelectorRow");
    const trigger = document.getElementById("businessSelectorTrigger");
    const triggerName = document.getElementById("businessSelectorTriggerName");
    const menu = document.getElementById("businessSelectorMenu");
    const selector = document.getElementById("businessSelector");
    if (!row || !trigger || !triggerName || !menu || !selector) return;

    const buildMenu = () => {
        if (!selector.options.length) return false;
        menu.innerHTML = Array.from(selector.options).map(option => {
            const logo = findBusinessLogo(option.value);
            return `<button type="button" class="business-selector-option" role="option" data-business-id="${escapeAttr(option.value)}"><span class="business-selector-option-logo">${logo ? `<img src="${escapeAttr(logo)}" alt="">` : `<i class="fa-solid fa-store"></i>`}</span><span>${escapeHtml(option.textContent)}</span>${option.selected ? '<i class="fa-solid fa-check business-selector-check"></i>' : ''}</button>`;
        }).join("");
        triggerName.textContent = selector.options[selector.selectedIndex]?.textContent || "Mi negocio";
        menu.querySelectorAll(".business-selector-option").forEach(option => option.addEventListener("click", () => {
            selector.value = option.dataset.businessId;
            selector.dispatchEvent(new Event("change", { bubbles: true }));
            closeMenu();
            syncMenu();
        }));
        return true;
    };

    const syncMenu = () => {
        const selected = selector.options[selector.selectedIndex];
        if (!selected) return;
        triggerName.textContent = selected.textContent;
        menu.querySelectorAll(".business-selector-option").forEach(option => {
            const active = option.dataset.businessId === selected.value;
            option.classList.toggle("selected", active);
            option.querySelector(".business-selector-check")?.remove();
            if (active) option.insertAdjacentHTML("beforeend", '<i class="fa-solid fa-check business-selector-check"></i>');
        });
        const business = findBusinessData(selected.value, selected.textContent);
        setBusinessLogo(business?.logo || findBusinessLogo(selected.value));
        setSidebarIdentity(business, selected.textContent);
    };

    const closeMenu = () => { menu.hidden = true; trigger.setAttribute("aria-expanded", "false"); };
    const openMenu = () => { menu.hidden = false; trigger.setAttribute("aria-expanded", "true"); };

    trigger.addEventListener("click", event => {
        event.stopPropagation();
        menu.hidden ? openMenu() : closeMenu();
    });
    selector.addEventListener("change", syncMenu);
    document.addEventListener("click", event => { if (!row.contains(event.target)) closeMenu(); });

    const observer = new MutationObserver(() => { if (buildMenu()) syncMenu(); });
    observer.observe(selector, { childList: true });
    if (buildMenu()) syncMenu();

    function findBusinessLogo(id) {
        const card = document.querySelector(`.business-item-card[data-business-id="${CSS.escape(id)}"]`);
        if (card?.querySelector(".business-item-logo img")?.src) return card.querySelector(".business-item-logo img").src;
        const cards = document.querySelectorAll(".business-item-card");
        const selectedName = selector.querySelector(`option[value="${CSS.escape(id)}"]`)?.textContent?.trim();
        for (const item of cards) {
            if (item.querySelector(".business-item-info h3")?.textContent?.trim() === selectedName) {
                return item.querySelector(".business-item-logo img")?.src || "";
            }
        }
        return "";
    }

    function findBusinessData(id, name) {
        const cards = document.querySelectorAll(".business-item-card");
        for (const card of cards) {
            if (card.querySelector(".business-item-info h3")?.textContent?.trim() === String(name).trim()) {
                return {
                    logo: card.querySelector(".business-item-logo img")?.src || "",
                    category: card.querySelector(".business-item-info .business-item-heading span")?.textContent?.trim() || "Negocio",
                    location: card.querySelector(".business-item-info > p")?.textContent?.replace(/^\s*/, "").trim() || ""
                };
            }
        }
        return null;
    }

    function setSidebarIdentity(business, fallbackName) {
        const name = business?.name || String(fallbackName || "Mi negocio").trim();
        const nameElement = document.getElementById("businessSidebarName");
        const categoryElement = document.getElementById("businessSidebarCategory");
        const descriptionElement = document.getElementById("businessSidebarDescription");
        if (nameElement) nameElement.textContent = name;
        if (categoryElement) categoryElement.textContent = business?.category || "Negocio";
        if (descriptionElement) descriptionElement.textContent = business?.location ? `Gestiona la presencia de este negocio en neXsv. · ${business.location}` : "Gestiona la presencia de este negocio en neXsv.";
    }

    function setBusinessLogo(logo) {
        [document.getElementById("businessSwitcherIcon"), document.getElementById("businessSidebarIcon")].forEach(container => {
            if (!container) return;
            container.querySelector("img")?.remove();
            container.classList.toggle("has-business-logo", Boolean(logo));
            if (logo) {
                const img = document.createElement("img");
                img.src = logo;
                img.alt = "Logo del negocio";
                container.prepend(img);
                container.querySelector("i")?.remove();
            } else if (!container.querySelector("i")) {
                container.innerHTML = '<i class="fa-solid fa-store"></i>';
            }
        });
    }

    function escapeHtml(value) { return String(value).replace(/[&<>\'\"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char])); }
    function escapeAttr(value) { return escapeHtml(value); }
});
