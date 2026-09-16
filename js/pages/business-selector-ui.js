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
            const logo = findBusinessLogo(option.textContent);
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
        setBusinessLogo(findBusinessLogo(selected.textContent));
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

    const sidebarObserver = new MutationObserver(() => {
        const sidebar = document.getElementById("businessSidebarIcon");
        const selected = selector.options[selector.selectedIndex];
        if (sidebar?.querySelector("img")?.alt?.startsWith("Foto de perfil") && selected) setBusinessLogo(findBusinessLogo(selected.textContent));
    });
    const sidebar = document.getElementById("businessSidebarIcon");
    if (sidebar) sidebarObserver.observe(sidebar, { childList: true, attributes: true, attributeFilter: ["class"] });

    function findBusinessLogo(name) {
        const wanted = String(name || "").trim();
        const cards = document.querySelectorAll(".business-item-card");
        for (const card of cards) {
            const title = card.querySelector(".business-item-heading h3")?.textContent?.trim();
            if (title === wanted) return card.querySelector(".business-item-logo img")?.src || "";
        }
        return "";
    }

    function setBusinessLogo(logo) {
        [document.getElementById("businessSwitcherIcon"), document.getElementById("businessSidebarIcon")].forEach(container => {
            if (!container) return;
            const current = container.querySelector("img");
            if (current && logo && current.src === logo) return;
            current?.remove();
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
